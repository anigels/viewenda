// Native apps receive updates through their app stores, never a service worker.
export function useRegisterSW() {
  return { needRefresh: [false] as const, updateServiceWorker: async (_reload?: boolean) => {} };
}
