import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type LoginRequest, type RegisterRequest } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login: storeLogin, logout: storeLogout, isAuthenticated, user } = useAuthStore();
  const addToast = useUiStore((s) => s.addToast);

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: ({ data }) => {
      const { accessToken, refreshToken, user } = data.data;
      storeLogin(user, accessToken, refreshToken);
      addToast('Zalogowano pomyślnie', 'success');
      navigate('/');
    },
    onError: () => {
      addToast('Nieprawidłowy email lub hasło', 'error');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: ({ data }) => {
      const { accessToken, refreshToken, user } = data.data;
      storeLogin(user, accessToken, refreshToken);
      addToast('Konto utworzone!', 'success');
      navigate('/');
    },
    onError: () => {
      addToast('Błąd rejestracji. Sprawdź dane.', 'error');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      return refreshToken ? authApi.logout(refreshToken) : Promise.resolve();
    },
    onSettled: () => {
      storeLogout();
      queryClient.clear();
      navigate('/login');
    },
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe().then((r) => r.data.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: user ?? meQuery.data,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
