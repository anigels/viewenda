// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useRemote } from './useRemote';
import type { TmdbResult } from '../services/tmdb/client';
it('ignores a slow old query when a newer query has completed', async () => {
  let resolveOld!: (result: TmdbResult<string>) => void;
  const old = () => new Promise<TmdbResult<string>>(resolve => { resolveOld = resolve; });
  const current = vi.fn().mockResolvedValue({ ok: true, data: 'new result' });
  const { result, rerender } = renderHook(({ loader }) => useRemote(loader), { initialProps: { loader: old } });
  rerender({ loader: current });
  await waitFor(() => expect(result.current.data).toBe('new result'));
  await act(async () => resolveOld({ ok: true, data: 'stale result' }));
  expect(result.current.data).toBe('new result');
});
it('retries a failure and does not retain the old error', async () => {
  const loader = vi.fn().mockResolvedValueOnce({ ok: false, error: { kind: 'network', message: 'offline' } }).mockResolvedValueOnce({ ok: true, data: [] });
  const { result } = renderHook(() => useRemote(loader));
  await waitFor(() => expect(result.current.error).toBe('offline'));
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.data).toEqual([]));
  expect(result.current.error).toBeUndefined();
});
