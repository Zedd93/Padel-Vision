import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TournamentPair {
  id: string;
  player1: string;
  player2: string;
  seed?: number;
  status: "confirmed" | "pending" | "withdrawn";
}

export interface TournamentMatch {
  id: string;
  round: number;
  position: number;
  team1?: string;
  team2?: string;
  score?: string;
  winnerId?: string;
  status: "pending" | "live" | "completed";
  court?: string;
}

export type CreateTournamentInput = {
  name: string;
  format: string;
  category: string;
  level: string;
  date: string;
  maxPairs: number;
  entryFee: number;
  prizes?: string;
};

export type TournamentStatus =
  | "draft"
  | "registration"
  | "in_progress"
  | "completed";

export interface Tournament {
  id: string;
  name: string;
  date: string;
  format: string;
  category: string;
  level: string;
  maxPairs: number;
  entryFee: number;
  prizes?: string;
  status: TournamentStatus;
  pairs: TournamentPair[];
  matches: TournamentMatch[];
  drawCertificate?: string;
  createdAt: string;
}

interface TournamentStore {
  tournaments: Tournament[];
  getTournament: (id: string) => Tournament | undefined;

  addTournament: (
    t: Omit<Tournament, "id" | "pairs" | "matches" | "createdAt" | "status">
  ) => void;

  updateTournament: (id: string, data: Partial<Tournament>) => void;
  removeTournament: (id: string) => void;

  addPair: (tournamentId: string, pair: Omit<TournamentPair, "id">) => void;
  removePair: (tournamentId: string, pairId: string) => void;
  updatePair: (tournamentId: string, pairId: string, data: Partial<TournamentPair>) => void;

  updateMatch: (tournamentId: string, matchId: string, data: Partial<TournamentMatch>) => void;
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      tournaments: [],

      getTournament: (id) =>
        get().tournaments.find((t) => t.id === id),

      addTournament: (data) =>
        set((state) => ({
          tournaments: [
            ...state.tournaments,
            {
              ...data,
              id: `tournament-${Date.now()}`,
              pairs: [],
              matches: [],
              status: "registration",
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateTournament: (id, data) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        })),

      removeTournament: (id) =>
        set((state) => ({
          tournaments: state.tournaments.filter((t) => t.id !== id),
        })),

      addPair: (tournamentId, pair) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? {
                  ...t,
                  pairs: [
                    ...t.pairs,
                    { ...pair, id: `pair-${Date.now()}` },
                  ],
                }
              : t
          ),
        })),

      removePair: (tournamentId, pairId) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? {
                  ...t,
                  pairs: t.pairs.filter((p) => p.id !== pairId),
                }
              : t
          ),
        })),

      updatePair: (tournamentId, pairId, data) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? {
                  ...t,
                  pairs: t.pairs.map((p) =>
                    p.id === pairId ? { ...p, ...data } : p
                  ),
                }
              : t
          ),
        })),

      updateMatch: (tournamentId, matchId, data) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? {
                  ...t,
                  matches: t.matches.map((m) =>
                    m.id === matchId ? { ...m, ...data } : m
                  ),
                }
              : t
          ),
        })),
    }),
    { name: "padelvision-tournaments" }
  )
);