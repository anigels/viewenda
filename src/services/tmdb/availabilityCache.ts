import type { MediaReference } from '../../domain/models';
import type { ProviderAvailability, TmdbResult } from './client';

type Result = TmdbResult<ProviderAvailability | null>;
/** Bound parallel requests and reuse successful lookups for five minutes. Never cache failures. */
export function createAvailabilityLookup(fetchAvailability: (media: MediaReference, region: string) => Promise<Result>) {
  const cache = new Map<string, { result: Result; expires: number }>();
  const pending = new Map<string, Promise<Result>>();
  const queue: (() => void)[] = [];
  let active = 0;
  function drain() { while (active < 4 && queue.length) { active++; queue.shift()!(); } }
  return (media: MediaReference, region: string): Promise<Result> => {
    const normalized = region.toUpperCase();
    const key = `${normalized}:${media.mediaType}:${media.tmdbId}`;
    const saved = cache.get(key);
    if (saved && saved.expires > Date.now()) return Promise.resolve(saved.result);
    const running = pending.get(key);
    if (running) return running;
    const request = new Promise<Result>((resolve, reject) => {
      queue.push(() => {
        Promise.resolve().then(() => fetchAvailability(media, normalized)).then(result => {
          if (result.ok) {
            cache.delete(key);
            cache.set(key, { result, expires: Date.now() + 300_000 });
            if (cache.size > 200) cache.delete(cache.keys().next().value!);
          }
          resolve(result);
        }, reject).finally(() => { pending.delete(key); active--; drain(); });
      });
    });
    pending.set(key, request);
    drain();
    return request;
  };
}
