# Cue

Cue is a mobile-first streaming planner for finding something to watch and making plans together. This is **Phase 2: services, search and watchlist**, with live TMDB search, title details, regional availability, provider selection and local watchlist management. It is not the complete MVP.

## Stack and architecture

Ionic React 8, React 19, TypeScript, Vite 7, Ionic Router with React Router 5, Capacitor 8, and vite-plugin-pwa. Node 24 LTS is used locally and in CI. Ionic 8's router requires React Router 5; upgrade them together. No Bootstrap, authentication, or cloud service is included.

- `src/app/`: application composition, Ionic tabs, injected repository and shared state.
- `src/components/`: reusable Ionic page and empty-state shell.
- `src/features/onboarding/`: primary profile editing, provider selection and API credits.
- `src/features/search/`, `watchlist/`, `plan-tonight/`, `calendar/`: search and watchlist features; planning and calendar remain placeholders.
- `src/pages/`: Home.
- `src/domain/`: framework-independent typed models, statuses, composite media IDs.
- `src/data/`: asynchronous `CueRepository` contract and versioned localStorage adapter.
- `src/hooks/`: UI access to shared state.
- `src/services/tmdb/`: central request helper, typed results, movie/TV details, multi-search, region-aware providers.
- `src/theme/`: branding variables and responsive styles.
- `public/icons/`: explicitly temporary letter-C install icons.
- `.github/workflows/web-ci.yml`: pull-request and main-push validation.

The UI never calls localStorage directly. Replace `LocalCueRepository` at the composition root to introduce cloud persistence. `load` and collection `save` are asynchronous so UI callers need not change their transport assumptions. The local adapter uses `cue:data:v1` and a versioned envelope. Unknown versions, malformed envelopes, blocked storage and quota errors surface without intentionally resetting saved data. Profile provider IDs and watchlist entries are validated before use. CueStore serializes rapid UI updates and only publishes successfully persisted state. Robust schema migrations and multi-tab/cloud conflict handling remain future work.

There is one primary Cue profile, initially US, with its own service IDs. Additional viewer profiles are separate and intended for optional Plan Tonight voting. Title-level status and favorites are independent. External media keys combine type and TMDB ID (`movie:42`, `tv:42`). Watch nights allow direct selection with no votes. Future voting logic must enforce one vote per participating viewer. A watch plan always requires a local YYYY-MM-DD date and may have an HH:mm time. Automatically discovered events are a separate model; no guessed release or episode times are created.

## Local setup

```sh
npm ci
cp .env.example .env.local
npm run dev
```

