# Nexior Android Release Runbook

Operator-facing guide for cutting an Android release of Nexior
(`com.acedatacloud.nexior`) through the validated CI pipeline.

For one-time onboarding (keystore generation, GitHub Secrets, Play
Console + GCP service account setup) see
[MOBILE_RELEASE.md](./MOBILE_RELEASE.md). This document covers the
**day-to-day flow** and the gotchas we hit on the way to validating
the pipeline end-to-end on **2026-05-23 (run [26324168813][run-3351])**.

[run-3351]: https://github.com/AceDataCloud/Nexior/actions/runs/26324168813

## Pipeline overview

```
package.json (single source of truth for version)
        │
        │  node scripts/sync-native-version.js
        ▼
android/app/build.gradle       (versionCode = major*10000 + minor*100 + patch)
ios/App/.../project.pbxproj    (MARKETING_VERSION + CURRENT_PROJECT_VERSION)
src/constants/mobile.ts        (MOBILE_APP_VERSION)
        │
        │  git tag android-v<version> && git push
        ▼
.github/workflows/build-android.yaml
   ├── checkout
   ├── setup-node@v6  (Node 22)
   ├── setup-java@v5  (Temurin 21)            ← Capacitor 8 requires Java 21
   ├── npm ci
   ├── npm run pack:android                   (web build → android/app/src/main/assets)
   ├── npx cap sync android
   ├── decode keystore (from ANDROID_KEYSTORE_BASE64)
   ├── ./gradlew bundleRelease -P<creds>      (signed AAB)
   ├── ./gradlew assembleRelease              (signed APK, artifact only)
   ├── upload APK + AAB as workflow artifacts
   ├── pick track  (push tag → internal, dispatch → input)
   └── r0adkll/upload-google-play@v1          (tracks: <chosen>)
```

Total runtime ≈ 4 minutes on a `ubuntu-latest` runner.

## Daily release flow

```bash
# 1. Pull main and create a release branch
git checkout main && git pull --ff-only origin main
git checkout -b chore/bump-version-x-y-z

# 2. Bump package.json — pick exactly one
npm version patch --no-git-tag-version          # 3.35.1 → 3.35.2
# npm version minor --no-git-tag-version        # 3.35.x → 3.36.0
# npm version major --no-git-tag-version        # 3.x.x  → 4.0.0

# 3. Propagate the version into native projects
node scripts/sync-native-version.js
# Writes android/app/build.gradle, ios project.pbxproj, src/constants/mobile.ts.

# 4. Commit, push, open PR
git add -A
git commit -m "chore(release): bump version to x.y.z"
git push -u origin chore/bump-version-x-y-z
gh pr create --base main --title "chore(release): bump version to x.y.z" --fill

# 5. Squash-merge once CI is green + reviewed

# 6. Tag the merged commit on main → CI auto-uploads to the internal track
git checkout main && git pull --ff-only origin main
git tag android-vX.Y.Z
git push origin android-vX.Y.Z
gh run list --workflow build-android.yaml --limit 1   # confirm run started
```

### Promote internal → production

Two options:

- **Manual (preferred for first releases)** — open Play Console,
  Release → Testing → Internal testing → "Promote release" → choose
  **Production** track → rollout %.
- **Workflow dispatch** — re-run the pipeline pinned at any commit
  with `track=production`:
  ```bash
  gh workflow run build-android.yaml -R AceDataCloud/Nexior \
    -f track=production -f release_status=draft
  ```
  `release_status=draft` lets you review the rollout in Play Console
  before publishing. Use `release_status=completed` for an
  immediate 100 % rollout.

## Versioning rules

`versionCode` is derived as `major * 10000 + minor * 100 + patch`.
This must be **strictly monotonically increasing** for the Play
Store — that is the only constraint Google enforces.

| package.json | versionName | versionCode |
| --- | --- | --- |
| `3.35.0` | `3.35.0` | `33500` |
| `3.35.1` | `3.35.1` | `33501` |
| `3.36.0` | `3.36.0` | `33600` |
| `4.0.0`  | `4.0.0`  | `40000` |

**Implication**: bumping the patch component gives you up to 99 builds
before you have to bump the minor. If a code is consumed in any track
(internal, closed, open, production) it is **globally consumed for the
package** — you cannot reuse it on another track.

