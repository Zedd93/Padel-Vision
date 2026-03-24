import { apiClient } from './client';

export interface MatchRecord {
  id: string;
  tournamentId: string;
  courtNumber: number | null;
  round: number | null;
  team1Player1: string | null;
  team1Player2: string | null;
  team2Player1: string | null;
  team2Player2: string | null;
  score: Record<string, unknown> | null;
  winnerId: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

export const matchesApi = {
  getMine: (params?: { page?: number; size?: number }) =>
    apiClient.get('/api/matches/mine', { params }),

  getById: (id: string) =>
    apiClient.get<{ data: MatchRecord }>(`/api/matches/${id}`),

  delete: (id: string) =>
    apiClient.delete(`/api/matches/${id}`),

  updatePrivacy: (id: string, isPublic: boolean) =>
    apiClient.put(`/api/matches/${id}/privacy`, { isPublic }),
};
