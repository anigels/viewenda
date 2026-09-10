import { expect, it, vi } from 'vitest';
import { createTmdbProxy, upstreamUrl } from './proxy';
import type { IncomingMessage, ServerResponse } from 'node:http';
it('only allows supported endpoints and parameters', () => {
  for (const path of ['/api/tmdb/account', '/api/tmdb/search/multi?query=x&api_key=secret', '/api/tmdb/tv/1?append_to_response=credits', '/api/tmdb/search/multi?query=x&page=501', '/api/tmdb/watch/providers/tv?watch_region=invalid']) expect(upstreamUrl(path)).toBeNull();
  expect(upstreamUrl('/api/tmdb/search/multi?query=Silo&include_adult=true')?.searchParams.get('include_adult')).toBe('false');
  expect(upstreamUrl('/api/tmdb/tv/1/season/2')?.hostname).toBe('api.themoviedb.org');
});
it('keeps authorization server-side and hides upstream errors', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response('{"id":1}')).mockResolvedValueOnce(new Response('private error', { status: 401 }));
  const proxy = createTmdbProxy('server-secret', fetcher);
  const res = { writeHead: vi.fn(), end: vi.fn() };
  await proxy({ method: 'GET', url: '/api/tmdb/tv/1' } as IncomingMessage, res as unknown as ServerResponse);
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer server-secret');
  expect(res.end).toHaveBeenLastCalledWith('{"id":1}');
  await proxy({ method: 'GET', url: '/api/tmdb/tv/1' } as IncomingMessage, res as unknown as ServerResponse);
  expect(res.end).toHaveBeenLastCalledWith('{"error":"Movie service unavailable"}');
  expect(res.writeHead.mock.calls[1][0]).toBe(502);
});
it('rejects writes and missing server configuration without contacting TMDB', async () => {
  const fetcher = vi.fn(); const res = { writeHead: vi.fn(), end: vi.fn() };
  const proxy = createTmdbProxy('', fetcher);
  await proxy({ method: 'POST', url: '/api/tmdb/tv/1' } as IncomingMessage, res as unknown as ServerResponse);
  expect(res.writeHead.mock.calls[0][0]).toBe(405);
  await proxy({ method: 'GET', url: '/api/tmdb/tv/1' } as IncomingMessage, res as unknown as ServerResponse);
  expect(res.writeHead.mock.calls[1][0]).toBe(503);
  expect(fetcher).not.toHaveBeenCalled();
});
