import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  name: string | null;
  image: string | null;
  city: string | null;
  role: string;
  viewerTier: string;
  createdAt: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<{ data: AuthResponse }>('/api/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<{ data: AuthResponse }>('/api/auth/register', data),

  refresh: (refreshToken: string) =>
    apiClient.post<{ data: AuthResponse }>('/api/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post('/api/auth/logout', { refreshToken }),

  getMe: () =>
    apiClient.get<{ data: UserResponse }>('/api/users/me'),
};
