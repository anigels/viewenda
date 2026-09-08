import { mediaId, type MediaReference, type WatchlistItem, type WatchStatus } from './models';
export function addTitle(items: WatchlistItem[], media: MediaReference, now = new Date().toISOString()): WatchlistItem[] {
  return items.some(item => mediaId(item.media) === mediaId(media)) ? items : [{ media, status: 'Want to Watch', isFavorite: false, addedAt: now }, ...items];
}
export function editTitle(items: WatchlistItem[], media: MediaReference, patch: Partial<Pick<WatchlistItem, 'status' | 'isFavorite'>>) {
  return items.map(item => mediaId(item.media) === mediaId(media) ? { ...item, ...patch } : item);
}
export function filterTitles(items: WatchlistItem[], query: string, status: WatchStatus | 'all', favorites: boolean) {
  return items.filter(item => item.media.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && (status === 'all' || item.status === status) && (!favorites || item.isFavorite));
}