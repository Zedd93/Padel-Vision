import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const { login, register, isLoggingIn, isRegistering } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const isPending = isLoggingIn || isRegistering;

  const inputClass = (field: string) =>
    `w-full rounded-lg border ${errors[field] ? 'border-live' : 'border-border'} bg-bg3 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime/30`;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) {
      errs.email = 'Podaj adres email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Podaj poprawny adres email';
    }
    if (!password) {
      errs.password = 'Podaj hasło';
    } else if (isRegister && password.length < 8) {
      errs.password = 'Hasło musi mieć min. 8 znaków';
    }
    if (isRegister) {
      if (!username.trim()) {
        errs.username = 'Nazwa użytkownika jest wymagana';
      } else if (username.trim().length < 3) {
        errs.username = 'Nazwa musi mieć min. 3 znaki';
      }
      if (!confirmPassword) {
        errs.confirmPassword = 'Potwierdź hasło';
      } else if (password !== confirmPassword) {
        errs.confirmPassword = 'Hasła nie są identyczne';
      }
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setServerError('');
    if (Object.keys(validationErrors).length > 0) return;

    if (isRegister) {
      register({ email: email.trim(), password, username: username.trim() });
    } else {
      login({ email: email.trim(), password });
    }
  };

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
    if (serverError) setServerError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="mb-6 text-center">
            <Link to="/" className="text-display text-3xl text-lime transition-opacity hover:opacity-80">
              PADEL VISION
            </Link>
            <p className="mt-2 text-sm text-muted">
              {isRegister ? 'Utwórz nowe konto' : 'Zaloguj się do swojego konta'}
            </p>
          </div>

          {serverError && (
            <div className="mb-4 rounded-lg border border-live/30 bg-live/10 px-4 py-3 text-sm text-live">
              {serverError}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Username (register only) */}
            {isRegister && (
              <div>
                <label htmlFor="register-username" className="mb-1 block text-sm text-muted">
                  Nazwa użytkownika
                </label>
                <input
                  id="register-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearFieldError('username');
                  }}
                  disabled={isPending}
                  className={inputClass('username')}
                  placeholder="padelmaster"
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-live">{errors.username}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="auth-email" className="mb-1 block text-sm text-muted">
                Email
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                disabled={isPending}
                className={inputClass('email')}
                placeholder="twoj@email.pl"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-live">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="auth-password" className="mb-1 block text-sm text-muted">
                Hasło
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  disabled={isPending}
                  className={inputClass('password')}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-text"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-live">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password (register only) */}
            {isRegister && (
              <div>
                <label htmlFor="auth-confirmPassword" className="mb-1 block text-sm text-muted">
                  Potwierdź hasło
                </label>
                <div className="relative">
                  <input
                    id="auth-confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearFieldError('confirmPassword');
                    }}
                    disabled={isPending}
                    className={inputClass('confirmPassword')}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-text"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-live">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Forgot password (login only) */}
            {!isRegister && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-lime hover:underline">
                  Nie pamiętasz hasła?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isRegister ? 'Tworzenie konta...' : 'Logowanie...'}
                </>
              ) : (
                isRegister ? 'Utwórz konto' : 'Zaloguj się'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">lub</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={isPending}
              className="btn-secondary w-full disabled:opacity-50"
            >
              Kontynuuj z Google
            </button>
            {!isRegister && (
              <button className="btn-secondary w-full" disabled>
                Kontynuuj z Facebook
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            {isRegister ? (
              <>
                Masz już konto?{' '}
                <Link to="/login" className="text-lime hover:underline">
                  Zaloguj się
                </Link>
              </>
            ) : (
              <>
                Nie masz konta?{' '}
                <Link to="/register" className="text-lime hover:underline">
                  Zarejestruj się
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
