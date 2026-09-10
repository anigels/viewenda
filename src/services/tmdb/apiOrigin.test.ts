import { expect, it } from 'vitest';
import { apiOrigin } from './apiOrigin';
it('requires an HTTPS backend origin for native builds and keeps web same-origin', () => {
  expect(apiOrigin(undefined, true)).toBeNull();
  expect(apiOrigin(undefined, false)).toBe('');
  expect(apiOrigin('https://viewenda.example/', true)).toBe('https://viewenda.example');
  for (const value of ['http://example.com', 'https://user:pass@example.com', 'https://example.com/api', 'https://example.com?token=x']) expect(apiOrigin(value, true)).toBeNull();
});
