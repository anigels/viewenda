import { expect, it } from 'vitest';
import { checkRelease } from './check-mobile-release.mjs';
const android = { VITE_API_ORIGIN: 'https://api.example.com', KEYSTORE_BASE64: 'test', STORE_PASSWORD: 'test', KEY_ALIAS: 'test', KEY_PASSWORD: 'test' };
it('allows artifact-only builds and requires explicit main-branch store credentials', () => {
  expect(() => checkRelease('android', android)).not.toThrow();
  expect(() => checkRelease('android', { ...android, UPLOAD_TO_STORE: 'true', BUILD_REF: 'refs/heads/feature' })).toThrow('only allowed from main');
  expect(() => checkRelease('android', { ...android, UPLOAD_TO_STORE: 'true', BUILD_REF: 'refs/heads/main' })).toThrow('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
});
it('reports missing configuration names without exposing values', () => {
  expect(() => checkRelease('ios', { VITE_API_ORIGIN: 'https://api.example.com' })).toThrow('BUILD_CERTIFICATE_BASE64');
  expect(() => checkRelease('android', { ...android, VITE_API_ORIGIN: 'http://example.com/private-secret' })).toThrow('must be an HTTPS origin');
});
