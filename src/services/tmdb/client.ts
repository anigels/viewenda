import type { MediaReference, MediaType } from '../../domain/models';

export type TmdbResult<T> = { ok: true; data: T } | { ok: false; error: { kind: 'configuration' | 'http' | 'network'; message: string; status?: number } };
export interface Provider { provider_id: number; provider_name: string; logo_path: string | null; display_priority: number }
export interface ProviderAvailability { link: string; flatrate?: Provider[]; rent?: Provider[]; buy?: Provider[]; free?: Provider[]; ads?: Provider[] }
export interface MovieDetails { id: number; title: string; poster_path: string | null; overview: string; release_date?: string; runtime: number | null }
export interface TvDetails { id: number; name: string; poster_path: string | null; overview: string; first_air_date?: string; next_episode_to_air: { id: number; air_date: string; episode_number: number; season_number: number } | null }
interface SearchEntry { id: number; media_type: 'movie' | 'tv' | 'person'; title?: string; name?: string; poster_path?: string | null }
interface SearchResponse { page: number; total_pages: number; results: SearchEntry[] }

/** Vite env values are PUBLIC in browser bundles. Proxy credentials for production. */
export class TmdbClient {
  constructor(private readonly token = import.meta.env.VITE_TMDB_BEARER_TOKEN ?? '', private readonly fetcher: typeof fetch = fetch) {}
  private async request<T>(path: string, params: Record<string, string> = {}): Promise<TmdbResult<T>> {
    if (!this.token.trim() || this.token === 'your_tmdb_read_access_token_here') {
      return { ok: false, error: { kind: 'configuration', message: 'TMDB is not configured. Add a development token to .env.local.' } };
    }
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    try {
      const response = await this.fetcher(url, {
        headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) return { ok: false, error: { kind: 'http', status: response.status, message: `TMDB request failed (${response.status}). Please try again later.` } };
      return { ok: true, data: await response.json() as T };
    } catch {
      return { ok: false, error: { kind: 'network', message: 'TMDB could not be reached. Check your connection and try again.' } };
    }
  }
  async multiSearch(query: string, page = 1): Promise<TmdbResult<{ page: number; totalPages: number; results: MediaReference[] }>> {
    if (!query.trim()) return { ok: true, data: { page: 1, totalPages: 0, results: [] } };
    const response = await this.request<SearchResponse>('/search/multi', { query: query.trim(), page: String(page), include_adult: 'false' });
    if (!response.ok) return response;
    return { ok: true, data: {
      page: response.data.page, totalPages: response.data.total_pages,
      results: response.data.results.filter(entry => entry.media_type === 'movie' || entry.media_type === 'tv').map(entry => ({
        tmdbId: entry.id, mediaType: entry.media_type as MediaType,
        title: entry.title ?? entry.name ?? 'Untitled', posterPath: entry.poster_path ?? null,
      })),
    } };
  }
  movieDetails(id: number) { return this.request<MovieDetails>(`/movie/${id}`); }
  tvDetails(id: number) { return this.request<TvDetails>(`/tv/${id}`); }
  async watchProviders(media: Pick<MediaReference, 'tmdbId' | 'mediaType'>, region: string): Promise<TmdbResult<ProviderAvailability | null>> {
    const response = await this.request<{ results: Record<string, ProviderAvailability> }>(`/${media.mediaType}/${media.tmdbId}/watch/providers`);
    if (!response.ok) return response;
    return { ok: true, data: response.data.results[region.toUpperCase()] ?? null };
  }
  providerList(mediaType: MediaType, region: string) {
    return this.request<{ results: Provider[] }>(`/watch/providers/${mediaType}`, { watch_region: region.toUpperCase() });
  }
}
