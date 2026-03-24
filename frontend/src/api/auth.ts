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

// ── Mock/demo helpers ──────────────────────────────────────
const DEMO_MODE = !import.meta.env.VITE_API_URL || import.meta.env.VITE_DEMO === 'true';

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeMockUser(overrides: Partial<UserResponse> = {}): UserResponse {
  return {
    id: crypto.randomUUID(),
    email: 'demo@padelvision.pl',
    username: 'demo_player',
    name: 'Demo Player',
    image: null,
    city: 'Wrocław',
    role: 'VIEWER',
    viewerTier: 'FREE',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function mockAuthResponse(user: UserResponse): { data: { data: AuthResponse } } {
  return {
    data: {
      data: {
        accessToken: 'mock-access-' + crypto.randomUUID(),
        refreshToken: 'mock-refresh-' + crypto.randomUUID(),
        user,
      },
    },
  };
}

// ── API (falls back to mock when backend is unreachable) ──
async function withFallback<T>(
  apiFn: () => Promise<T>,
  mockFn: () => T | Promise<T>,
): Promise<T> {
  if (DEMO_MODE) {
    await delay(600);
    return mockFn();
  }
  try {
    return await apiFn();
  } catch {
    // Backend unreachable — fall back to mock
    await delay(400);
    return mockFn();
  }
}

export const authApi = {
  login: (data: LoginRequest) =>
    withFallback(
      () => apiClient.post<{ data: AuthResponse }>('/api/auth/login', data),
      () => {
        if (data.password.length < 8) throw new Error('Hasło za krótkie');
        return mockAuthResponse(
          makeMockUser({ email: data.email, username: data.email.split('@')[0] }),
        );
      },
    ),

  register: (data: RegisterRequest) =>
    withFallback(
      () => apiClient.post<{ data: AuthResponse }>('/api/auth/register', data),
      () =>
        mockAuthResponse(
          makeMockUser({
            email: data.email,
            username: data.username,
            name: data.name ?? null,
          }),
        ),
    ),

  refresh: (refreshToken: string) =>
    withFallback(
      () => apiClient.post<{ data: AuthResponse }>('/api/auth/refresh', { refreshToken }),
      () => mockAuthResponse(makeMockUser()),
    ),

  logout: (_refreshToken: string) =>
    withFallback(
      () => apiClient.post('/api/auth/logout', { refreshToken: _refreshToken }),
      () => ({ data: { success: true } }),
    ),

  getMe: () =>
    withFallback(
      () => apiClient.get<{ data: UserResponse }>('/api/users/me'),
      () => ({ data: { data: makeMockUser() } }),
    ),
};
