import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { CueData, CueRepository } from '../data/CueRepository';
import type { CueProfile } from '../domain/models';

interface CueContextValue {
  data: CueData | null;
  error: string | null;
  saveProfile: (profile: CueProfile) => Promise<void>;
}
export const CueContext = createContext<CueContextValue | null>(null);
export function CueProvider({ repository, children }: { repository: CueRepository; children: ReactNode }) {
  const [data, setData] = useState<CueData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    repository.load().then(value => { if (active) setData(value); })
      .catch(() => { if (active) setError('Local data is unavailable. Check browser storage access. Existing data has been kept.'); });
    return () => { active = false; };
  }, [repository]);
  async function saveProfile(profile: CueProfile) {
    await repository.save('profile', profile);
    setData(current => current ? { ...current, profile } : current);
  }
  return <CueContext.Provider value={{ data, error, saveProfile }}>{children}</CueContext.Provider>;
}
