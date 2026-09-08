import { TmdbClient } from './client';
import { createAvailabilityLookup } from './availabilityCache';
export const tmdb = new TmdbClient();
export const lookupAvailability = createAvailabilityLookup((media, region) => tmdb.watchProviders(media, region));
export function posterUrl(path: string | null, size: 'w185' | 'w500' = 'w185') {
  return path && /^\/[\w.-]+$/.test(path) ? 'https://image.tmdb.org/t/p/' + size + path : undefined;
}
