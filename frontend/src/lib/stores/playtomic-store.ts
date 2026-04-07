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
  error: string | null;

  connect: (
    clubId: string,
    credentials: { clientId: string; clientSecret: string; tenantId: string }
  ) => Promise<boolean>;

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
      error: null,

      connect: async (_clubId, credentials) => {
        try {
          set({ isLoading: true, error: null });

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
        } catch (err) {
          set({
            isLoading: false,
            error: "Failed to connect to Playtomic",
          });

          return false;
        }
      },

      disconnect: async (_clubId) => {
        try {
          set({ isLoading: true, error: null });

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
        } catch (err) {
          set({
            isLoading: false,
            error: "Failed to disconnect",
          });
        }
      },

      sync: async (_clubId) => {
        try {
          set({ isLoading: true, error: null });

          await new Promise((r) => setTimeout(r, 2000));

          set((state) => ({
            status: {
              ...state.status,
              lastSyncAt: new Date().toISOString(),
            },
            isLoading: false,
          }));
        } catch (err) {
          set({
            isLoading: false,
            error: "Sync failed",
          });
        }
      },
    }),
    {
      name: "padelvision-playtomic",
    }
  )
);