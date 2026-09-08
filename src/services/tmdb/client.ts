import type { MediaReference, MediaType } from '../../domain/models';
export type TmdbResult<T> = { ok: true; data: T } | { ok: false; error: { kind: 'configuration' | 'http' | 'network' | 'response'; message: string; status?: number } };
export interface Provider { provider_id: number; provider_name: string; logo_path: string | null; display_priority: number }
export interface ProviderAvailability { link: string; flatrate?: Provider[]; rent?: Provider[]; buy?: Provider[]; free?: Provider[]; ads?: Provider[] }
export interface MovieDetails { id: number; title: string; poster_path: string | null; overview: string; release_date?: string; runtime: number | null }
export interface TvDetails { id: number; name: string; poster_path: string | null; overview: string; first_air_date?: string; next_episode_to_air: { id: number; air_date: string; episode_number: number; season_number: number } | null }
export interface TitleDetails { overview: string; date?: string; runtime?: number | null }
interface SearchEntry { id: number; media_type: 'movie' | 'tv' | 'person'; title?: string; name?: string; poster_path?: string | null }
interface SearchResponse { page: number; total_pages: number; results: SearchEntry[] }
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const positiveId = (id: unknown) => Number.isSafeInteger(id) && Number(id) > 0;
const imagePath = (path: unknown) => path === null || path === undefined || (typeof path === 'string' && /^\/[\w.-]+$/.test(path));
const validProvider = (p: unknown) => object(p) && positiveId(p.provider_id) && typeof p.provider_name === 'string' && imagePath(p.logo_path);
const validProviders = (items: unknown) => Array.isArray(items) && items.every(validProvider);
const invalid = <T>(): TmdbResult<T> => ({ ok: false, error: { kind: 'response', message: 'The movie service returned unexpected data. Please try again later.' } });
const dateOnly = (date: unknown): string | undefined => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
function safeTmdbLink(value: unknown) {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'www.themoviedb.org' && !url.username && !url.password; } catch { return false; }
}
/** Vite values are PUBLIC in browser bundles. Use a credential proxy before production. */
export class TmdbClient {
  constructor(private readonly token = import.meta.env.VITE_TMDB_BEARER_TOKEN ?? '', private readonly fetcher: typeof fetch = (input, init) => fetch(input, init)) {}
  private async request<T>(path: string, params: Record<string, string>, valid: (value: unknown) => boolean): Promise<TmdbResult<T>> {
    if (!this.token.trim() || this.token === 'your_tmdb_read_access_token_here') return { ok: false, error: { kind: 'configuration', message: 'The movie search connection has not been set up yet. Your saved watchlist is still available.' } };
    const url = new URL('https://api.themoviedb.org/3' + path);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    try {
      const response = await this.fetcher(url, { headers: { Authorization: 'Bearer ' + this.token, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) return { ok: false, error: { kind: 'http', status: response.status, message: response.status === 401 || response.status === 403 ? 'The movie service could not authorize this connection.' : response.status === 429 ? 'The movie service is busy. Please wait a moment and try again.' : 'The movie service is unavailable. Please try again later.' } };
      let body: unknown;
      try { body = await response.json(); } catch { return invalid(); }
      return valid(body) ? { ok: true, data: body as T } : invalid();
    } catch { return { ok: false, error: { kind: 'network', message: 'The movie service could not be reached. Check your connection and try again.' } }; }
  }
  async multiSearch(query: string, page = 1): Promise<TmdbResult<{ page: number; totalPages: number; results: MediaReference[] }>> {
    if (!query.trim()) return { ok: true, data: { page: 1, totalPages: 0, results: [] } };
    const response = await this.request<SearchResponse>('/search/multi', { query: query.trim(), page: String(Math.max(1, Math.min(500, Math.trunc(page) || 1))), include_adult: 'false' }, value => object(value) && Number.isInteger(value.page) && Number.isInteger(value.total_pages) && Number(value.total_pages) >= 0 && Array.isArray(value.results) && value.results.every(entry => object(entry) && positiveId(entry.id) && ['movie', 'tv', 'person'].includes(String(entry.media_type)) && (entry.media_type === 'person' || (typeof (entry.media_type === 'movie' ? entry.title : entry.name) === 'string' && imagePath(entry.poster_path)))));
    if (!response.ok) return response;
    const results = response.data.results.filter(entry => entry.media_type !== 'person').map(entry => ({ tmdbId: entry.id, mediaType: entry.media_type as MediaType, title: entry.title ?? entry.name ?? 'Untitled', posterPath: entry.poster_path ?? null }));
    return { ok: true, data: { page: response.data.page, totalPages: response.data.total_pages, results: results.filter((item, index) => results.findIndex(other => other.tmdbId === item.tmdbId && other.mediaType === item.mediaType) === index) } };
  }
  movieDetails(id: number): Promise<TmdbResult<MovieDetails>> {
    if (!positiveId(id)) return Promise.resolve(invalid());
    return this.request('/movie/' + id, {}, v => object(v) && v.id === id && typeof v.title === 'string' && typeof v.overview === 'string' && imagePath(v.poster_path) && (v.runtime === null || typeof v.runtime === 'number'));
  }
  tvDetails(id: number): Promise<TmdbResult<TvDetails>> {
    if (!positiveId(id)) return Promise.resolve(invalid());
    return this.request('/tv/' + id, {}, v => object(v) && v.id === id && typeof v.name === 'string' && typeof v.overview === 'string' && imagePath(v.poster_path));
  }
  async details(media: MediaReference): Promise<TmdbResult<TitleDetails>> {
    if (media.mediaType === 'movie') { const r = await this.movieDetails(media.tmdbId); return r.ok ? { ok: true, data: { overview: r.data.overview, date: dateOnly(r.data.release_date), runtime: r.data.runtime } } : r; }
    const r = await this.tvDetails(media.tmdbId); return r.ok ? { ok: true, data: { overview: r.data.overview, date: dateOnly(r.data.first_air_date) } } : r;
  }
  async watchProviders(media: Pick<MediaReference, 'tmdbId' | 'mediaType'>, region: string): Promise<TmdbResult<ProviderAvailability | null>> {
    if (!positiveId(media.tmdbId) || !/^[a-z]{2}$/i.test(region)) return invalid();
    const response = await this.request<{ results: Record<string, ProviderAvailability> }>('/' + media.mediaType + '/' + media.tmdbId + '/watch/providers', {}, value => object(value) && object(value.results) && Object.values(value.results).every(v => object(v) && safeTmdbLink(v.link) && ['flatrate', 'rent', 'buy', 'free', 'ads'].every(key => v[key] === undefined || validProviders(v[key]))));
    return response.ok ? { ok: true, data: response.data.results[region.toUpperCase()] ?? null } : response;
  }
  providerList(mediaType: MediaType, region: string): Promise<TmdbResult<{ results: Provider[] }>> {
    if (!/^[a-z]{2}$/i.test(region)) return Promise.resolve(invalid());
    return this.request('/watch/providers/' + mediaType, { watch_region: region.toUpperCase() }, value => object(value) && validProviders(value.results));
  }
  async allProviders(region: string): Promise<TmdbResult<Provider[]>> {
    const [movies, tv] = await Promise.all([this.providerList('movie', region), this.providerList('tv', region)]);
    if (!movies.ok) return movies;
    if (!tv.ok) return tv;
    const providers = new Map([...movies.data.results, ...tv.data.results].map(provider => [provider.provider_id, provider]));
    return { ok: true, data: [...providers.values()].sort((a, b) => a.provider_name.localeCompare(b.provider_name)) };
  }
}