PowerShell: use `Copy-Item .env.example .env.local`. Open the URL printed by Vite (normally http://localhost:5173). The entire shell works without a TMDB token. For future API development, replace the placeholder in `.env.local` with your own TMDB read-access bearer token. Never commit that file.

Routes: `/home`, `/search`, `/watchlist`, `/plan-tonight`, `/my-week`, `/profile`. The root and unknown routes redirect to Home. The profile icon in the header opens Services / Profile. Five bottom tabs cover primary navigation.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run typecheck` | Strict TypeScript checking |
| `npm test` | Storage and TMDB adapter unit tests with mocks |
| `npm run build` | Production web app, manifest and service worker |
| `npm run preview` | Serve the production build locally |
| `npm run cap:sync` | Build and sync installed native platforms |

## PWA

Run `npm run build` then `npm run preview` to check the generated PWA. The development service worker is disabled to avoid stale-code confusion. Production uses a generated manifest with standalone display, Cue name, theme metadata, 192px/512px icons, and shell precaching. Authenticated TMDB responses are not runtime-cached. Updates use a waiting worker and activate after old clients close; no update banner exists yet. Deploy `dist/` over HTTPS with all app navigation paths rewritten to `index.html`. Localhost is suitable for development. Install via the browser's install UI or iOS Safari Share > Add to Home Screen. Confirm actual install/offline behavior on target devices before release.

The icons are plain generated letter-C **placeholders**, not final branding. Replace the 192x192 and 512x512 PNGs and 180x180 Apple touch icon before release; add a separately designed maskable icon if desired. Native app icons and splash assets must also be supplied later.

## Capacitor and iOS

`capacitor.config.ts` is initialized with app name Cue, webDir `dist`, and placeholder bundle ID `com.example.cue`. Replace the bundle ID with one you control **before adding platforms or registering the app**. iOS and Android packages are installed, but generated platform projects are intentionally not included. Native directories are ignored during this web foundation; revisit that policy when native projects are adopted.

On a Mac with compatible Xcode and Capacitor prerequisites:

```sh
npm ci
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

For subsequent changes: `npm run build`, `npx cap sync ios`, `npx cap open ios`. Choose your team and signing settings in Xcode, then test the app on a simulator and a real iPhone. Native build/signing is not validated by the web CI. Web PWA installation does not produce an iOS binary. Review web service-worker registration in native builds when adopting platform projects.

For Android later, install Android Studio and the required SDK/JDK, run `npm run build`, `npx cap add android`, `npx cap sync android`, and `npx cap open android`.

A future `.github/workflows/ios-testflight.yml` will run on a macOS GitHub Actions runner using Capacitor iOS, Xcode, Apple signing credentials and App Store Connect credentials supplied through GitHub Secrets. No TestFlight deployment, signing certificates, provisioning profiles, or production secrets are configured in this phase.

## Security and API behavior

`VITE_TMDB_BEARER_TOKEN` is a **public browser build variable**: Vite bundles it into the client. Keeping `.env.local` out of Git prevents a source-control leak but does not make a deployed browser token secret. Proxy TMDB calls through a backend/serverless service before a production deployment that requires private credentials. Do not pass a production token to this web CI or commit build artifacts.

The TMDB wrapper returns discriminated configuration/HTTP/network errors, uses a 15-second request timeout, and does not log credentials or raw remote errors. Multi-search excludes people. Provider methods require the caller's saved profile region; no UI-wide US assumption is used. Live TMDB responses require a user-supplied development token. Runtime checks validate consumed response fields, media IDs, search entries, provider arrays and TMDB watch-option URLs. Services/Profile includes the approved TMDB logo and API notice; availability views credit JustWatch.

## Intentionally unimplemented

Viewer management, nominations and voting, scheduling, calendar UI and automatic event discovery; authentication, cloud sync, conflict resolution, complete storage migrations, native packaging, final icons, deployment and TestFlight automation. Search results, title details and provider availability require a connection; saved watchlist titles, statuses and independent favorites remain usable without TMDB. Poster images are not cached for offline use.

## Verification and references

Web CI runs `npm ci`, `npm run typecheck`, `npm test`, and `npm run build`. Manual browser smoke checks should cover all six routes, tab navigation, profile save/reload, narrow touch layouts and desktop layout. Real iPhone keyboard/safe-area behavior and PWA installation require device QA.

- [Ionic documentation](https://ionicframework.com/docs)
- [Vite PWA configuration](https://vite-pwa-org.netlify.app/guide/)
- [TMDB multi-search](https://developer.themoviedb.org/reference/search-multi)
- [TMDB provider lists](https://developer.themoviedb.org/reference/watch-providers-movie-list)
- [Node release schedule](https://github.com/nodejs/Release)

The npm scripts use Node 24's native TypeScript config loader, avoiding an unnecessary esbuild step for Vite configuration. Production builds may report a large Ionic vendor chunk; further chunk splitting can be measured in the next phase.

## Phase 2 usage

In Services/Profile, enter a two-letter country code, select services, then Save profile. Movie and TV provider lists are combined; existing selections absent from a new region are preserved and can be removed. In Search, enter a title, open details, check subscription/free/ad-supported/rental/purchase offers, and Add to watchlist. Search waits briefly while typing and supports up to 500 result pages. Your selected services are highlighted in availability results; they do not imply that rentals or purchases are included in a subscription. The Watchlist supports search, status filtering, favorites filtering, all four statuses, and confirmed removal. Adding an already-saved title preserves its settings.

### Windows setup

Run each command separately from the repository folder. If PowerShell blocks npm.ps1, use npm.cmd (no execution-policy change is needed):

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
notepad .env.local
npm.cmd run dev
```

Do not overwrite an existing configured .env.local. Set VITE_TMDB_BEARER_TOKEN to your TMDB API Read Access Token (not the v3 API key). Never paste it into chat or GitHub. Restart the development server after changing it. For a production preview, rebuild with npm.cmd run build before npm.cmd run preview. Keep the terminal open and use the port printed by Vite. Browser storage is per origin, so port 5173 and port 4173 have separate local profiles/watchlists.

### Phase 2 verification

Tests cover missing/failed/malformed API responses, provider merging, media-type ID collisions, duplicate prevention, independent status/favorites, rapid serialized writes, failed-save recovery, and stale-response handling. Browser QA covers search/details, provider selection, reload persistence and watchlist controls using a separate mocked preview; mocked data and the test preview are not part of the shipped application. Live token verification is performed locally without logging credentials.
