# Mobile builds through GitHub Actions

Viewenda follows the PickleballTeamFlow build pattern. GitHub supplies Java/Android SDK and a macOS/Xcode runner; local Android Studio or a Mac is not required to run these workflows. Real-device testing remains necessary.

Merge the native foundation first, then these workflows into main. Open Actions, select **Build Android App** or **Build iOS App**, and choose **Run workflow**. Leave **upload_to_store** unchecked to produce signed downloadable artifacts only. Checking it uploads Android to Google Play's internal track or iOS to TestFlight; uploads require main. No workflow runs automatically on push. Builds are serialized per platform and artifacts are retained for 14 days.

Both workflows require a configured hosted backend. Add repository **variable** `VITE_API_ORIGIN` containing only its HTTPS origin (for example, https://your-backend.example). Do not put the TMDB token in this variable or mobile build secrets. `TMDB_BEARER_TOKEN` belongs on the backend host.

## Android secrets

| Secret | Value |
| --- | --- |
| KEYSTORE_BASE64 | Base64-encoded Android release/upload keystore |
| STORE_PASSWORD | Keystore password |
| KEY_ALIAS | Signing key alias |
| KEY_PASSWORD | Signing key password |
| GOOGLE_PLAY_SERVICE_ACCOUNT_JSON | Service-account JSON authorized for Viewenda, required only for upload |
| GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64 | Alternative base64 form of the same JSON; takes precedence when both exist |

Create Viewenda's Play Console entry for `com.anigels.viewenda`, configure signing and grant the service account access. Follow Play Console's initial app setup before attempting automated uploads. Release APK and AAB artifacts are produced; an AAB is for Play distribution, not direct installation. Keep a secure copy of the signing key outside Git.

## iOS secrets

| Secret | Value |
| --- | --- |
| BUILD_CERTIFICATE_BASE64 | Base64 Apple Distribution certificate with private key (.p12) |
| P12_PASSWORD | Password used to export that certificate |
| KEYCHAIN_PASSWORD | Password for the temporary runner keychain |
| PROVISIONING_PROFILE_BASE64 | Base64 App Store distribution profile named **Viewenda**, for `com.anigels.viewenda` |
| APPLE_TEAM_ID | Developer team matching the profile and certificate |
| APP_STORE_CONNECT_KEY_ID | API key ID, required only for upload |
| APP_STORE_CONNECT_ISSUER_ID | API issuer ID, required only for upload |
| APP_STORE_CONNECT_PRIVATE_KEY | Contents of the API private .p8 key, required only for upload |

Create the Apple App ID and App Store Connect app record for Viewenda. The profile must match this bundle ID and include the imported distribution certificate. An existing team certificate/API key may be usable if authorized, but Pickleball's app-specific provisioning profile is not interchangeable. The workflow expects the provisioning profile name **Viewenda** in both archive and export settings.

iOS uses Swift Package Manager and checks for Xcode 26 or newer, as required by Capacitor 8. The resulting App Store IPA is intended for TestFlight/App Store distribution, not direct sideloading. Signing files and the temporary keychain are removed in cleanup steps, including after failures.

## Versioning and first-run checks

The marketing version comes from package.json; GitHub's workflow run number supplies each platform's build number. If build numbers already exist in either store, adjust the scheme before uploading so new numbers exceed previous ones. Re-running an already-uploaded run reuses its number; dispatch a new run for a new upload.

Release preflight reports missing setting names without printing values. The workflows have been parsed locally and preflight behavior is unit tested; signed builds and store uploads remain unverified until the repository is configured and a workflow runs. Final app icons, store information, privacy disclosures, backend deployment, and device QA remain separate release tasks.

References: [Pickleball Android workflow](https://github.com/marco-rodriguez59/pickleballteamflow/blob/master/.github/workflows/android-build.yml), [Pickleball iOS workflow](https://github.com/marco-rodriguez59/pickleballteamflow/blob/master/.github/workflows/ios-build.yml), [Capacitor environment requirements](https://capacitorjs.com/docs/getting-started/environment-setup).
