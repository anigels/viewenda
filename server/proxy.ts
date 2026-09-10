import type { IncomingMessage, ServerResponse } from 'node:http';

export function upstreamUrl(raw: string): URL | null {
  const url = new URL(raw, 'http://localhost');
  const path = url.pathname.replace(/^\/api\/tmdb/, '');
  const search = path === '/search/multi';
  const providers = /^\/watch\/providers\/(movie|tv)$/.test(path);
  if (!search && !providers && !/^\/(movie|tv)\/[1-9]\d*(\/watch\/providers)?$/.test(path) && !/^\/tv\/[1-9]\d*\/season\/[1-9]\d*$/.test(path)) return null;
  const allowed = search ? ['query', 'page', 'include_adult'] : providers ? ['watch_region'] : [];
  if ([...url.searchParams.keys()].some(key => !allowed.includes(key) || url.searchParams.getAll(key).length !== 1)) return null;
  const target = new URL('https://api.themoviedb.org/3' + path);
  if (search) {
    const query = url.searchParams.get('query')?.trim();
    const page = url.searchParams.get('page') ?? '1';
    if (!query || query.length > 200 || !/^\d+$/.test(page) || +page < 1 || +page > 500) return null;
    target.searchParams.set('query', query); target.searchParams.set('page', page); target.searchParams.set('include_adult', 'false');
  }
  if (providers) {
    const region = url.searchParams.get('watch_region');
    if (!region || !/^[A-Z]{2}$/.test(region)) return null;
    target.searchParams.set('watch_region', region);
  }
  return target;
}
export function createTmdbProxy(token: string, fetcher: typeof fetch = fetch) {
  let active = 0;
  return async (req: IncomingMessage, res: ServerResponse) => {
    // Exact native WebView origins; CORS is not authentication or rate limiting.
    if (req.headers?.origin && ['capacitor://localhost', 'https://localhost'].includes(req.headers.origin)) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Vary', 'Origin');
    }
    const fail = (status: number) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ error: 'Movie service unavailable' })); };
    if (req.method !== 'GET') { fail(405); return; }
    let url: URL | null;
    try { url = upstreamUrl(req.url ?? ''); } catch { fail(400); return; }
    if (!url) { fail(400); return; }
    if (!token || token === 'your_tmdb_read_access_token_here') { fail(503); return; }
    if (active >= 16) { fail(429); return; }
    active++;
    try {
      const response = await fetcher(url, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' }, signal: AbortSignal.timeout(12000), redirect: 'error' });
      if (!response.ok) { fail(response.status === 429 ? 429 : 502); return; }
      const body = await response.json();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(body));
    } catch { fail(502); }
    finally { active--; }
  };
}
