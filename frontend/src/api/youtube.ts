import { apiClient } from './client';

export interface YouTubeConnection {
  connected: boolean;
  channelId: string | null;
  channelTitle: string | null;
  /** CONNECTED | REVOKED | ERROR */
  status: string | null;
  connectedAt: string | null;
  /** Adres RTMP do wklejenia w OBS */
  ingestAddress: string | null;
  /** Klucz transmisji do OBS — sekret klubu */
  ingestStreamName: string | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const youtubeApi = {
  /** Stan połączenia klubu z kanałem YouTube. */
  getStatus: async (): Promise<YouTubeConnection> => {
    const response =
      await apiClient.get<ApiEnvelope<YouTubeConnection>>('/api/club/youtube/status');
    return response.data.data;
  },

  /** Zwraca URL ekranu zgody Google — przeglądarkę przekierowuje frontend. */
  getAuthorizationUrl: async (): Promise<string> => {
    const response = await apiClient.get<ApiEnvelope<{ authorizationUrl: string }>>(
      '/api/club/youtube/connect'
    );
    return response.data.data.authorizationUrl;
  },

  disconnect: async (): Promise<void> => {
    await apiClient.delete('/api/club/youtube/disconnect');
  },
};
