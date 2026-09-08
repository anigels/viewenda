import { TmdbClient } from './client';
export const tmdb = new TmdbClient();
export function posterUrl(path: string | null, size: 'w185' | 'w500' = 'w185') {
  return path && /^\/[\w.-]+$/.test(path) ? 'https://image.tmdb.org/t/p/' + size + path : undefined;
}