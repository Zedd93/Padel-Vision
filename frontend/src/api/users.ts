import { apiClient } from './client';
import type { UserResponse } from './auth';

export interface UserProfile extends UserResponse {
  matchesPlayed: number;
  winRate: number;
  clipsCount: number;
  totalViews: number;
  eloRating: number | null;
  clubName: string | null;
  badges: string[];
}

export const usersApi = {
  getMe: () =>
    apiClient.get<{ data: UserResponse }>('/api/users/me'),

  updateMe: (data: Partial<{ name: string; username: string; city: string; image: string }>) =>
    apiClient.put<{ data: UserResponse }>('/api/users/me', data),

  getById: (id: string) =>
    apiClient.get<{ data: UserProfile }>(`/api/users/${id}`),

  getPosts: (id: string, params?: { page?: number; size?: number }) =>
    apiClient.get(`/api/users/${id}/posts`, { params }),

  getStats: (id: string) =>
    apiClient.get(`/api/users/${id}/stats`),
};
