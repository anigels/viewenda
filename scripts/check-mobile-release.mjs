import { pathToFileURL } from 'node:url';

export function checkRelease(platform, env) {
  if (!['android', 'ios'].includes(platform)) throw new Error('Choose android or ios.');
  let origin;
  try { origin = new URL(env.VITE_API_ORIGIN); } catch { throw new Error('Set repository variable VITE_API_ORIGIN to the hosted HTTPS backend origin.'); }
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('VITE_API_ORIGIN must be an HTTPS origin without a path, credentials, or query.');
  const required = platform === 'android'
    ? ['KEYSTORE_BASE64', 'STORE_PASSWORD', 'KEY_ALIAS', 'KEY_PASSWORD']
    : ['BUILD_CERTIFICATE_BASE64', 'P12_PASSWORD', 'KEYCHAIN_PASSWORD', 'PROVISIONING_PROFILE_BASE64', 'APPLE_TEAM_ID'];
  if (env.UPLOAD_TO_STORE === 'true') {
    if (env.BUILD_REF !== 'refs/heads/main') throw new Error('Store uploads are only allowed from main.');
    if (platform === 'ios') required.push('APP_STORE_CONNECT_KEY_ID', 'APP_STORE_CONNECT_PRIVATE_KEY', 'APP_STORE_CONNECT_ISSUER_ID');
    else if (!env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim() && !env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64?.trim()) required.push('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
  }
  const missing = required.filter(key => !env[key]?.trim());
  if (missing.length) throw new Error('Missing GitHub secrets: ' + missing.join(', '));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { checkRelease(process.argv[2], process.env); console.log('Release configuration is present.'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
