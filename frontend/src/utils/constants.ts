export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const COLORS = {
  obsidian: '#0B0C10',
  surface: '#1C1D26',
  surface2: '#252632',
  lime: '#C8FF00',
  red: '#FF3B3B',
  orange: '#FF6A00',
  white: '#F0F0F0',
  muted: '#7A7B8A',
  border: 'rgba(200, 255, 0, 0.13)',
} as const;

export const USER_ROLES = {
  VIEWER: 'VIEWER',
  CLUB: 'CLUB',
  ADMIN: 'ADMIN',
} as const;

export const STREAM_STATUS = {
  LIVE: 'LIVE',
  OFFLINE: 'OFFLINE',
  VOD: 'VOD',
} as const;
