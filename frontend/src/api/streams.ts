import { apiClient } from './client';

export interface Stream {
  id: string;
  clubId: string;
  matchId: string | null;
  title: string;
  description: string | null;
  status: 'LIVE' | 'OFFLINE' | 'VOD';
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  viewerCount: number;
  peakViewers: number;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  club?: { id: string; name: string; slug: string; city: string; logo: string | null };
}

export interface Vod {
  id: string;
  streamId: string;
  s3Url: string;
  thumbnailUrl: string | null;
  duration: number;
  createdAt: string;
  stream?: Stream;
}

export const streamsApi = {
  getLive: () =>
    apiClient.get<{ data: Stream[] }>('/api/streams/live'),

  getById: (id: string) =>
    apiClient.get<{ data: Stream }>(`/api/streams/${id}`),

  getArchived: (params: { page?: number; size?: number }) =>
    apiClient.get('/api/streams/archived', { params }),
};
