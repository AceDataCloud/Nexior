# Desktop release (Windows + macOS)

The desktop client is the existing Vue/Vite app packaged with Electron. Build,
signing, notarization, and GitHub distribution are automated in
[`.github/workflows/release-desktop.yaml`](../.github/workflows/release-desktop.yaml).

See the design + adversarial review under `plans/nexior-desktop` (Index repo).

## Download locations

Desktop releases are GitHub-only. There is no separate update feed and the app
does not download or install updates automatically.

| Source | Retention | Use |
| --- | --- | --- |
| **Release · Desktop** workflow artifacts | 30 days | Ad-hoc builds and manual testing |
| GitHub Releases | Long-term | Public versioned downloads produced by the daily release |

A manual workflow run produces three artifact bundles: Windows x64, macOS Intel,
and macOS Apple Silicon. Open the completed run in GitHub Actions and download
the required bundle from **Artifacts**.

## Required secrets

- `VITE_STRIPE_PUBLISHABLE_KEY` — renderer build.
- `WIN_CSC_LINK` / `WIN_CSC_KEY_PASSWORD` — Windows OV/EV `.pfx` and password.
- `MAC_CSC_LINK` / `MAC_CSC_KEY_PASSWORD` — macOS Developer ID Application `.p12` and password.
- `APP_STORE_CONNECT_KEY_BASE64`, `APP_STORE_CONNECT_KEY_ID`,
  `APP_STORE_CONNECT_ISSUER_ID`, `IOS_TEAM_ID` — macOS notarization via the
  existing App Store Connect API key.

When a platform certificate is absent, a manual build still produces an unsigned
installer for testing. Public desktop releases should be signed and notarized
before users download them.

## Building installers manually

In GitHub Actions, open **Release · Desktop**, choose **Run workflow**, and run it
without parameters. The flow is:

`E2E smoke → Windows/macOS build matrix → installer verification → GitHub artifacts`

The workflow generates:

- Windows x64: NSIS `.exe`
- macOS Intel: `.dmg`
- macOS Apple Silicon: `-arm64.dmg`

## Cutting a public release

The normal product release is aggregated once per day. **Release · Daily** runs
Beachball, creates a draft GitHub Release, and calls the desktop workflow to
attach Windows and both macOS installers. The Release becomes public only after
the web archive, Android APK, Windows EXE, Intel DMG, and Apple Silicon DMG all
exist.

Run **Release · Daily** manually for an urgent full release. Users upgrade by
downloading the desired installer from the GitHub Release and running it.

## Verification

Before publishing a public Release:

1. Confirm the E2E smoke and all three build jobs passed.
2. Verify the Windows `.exe`, Intel `.dmg`, and Apple Silicon `-arm64.dmg` exist.
3. Verify Auth, local tools, and scheduled tasks still work after installing over
   the prior version.
4. Confirm the installed app reports the new version and preserves user data.

## Cross-repo prerequisites for desktop login

Desktop OAuth needs three changes outside this repo (tracked in the plan's
Phase 0). Until they land, the shell + email/password may work but social login
cannot complete:

1. **AuthBackend** — allow-list the `acedata-desktop` `native_redirect` scheme.
2. **AuthBackend** — propagate `state` through to the `native_redirect` callback.
3. **AuthFrontend** — add `app://bundle` to the login page's CSP
   `frame-ancestors`.

## Local dev

```bash
npm run build:electron     # VITE_SURFACE=desktop → dist-electron/
npm run start:electron     # compile main + copy renderer + launch Electron
npm run test:e2e:desktop   # Playwright boot smoke (needs a display)
```

## Not yet wired

- Desktop download entries on the Hub / marketing site (`src/constants/mobile.ts`
  has only mobile URLs today).
- A backend `desktop` platform row for the version gate
  (`appVersionOperator.get('nexior', 'desktop')`).
- Refresh-token at rest via Electron `safeStorage` (currently localStorage under
  `app://`, same as web).
