export type MediaType = 'movie' | 'tv';
/** Composite key avoids collisions between movie and TV IDs. */
export type MediaId = `${MediaType}:${number}`;
export interface ViewendaProfile {
  id: string;
  name: string;
  region: string;
  selectedProviderIds: number[];
}
export interface ViewerProfile { id: string; name: string }
export interface MediaReference {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
}
export const mediaId = (media: MediaReference): MediaId => `${media.mediaType}:${media.tmdbId}`;
export const watchStatuses = ['Want to Watch', 'Watching', 'Waiting for Next Episode', 'Watched'] as const;
export type WatchStatus = typeof watchStatuses[number];
export interface EpisodePosition { season: number; number: number }
export interface EpisodeReference extends EpisodePosition { name?: string; airDate?: string }
export interface WatchlistItem {
  media: MediaReference;
  status: WatchStatus;
  isFavorite: boolean;
  addedAt: string; // ISO timestamp
  lastCompletedEpisode?: EpisodePosition | null; // Absent: unknown; null: explicitly not started.
}
export type WatchPlanSource = 'manual' | 'planTonight';
export interface WatchPlan {
  id: string;
  media: MediaReference;
  date: string; // Local calendar date: YYYY-MM-DD (required)
  optionalTime?: string; // Local time: HH:mm; never inferred
  source: WatchPlanSource;
  episode?: EpisodeReference; // Optional; existing title-level plans stay unchanged.
}
export interface Vote { viewerId: string; mediaId: MediaId }
export interface WatchNight {
  id: string;
  viewerIds: string[];
  nomineeMediaIds: MediaId[];
  votes: Vote[]; // At most one preferred title per participating viewer.
  selectedMediaId: MediaId | null; // Direct selection does not require votes.
  watchPlanId?: string; // Set after scheduling; absent while this is a resumable draft.
}
export type AutomaticEventType = 'episode' | 'premiere' | 'release';
export interface AutomaticEvent {
  media: MediaReference;
  date: string; // Only sourced from reliable date data; no invented times.
  eventType: AutomaticEventType;
}
