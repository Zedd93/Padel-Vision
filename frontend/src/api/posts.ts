import { apiClient } from './client';

export interface FeedPost {
  id: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  description: string;
  tags: string[];
  hashtags: string[];
  aspectRatio: string;
  duration: number;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  user: { id: string; username: string; name: string | null; image: string | null };
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; image: string | null };
}

export type FeedFilter = 'all' | 'akcje' | 'montaze' | 'turnieje';

export const postsApi = {
  getFeed: (params: { filter?: FeedFilter; page?: number; size?: number }) =>
    apiClient.get('/api/posts', { params }),

  getById: (id: string) =>
    apiClient.get<{ data: FeedPost }>(`/api/posts/${id}`),

  create: (formData: FormData) =>
    apiClient.post('/api/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) =>
    apiClient.delete(`/api/posts/${id}`),

  like: (id: string) =>
    apiClient.post(`/api/posts/${id}/like`),

  unlike: (id: string) =>
    apiClient.delete(`/api/posts/${id}/like`),

  getComments: (id: string, params?: { page?: number; size?: number }) =>
    apiClient.get<{ data: Comment[] }>(`/api/posts/${id}/comments`, { params }),

  addComment: (id: string, content: string) =>
    apiClient.post(`/api/posts/${id}/comments`, { content }),

  deleteComment: (postId: string, commentId: string) =>
    apiClient.delete(`/api/posts/${postId}/comments/${commentId}`),
};
