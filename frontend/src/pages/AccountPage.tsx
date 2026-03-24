import { useState } from 'react';
import { User, Mail, Lock, Bell, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AccountSettingsPage() {
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState({
    streamLive: true,
    playerMatch: true,
    tournamentStart: true,
    ppvAvailable: false,
    bitsPromo: false,
  });

  const inputClass =
    'w-full rounded-lg border border-border bg-bg3 px-4 py-2.5 text-sm text-text placeholder:text-muted focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime/30';

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-display text-2xl">Ustawienia konta</h1>

      <div className="space-y-6">
        {/* Profile Info */}
        <div className="glass-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
            <User className="h-4 w-4 text-lime" />
            Dane profilu
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-muted">Nazwa wyświetlana</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Twoja nazwa"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Nazwa użytkownika</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">@</span>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className={`${inputClass} opacity-60`}
                />
              </div>
              <p className="mt-1 text-xs text-muted">Nazwa użytkownika nie może być zmieniona</p>
            </div>
            <div className="flex justify-end">
              <button className="btn-primary px-6 py-2 text-sm">Zapisz zmiany</button>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="glass-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
            <Mail className="h-4 w-4 text-lime" />
            Adres email
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-muted">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className={`${inputClass} opacity-60`}
              />
              <p className="mt-1 text-xs text-muted">
                Aby zmienić email, skontaktuj się z supportem
              </p>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="glass-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
            <Lock className="h-4 w-4 text-lime" />
            Zmiana hasła
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-muted">Obecne hasło</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Nowe hasło</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="Min. 8 znaków"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Potwierdź nowe hasło</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Powtórz hasło"
              />
            </div>
            <div className="flex justify-end">
              <button className="btn-primary px-6 py-2 text-sm">Zmień hasło</button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
            <Bell className="h-4 w-4 text-lime" />
            Powiadomienia
          </h2>
          <div className="space-y-3">
            {[
              { key: 'streamLive', label: 'Stream na żywo', desc: 'Gdy obserwowany klub zacznie transmisję' },
              { key: 'playerMatch', label: 'Mecz gracza', desc: 'Gdy obserwowany gracz ma mecz' },
              { key: 'tournamentStart', label: 'Start turnieju', desc: 'Gdy turniej się rozpoczyna' },
              { key: 'ppvAvailable', label: 'PPV dostępne', desc: 'Nowe treści pay-per-view' },
              { key: 'bitsPromo', label: 'Promocje Piłek', desc: 'Oferty i promocje na Piłki' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-bg3"
              >
                <div>
                  <p className="text-sm font-medium text-text">{item.label}</p>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications[item.key as keyof typeof notifications]}
                  onChange={(e) =>
                    setNotifications((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-border bg-bg3 text-lime accent-lime"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="glass-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text">
            <Shield className="h-4 w-4 text-lime" />
            Informacje o koncie
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Rola</span>
              <span className="font-medium text-text">
                {user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'CLUB' ? 'Właściciel klubu' : 'Widz'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Plan</span>
              <span className="rounded-full bg-lime/20 px-2 py-0.5 text-xs font-bold text-lime">
                {(user as any)?.viewerTier || 'FREE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
