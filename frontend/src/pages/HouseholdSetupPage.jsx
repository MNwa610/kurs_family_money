import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Home, Users } from 'lucide-react';

import { declineHouseholdInvite, fetchNotifications } from '@/api/index.js';
import Button from '@/components/ui/Button.jsx';
import { useAuth } from '@/context/AuthContext.jsx';

function formatWhen(iso) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HouseholdSetupPage() {
  const { user, hasHousehold, loading, createHousehold, joinHousehold } = useAuth();
  const [mode, setMode] = useState('create');
  const [householdName, setHouseholdName] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInvites = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setIncomingInvites(data.incomingInvites ?? []);
    } catch {
      setIncomingInvites([]);
    }
  }, []);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && hasHousehold) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createHousehold(householdName.trim() || undefined);
    } catch (err) {
      setError(err.message ?? 'Не удалось создать семью');
      setSubmitting(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await joinHousehold(inviteToken.trim());
    } catch (err) {
      setError(err.message ?? 'Не удалось принять приглашение');
      setSubmitting(false);
    }
  };

  const handleAcceptInvite = async (token) => {
    setError('');
    setSubmitting(true);
    try {
      await joinHousehold(token);
    } catch (err) {
      setError(err.message ?? 'Не удалось принять приглашение');
      setSubmitting(false);
    }
  };

  const handleDecline = async (id) => {
    try {
      await declineHouseholdInvite(id);
      await loadInvites();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page setup-page">
      <div className="setup-card card">
        <h1 className="auth-card__title">Добро пожаловать{user?.name ? `, ${user.name}` : ''}!</h1>
        <p className="auth-card__subtitle">
          Создайте новую семью для учёта бюджета или присоединитесь к уже существующей по приглашению.
        </p>

        <div className="setup-choice">
          <button
            type="button"
            className={`setup-choice__btn${mode === 'create' ? ' setup-choice__btn--active' : ''}`}
            onClick={() => { setMode('create'); setError(''); }}
          >
            <Home size={22} />
            <span className="setup-choice__title">Создать семью</span>
            <span className="setup-choice__hint">Свой бюджет с нуля</span>
          </button>
          <button
            type="button"
            className={`setup-choice__btn${mode === 'join' ? ' setup-choice__btn--active' : ''}`}
            onClick={() => { setMode('join'); setError(''); }}
          >
            <Users size={22} />
            <span className="setup-choice__title">Присоединиться</span>
            <span className="setup-choice__hint">По приглашению</span>
          </button>
        </div>

        {incomingInvites.length > 0 && (
          <section className="setup-invites">
            <h3>Ваши приглашения</h3>
            {incomingInvites.map((inv) => (
              <div key={inv.id} className="setup-invites__item">
                <p>
                  <strong>«{inv.householdName}»</strong>
                  <span className="setup-invites__meta"> от {inv.invitedByName}</span>
                </p>
                <p className="setup-invites__meta">до {formatWhen(inv.expiresAt)}</p>
                <div className="setup-invites__actions">
                  <Button type="button" disabled={submitting} onClick={() => handleAcceptInvite(inv.token)}>
                    Принять
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => handleDecline(inv.id)}>
                    Отклонить
                  </Button>
                </div>
              </div>
            ))}
          </section>
        )}

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="auth-form setup-form">
            <div className="input-wrap">
              <label htmlFor="household-name">Название семьи</label>
              <input
                id="household-name"
                className="input"
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder={user?.name ? `Семья ${user.name}` : 'Моя семья'}
              />
              <p className="settings-hint">Можно оставить пустым — подставится имя по умолчанию</p>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Создание…' : 'Создать семью'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="auth-form setup-form">
            <div className="input-wrap">
              <label htmlFor="invite-token">Токен приглашения</label>
              <input
                id="invite-token"
                className="input"
                type="text"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder="Вставьте токен от владельца семьи"
                required
              />
              <p className="settings-hint">
                Токен выдаёт владелец в настройках или в уведомлениях после отправки приглашения на ваш email.
              </p>
            </div>
            <Button type="submit" disabled={submitting || !inviteToken.trim()}>
              {submitting ? 'Подключение…' : 'Присоединиться к семье'}
            </Button>
          </form>
        )}

        {error && <p className="auth-form__error">{error}</p>}
      </div>
    </div>
  );
}
