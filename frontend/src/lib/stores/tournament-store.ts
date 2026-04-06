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

export interface Tournament {
  id: string;
  name: string;
  date: string;
  format: string;
  category: string;
  level: string;
  maxPairs: number;
  entryFee: number;
  prizes: string;
  status: "draft" | "registration" | "in_progress" | "completed";
  pairs: TournamentPair[];
  matches: TournamentMatch[];
  drawCertificate?: string;
  createdAt: string;
}

interface TournamentStore {
  tournaments: Tournament[];
  getTournament: (id: string) => Tournament | undefined;
  addTournament: (t: Omit<Tournament, "id" | "pairs" | "matches" | "createdAt" | "status">) => void;
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
      tournaments: [
        {
          id: "silesia-open-2026",
          name: "SILESIA OPEN 2026",
          date: "2026-04-15",
          format: "ELIMINATION",
          category: "OPEN",
          level: "A",
          maxPairs: 16,
          entryFee: 150,
          prizes: "5 000 zł",
          status: "registration",
          pairs: [
            { id: "p1", player1: "Jan Kowalski", player2: "Adam Nowak", seed: 1, status: "confirmed" },
            { id: "p2", player1: "Piotr Wiśniewski", player2: "Marek Zieliński", seed: 2, status: "confirmed" },
            { id: "p3", player1: "Tomasz Lewandowski", player2: "Michał Wójcik", status: "confirmed" },
            { id: "p4", player1: "Krzysztof Kamiński", player2: "Paweł Szymański", status: "confirmed" },
            { id: "p5", player1: "Jakub Dąbrowski", player2: "Mateusz Kozłowski", status: "pending" },
          ],
          matches: [],
          createdAt: "2026-03-01T10:00:00Z",
        },
        {
          id: "krakow-masters-2026",
          name: "KRAKÓW MASTERS 2026",
          date: "2026-05-10",
          format: "ELIMINATION",
          category: "OPEN",
          level: "B",
          maxPairs: 8,
          entryFee: 100,
          prizes: "2 000 zł",
          status: "draft",
          pairs: [
            { id: "p1", player1: "Anna Maj", player2: "Ewa Krawczyk", seed: 1, status: "confirmed" },
            { id: "p2", player1: "Monika Piotrowska", player2: "Katarzyna Grabowska", status: "confirmed" },
          ],
          matches: [],
          createdAt: "2026-03-15T14:00:00Z",
        },
      ],

      getTournament: (id) => get().tournaments.find((t) => t.id === id),

      addTournament: (data) =>
        set((state) => ({
          tournaments: [
            ...state.tournaments,
            {
              ...data,
              id: `tournament-${Date.now()}`,
              pairs: [],
              matches: [],
              status: "draft",
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
              ? { ...t, pairs: [...t.pairs, { ...pair, id: `pair-${Date.now()}` }] }
              : t
          ),
        })),

      removePair: (tournamentId, pairId) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? { ...t, pairs: t.pairs.filter((p) => p.id !== pairId) }
              : t
          ),
        })),

      updatePair: (tournamentId, pairId, data) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? { ...t, pairs: t.pairs.map((p) => (p.id === pairId ? { ...p, ...data } : p)) }
              : t
          ),
        })),

      updateMatch: (tournamentId, matchId, data) =>
        set((state) => ({
          tournaments: state.tournaments.map((t) =>
            t.id === tournamentId
              ? { ...t, matches: t.matches.map((m) => (m.id === matchId ? { ...m, ...data } : m)) }
              : t
          ),
        })),
    }),
    { name: "padelvision-tournaments" }
  )
);
