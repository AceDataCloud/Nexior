# Desktop release (Windows + macOS)

The desktop client is the existing Vue/Vite app packaged with Electron. Build,
sign/notarize, and publish are automated in
[`.github/workflows/release-desktop.yaml`](../.github/workflows/release-desktop.yaml); auto-update
is electron-updater against a COS-hosted feed.

See the design + adversarial review under `plans/nexior-desktop` (Index repo).

## Channels & feed

| Channel  | Manifest      | Audience            |
| -------- | ------------- | ------------------- |
| `latest` | `latest*.yml` | stable / production |
| `beta`   | `beta*.yml`   | pre-release testers |

Feed base: `https://cdn.acedata.cloud/nexior/desktop` (COS bucket
`acedatacloud2-1256437459`, prefix `nexior/desktop`). electron-updater fetches
`<base>/<channel>.yml`. Artifacts are uploaded **before** the manifest, so the
feed never points at a missing file. **Rollback = re-upload the previous
manifest** (artifacts are immutable, never deleted).

## One-time setup

1. **Admin-approval gate** — in **Settings → Environments**, create
   `desktop-release` and add the admins as **required reviewers**. The `build`
   job references this environment, so every publish pauses for a human
   approval before any signed artifact reaches the live feed.
2. **Secrets** (repo or environment):
   - `TENCENT_CLOUD_SECRET_ID` / `TENCENT_CLOUD_SECRET_KEY` — COS upload (already set org-wide for the OTA pipeline)
   - `VITE_STRIPE_PUBLISHABLE_KEY` — renderer build (already set) ✅
   - **Notarization (macOS)** reuses the iOS pipeline's existing App Store Connect
     API-key secrets — **nothing new to add**: `APP_STORE_CONNECT_KEY_BASE64`,
     `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `IOS_TEAM_ID`. ✅
   - **Code-signing certs — the only NEW secrets you must add** (and the only
     blocker for a *stable* release):
     - `WIN_CSC_LINK` / `WIN_CSC_KEY_PASSWORD` — Windows OV/EV `.pfx` (base64) + password
     - `MAC_CSC_LINK` / `MAC_CSC_KEY_PASSWORD` — macOS **Developer ID Application** `.p12` (base64) + password
       (the existing `IOS_P12` is an iOS *distribution* cert and will **not** work for a Developer ID DMG)

   > **Beta runs without any signing cert.** When `WIN_CSC_LINK` / `MAC_CSC_LINK`
   > are absent the `beta` channel builds **unsigned** so you can exercise the
   > whole build → COS-publish path today. The `latest` (stable) channel
   > **refuses** to build unsigned. Auto-update *apply* can only be validated on
   > a signed build.

## Cutting a release

The normal product release is aggregated once per day. Actions → **Release · Daily**
runs Beachball against the accumulated change files, publishes npm, creates a
draft GitHub Release, and calls this workflow to attach Windows and both macOS
installers. The Release becomes public only after Web dist, APK, EXE, x64 DMG,
and arm64 DMG all exist. Run **Release · Daily** manually for an urgent full release.

Desktop auto-update feeds remain separate:

- **Beta (signed or unsigned):** Actions → **Release · Desktop** → _Run workflow_ → channel `beta`.
- **Stable (requires signing certs):** push a `desktop-v*` tag or run **Release · Desktop**
  with channel `latest`.

Flow: `e2e` smoke → `build` matrix → `electron-builder` → workflow artifacts.
A daily product release attaches installers to its draft GitHub Release without
changing the COS feed. A direct `Release · Desktop` run publishes to COS behind the
`desktop-release` approval gate. `dry_run` skips that COS publish.

The signed app exposes **Check for updates** in the user profile menu. It checks
the channel manifest, downloads in the main process, shows progress in the menu,
and only calls `quitAndInstall()` after the user confirms **Restart and install**.
The renderer never receives an installer path or permission to change the feed.

Before approving the first live feed publish, test a signed old → new round trip
on Windows, Intel macOS, and Apple Silicon macOS. The build must contain the NSIS
installer + blockmap, both macOS DMGs, both macOS ZIP update payloads + blockmaps,
and the platform manifests. After restart, verify the app version actually
changed and the login/local-task data survived. A download alone is not proof of
a working update; unsigned macOS builds can download and then silently fail to
replace the app.

## Cross-repo prerequisites for desktop login

Desktop OAuth needs three changes outside this repo (tracked in the plan's
Phase 0). Until they land, the shell + email/password may work but social login
can't complete:

1. **AuthBackend** — allow-list the `acedata-desktop` `native_redirect` scheme.
2. **AuthBackend** — propagate `state` through to the `native_redirect` callback
   (the desktop main process validates it; mobile never carried `state`).
3. **AuthFrontend** — add `app://bundle` to the login page's CSP
   `frame-ancestors` (and confirm the parent origin isn't normalized to `null`).

## Local dev

```bash
npm run build:electron     # VITE_SURFACE=desktop → dist-electron/
npm run start:electron     # compile main + copy renderer + launch Electron
npm run test:e2e:desktop   # Playwright boot smoke (needs a display)
```

## Not yet wired (follow-ups)

- Desktop download entries on the Hub / marketing site (`src/constants/mobile.ts`
  has only mobile URLs today).
- A backend `desktop` platform row for the version gate
  (`appVersionOperator.get('nexior', 'desktop')`).
- Refresh-token at rest via Electron `safeStorage` (currently localStorage under
  `app://`, same as web).
