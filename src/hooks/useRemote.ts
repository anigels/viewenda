import { useEffect, useState } from 'react';
import type { TmdbResult } from '../services/tmdb/client';
export type RemoteState<T> = { loading: true; data?: never; error?: never } | { loading: false; data?: T; error?: string };
/** Memoize the loader. Old queries and regions cannot replace newer responses. */
export function useRemote<T>(loader: () => Promise<TmdbResult<T>>) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ loader: typeof loader; attempt: number; state: RemoteState<T> }>();
  useEffect(() => {
    let active = true;
    loader().then(response => {
      if (active) setResult({ loader, attempt, state: response.ok ? { loading: false, data: response.data } : { loading: false, error: response.error.message } });
    }).catch(() => { if (active) setResult({ loader, attempt, state: { loading: false, error: 'Something went wrong. Please try again.' } }); });
    return () => { active = false; };
  }, [loader, attempt]);
  const state: RemoteState<T> = result?.loader === loader && result.attempt === attempt ? result.state : { loading: true };
  return { ...state, retry: () => setAttempt(value => value + 1) };
}