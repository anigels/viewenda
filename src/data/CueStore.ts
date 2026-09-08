import type { CueData, CueRepository } from './CueRepository';
/** Serialize rapid updates against the latest successful state. Failed saves do not change UI state. */
export class CueStore {
  private state: { data: CueData | null; error: string | null } = { data: null, error: null };
  private listeners = new Set<() => void>();
  private queue: Promise<void> = Promise.resolve();
  private initialization?: Promise<void>;
  constructor(private repository: CueRepository) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private emit() { this.listeners.forEach(listener => listener()); }
  initialize() {
    return this.initialization ??= this.repository.load().then(data => { this.state = { data, error: null }; this.emit(); })
      .catch(() => { this.state = { data: null, error: 'Local data is unavailable. Existing data has been kept. Check browser storage access, then reload.' }; this.emit(); });
  }
  update<K extends keyof CueData>(key: K, transform: (value: CueData[K]) => CueData[K]) {
    const operation = this.queue.then(async () => {
      if (!this.state.data) throw new Error('Saved data is not available yet.');
      const value = transform(this.state.data[key]);
      await this.repository.save(key, value);
      this.state = { data: { ...this.state.data, [key]: value }, error: null };
      this.emit();
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
}