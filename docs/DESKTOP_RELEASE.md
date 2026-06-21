# Desktop release (Windows + macOS)

The desktop client is the existing Vue/Vite app packaged with Electron. Build,
sign/notarize, and publish are automated in
[`.github/workflows/desktop.yml`](../.github/workflows/desktop.yml); auto-update
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
   - `TENCENT_CLOUD_SECRET_ID` / `TENCENT_CLOUD_SECRET_KEY` — COS upload
   - `VITE_STRIPE_PUBLISHABLE_KEY` — renderer build
   - `WIN_CSC_LINK` / `WIN_CSC_KEY_PASSWORD` — Windows OV/EV `.pfx` (base64) + password
   - `MAC_CSC_LINK` / `MAC_CSC_KEY_PASSWORD` — macOS Developer ID `.p12` (base64) + password
   - `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` / `APPLE_TEAM_ID` — notarization

## Cutting a release

- **Beta:** Actions → **Desktop** → _Run workflow_ → channel `beta`.
- **Stable:** push a `desktop-v*` tag (e.g. `desktop-v3.282.4`) **or** run the
  workflow with channel `latest`.

Flow: `e2e` smoke (Linux/xvfb) → wait for **admin approval** → `build` matrix
(Windows + macOS): `build:electron` → `compile:electron` → `copy-renderer` →
`electron-builder` (signs; macOS also notarizes + staples, verified by
`stapler validate`) → upload artifacts → publish to COS.

`workflow_dispatch` has a `dry_run` toggle (build + sign, skip the COS upload).

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
