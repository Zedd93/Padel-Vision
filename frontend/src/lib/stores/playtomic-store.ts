import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlaytomicStatus {
  connected: boolean;
  tenantId: string | null;
  clubName: string | null;
  lastSyncAt: string | null;
}

interface PlaytomicStore {
  status: PlaytomicStatus;
  isLoading: boolean;
  connect: (clubId: string, credentials: { clientId: string; clientSecret: string; tenantId: string }) => Promise<boolean>;
  disconnect: (clubId: string) => Promise<void>;
  sync: (clubId: string) => Promise<void>;
}

export const usePlaytomicStore = create<PlaytomicStore>()(
  persist(
    (set) => ({
      status: {
        connected: false,
        tenantId: null,
        clubName: null,
        lastSyncAt: null,
      },
      isLoading: false,

      connect: async (_clubId, credentials) => {
        set({ isLoading: true });
        // Mock API call
        await new Promise((r) => setTimeout(r, 1500));
        set({
          status: {
            connected: true,
            tenantId: credentials.tenantId,
            clubName: "Playtomic Club",
            lastSyncAt: new Date().toISOString(),
          },
          isLoading: false,
        });
        return true;
      },

      disconnect: async (_clubId) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 800));
        set({
          status: {
            connected: false,
            tenantId: null,
            clubName: null,
            lastSyncAt: null,
          },
          isLoading: false,
        });
      },

      sync: async (_clubId) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 2000));
        set((state) => ({
          status: { ...state.status, lastSyncAt: new Date().toISOString() },
          isLoading: false,
        }));
      },
    }),
    { name: "padelvision-playtomic" }
  )
);
