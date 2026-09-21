import { apiClient } from './client';
import type { Stream } from './streams';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface StartStreamPayload {
  title: string;
  description?: string;
  matchId?: string;
}

/** Endpointy panelu klubu — wymagaja roli CLUB. */
export const clubStreamApi = {
  /**
   * Tworzy transmisje na kanale YouTube klubu. Wraca ze statusem OFFLINE —
   * na zywo wchodzi sama, gdy OBS zacznie nadawac.
   */
  start: async (payload: StartStreamPayload): Promise<Stream> => {
    const response = await apiClient.post<ApiEnvelope<Stream>>(
      '/api/club/stream/start',
      payload
    );
    return response.data.data;
  },

  stop: async (streamId: string): Promise<void> => {
    await apiClient.post(`/api/club/stream/${streamId}/stop`);
  },

  updateScore: async (streamId: string, score: Record<string, unknown>): Promise<void> => {
    await apiClient.put(`/api/club/stream/${streamId}/score`, { score });
  },
};