## Common CI failures (and what they actually mean)

### 1. `Version code 33XXX has already been used`

**Not a pipeline bug.** The build, signing, and Android Publisher API
call all succeeded — Play Store rejected the upload because that
versionCode was previously consumed (on any track, including manual
Console uploads).

**Fix:** bump `package.json` patch, re-run the flow above.

### 2. `Unsupported class file major version XX` during `bundleRelease`

Capacitor 8 hard-codes `JavaVersion.VERSION_21` into the auto-generated
`android/app/capacitor.build.gradle`. The CI workflow must therefore
use Java 21 (`JAVA_VERSION: '21'` in `build-android.yaml`). If you see
this error, check that `actions/setup-java@v5` is pinned to 21 — never
17.

### 3. `Google Play Android Developer API has not been used in project … before or it is disabled`

The service account upload step (`r0adkll/upload-google-play@v1`)
calls Google's Android Publisher API. Enable it once per GCP project:

```bash
gcloud services enable androidpublisher.googleapis.com \
  --project=acedatacloud
```

(GCP project: `acedatacloud` / number `453264340226`.)

### 4. Signing fails with `Keystore was tampered with, or password was incorrect`

All five Android secrets must be present **and non-empty**:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`

`gh secret list` will say a secret exists even when its value is
empty — only the workflow log proves the value made it through. If
in doubt, re-set the secret with a fresh `gh secret set ... < file`.

### 5. Local signed build (debug equivalent of CI)

`android/app/build.gradle` resolves each release-signing credential in
this order, first non-null wins:

```
android/key.properties   (gitignored, local dev convenience)
  └─→ project.findProperty('RELEASE_…')   (Gradle -P… arg, what CI uses)
       └─→ System.getenv('RELEASE_…')     (raw env var)
```

To reproduce a signed AAB locally, copy `android/key.properties.example`
to `android/key.properties` and fill in the four values, then:

```bash
cd android
./gradlew bundleRelease
ls -lh app/build/outputs/bundle/release/app-release.aab
```

CI bypasses `key.properties` by passing all four `-P` properties on
the Gradle command line.

## What was validated on 2026-05-23

- PR [#785](https://github.com/AceDataCloud/Nexior/pull/785) — Java
  17 → 21 in `build-android.yaml` (Capacitor 8 hard requirement).
- PR [#786](https://github.com/AceDataCloud/Nexior/pull/786) —
  three-source signing resolution in `android/app/build.gradle` +
  workflow migration from deprecated `track:` to `tracks:` input on
  `r0adkll/upload-google-play@v1`.
- PR [#787](https://github.com/AceDataCloud/Nexior/pull/787) — bump
  to `3.35.1 / 33501` and full E2E validation: tag
  `android-v3.35.1` ran the pipeline ✓ end-to-end in 4 m 0 s,
  including `Upload to Play Store` to the **internal** track.
- Smoke runs (Production submission `3.35.0 / 33500` was made
  manually before CI was operational and remains in Google review):
  - [26323464027][s1] — early failure (Java 17 mismatch)
  - [26323659308][s2] — early failure (Android Publisher API disabled)
  - [26323829265][s3] — all 16 build steps ✓, blocked at upload by
    duplicate versionCode 33500 (data-validation rejection, not a
    pipeline bug).

[s1]: https://github.com/AceDataCloud/Nexior/actions/runs/26323464027
[s2]: https://github.com/AceDataCloud/Nexior/actions/runs/26323659308
[s3]: https://github.com/AceDataCloud/Nexior/actions/runs/26323829265

## Future work / known followups

- `actions/checkout@v4` and `actions/upload-artifact@v4` still run on
  Node 20 (deprecation warning). They'll be forced to Node 24 on
  2026-06-02 by GitHub. Track upstream `@v5`/`@v6` releases and bump
  the workflow when published — until then the warning is harmless.
- iOS pipeline is wired but has not been validated end-to-end; see
  [MOBILE_RELEASE.md](./MOBILE_RELEASE.md) §2 for one-time setup and
  [ios-release.md](./ios-release.md) for the operator notes (when
  that file lands).
