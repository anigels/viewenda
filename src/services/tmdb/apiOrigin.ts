export function apiOrigin(value: string | undefined, native: boolean): string | null {
  if (!value?.trim()) return native ? null : '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch { return null; }
}
