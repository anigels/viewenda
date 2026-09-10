# Viewenda

Viewenda helps users find where movies and TV shows are streaming, save what they want to watch, decide what to watch alone or together, and plan their viewing lineup.

**Your entertainment, all lined up.** Core areas: Search / Where to Watch, Watchlist, Plan Tonight, My Lineup / weekly planning, and streaming service selection.

## Stack and architecture

Ionic React 8, React 19, TypeScript, Vite 7, Ionic Router with React Router 5, Capacitor 8, and vite-plugin-pwa. Node 24 LTS is used locally and in CI. Ionic 8's router requires React Router 5; upgrade them together. No Bootstrap, authentication, or cloud service is included.

- `src/app/`: application composition, Ionic tabs, injected repository and shared state.
- `src/components/`: reusable Ionic page and empty-state shell.
- `src/features/onboarding/`: primary profile editing, provider selection and API credits.
- `src/features/search/`, `watchlist/`, `plan-tonight/`, `calendar/`: search, watchlist, local watch-night planning and a weekly agenda.
- `src/pages/`: Home.
- `src/domain/`: framework-independent typed models, statuses, composite media IDs.
- `src/data/`: asynchronous `ViewendaRepository` contract and versioned localStorage adapter.
- `src/hooks/`: UI access to shared state.
- `src/services/tmdb/`: central request helper, typed results, movie/TV details, multi-search, region-aware providers.
- `src/theme/`: branding variables and responsive styles.
- `public/icons/`: explicitly temporary letter-C install icons.
- `.github/workflows/web-ci.yml`: pull-request and main-push validation.

The UI never calls localStorage directly. Replace `LocalViewendaRepository` at the composition root to introduce cloud persistence. `load`, collection `save`, and atomic `saveAll` are asynchronous so UI callers need not change their transport assumptions. The local adapter uses `cue:data:v1` (an intentionally retained legacy compatibility key) and a versioned envelope. Unknown versions, malformed envelopes, blocked storage and quota errors surface without intentionally resetting saved data. Profile provider IDs, watchlist entries and planning records are validated before use. ViewendaStore serializes rapid UI updates and only publishes successfully persisted state. Robust schema migrations and multi-tab/cloud conflict handling remain future work.

There is one primary Viewenda profile, initially US, with its own service IDs. Additional viewer profiles are separate and intended for optional Plan Tonight voting. Title-level status and favorites are independent. External media keys combine type and TMDB ID (`movie:42`, `tv:42`). Watch nights allow direct selection with no votes. Voting enforces one vote per participating viewer; changing a vote replaces the previous choice. A watch plan always requires a local YYYY-MM-DD date and may have an HH:mm time. Automatically discovered events are a separate model; no guessed release or episode times are created.

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

Run `npm run build` then `npm run preview` to check the generated PWA. The development service worker is disabled to avoid stale-code confusion. Production uses a generated manifest with standalone display, Viewenda name, theme metadata, 192px/512px icons, and shell precaching. Authenticated TMDB responses are not runtime-cached. Updates use a waiting worker and activate after old clients close; no update banner exists yet. Deploy `dist/` over HTTPS with all app navigation paths rewritten to `index.html`. Localhost is suitable for development. Install via the browser's install UI or iOS Safari Share > Add to Home Screen. Confirm actual install/offline behavior on target devices before release.

The icons are plain generated letter-C **placeholders**, not final branding. Replace the 192x192 and 512x512 PNGs and 180x180 Apple touch icon before release; add a separately designed maskable icon if desired. Native app icons and splash assets must also be supplied later.

## Capacitor and iOS

`capacitor.config.ts` is initialized with app name Viewenda, webDir `dist`, and bundle ID `com.anigels.viewenda`. This is the intended identity for future Apple App ID registration. iOS and Android packages are installed, but generated platform projects are intentionally not included. Native directories are ignored during this web foundation; revisit that policy when native projects are adopted.

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

Full episode calendars and movie release discovery; authentication, cloud sync, conflict resolution, complete storage migrations, native packaging, final icons, deployment and TestFlight automation. Search results, title details and provider availability require a connection; saved watchlist titles, statuses and independent favorites remain usable without TMDB. Poster images are not cached for offline use.

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

### Search-card availability

Search cards show provider logos and names for the saved profile region without opening details or adding titles. Selected services sort first and are marked "Your service"; subscription, free, ad-supported, rental and purchase offers remain separate. Missing data says "Availability not reported" and network errors offer Retry. Near-visible cards load lazily, at most four provider requests run concurrently, and successful results are cached in memory for five minutes (up to 200 region/media entries). The cache is not persisted and does not cache failures. Availability remains informational and may change.

## Phase 3 usage

Plan Tonight starts a resumable draft. Select participants, add or remove local viewers, and nominate saved watchlist titles. Pass the device around for optional voting (one choice per viewer), or choose a title directly. Votes never automatically decide the final pick, including ties. Removing a participant or nomination clears its invalid votes. Viewers, nominations, votes and the final choice persist as you go; the date and optional time are set when saving the plan. A required local date and optional local time produce a plan in My Lineup. Scheduling saves the plan and completed night together in one storage write; failed writes leave the draft intact for retry.

My Lineup also lets you add a watchlist title directly, browse Monday–Sunday weeks, jump to a date, edit a plan's date/time, or confirm removal. Clearing the time leaves it unspecified. Plans retain their original Manual / Plan Tonight source and title snapshot, even if a title is later removed from the watchlist. Removing a plan removes its linked completed night but does not change watch status, favorites or saved titles. Home counts plans dated today or later. All participants and voting use this device; no invitations or cross-device sync are implied.

Phase 3 tests cover vote replacement and ties, stale nominees and viewers, direct scheduling, date/time validation, calendar boundaries, independent watchlist state, rescheduling, removal and atomic-save failure/retry. Automatic air-date discovery remains separate from saved viewing plans (see Phase 4).
## Phase 4: upcoming TV air dates

My Lineup shows TMDB-reported upcoming air dates for saved TV shows, separately from manually scheduled plans. All saved TV shows are checked, regardless of watch status; movies are excluded. A show contributes its next reported episode, or a future first-air date for its series premiere. Only valid calendar dates from today forward are surfaced. This is not a complete season/episode calendar and does not promise a regional streaming release or a time.

Dates in the selected week appear as informational cards. Dates outside that week offer Show week. Expand No upcoming date reported to see shows without dates, and Shows not checked for lookup failures. Refresh air dates checks for updates. Four requests run concurrently; failures are isolated per show, and obsolete results cannot replace the current watchlist result. Changing weeks reuses the current report. Reports are in memory only; reloading checks again. Removing a show removes it from the report, while all saved plans remain independent. No watch status, votes, favorites, plans or local storage model are changed by discovery.

The [TMDB TV-series details endpoint](https://developer.themoviedb.org/reference/tv-series-details) supplies next_episode_to_air and first_air_date. Times are never inferred. Dates are displayed as reported calendar days, without converting them to UTC or assuming a local streaming release. Automatic notifications, regional movie release discovery, full episode tracking, cloud sync and native distribution remain future work.

Validation includes malformed/missing/past dates, same-day premieres, series versus later-season premieres, per-show failures, bounded requests, duplicate IDs, cancellation and preserved source data.