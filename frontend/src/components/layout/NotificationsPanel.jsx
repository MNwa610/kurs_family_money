import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  cancelHouseholdInvite,
  declineHouseholdInvite,
  fetchNotifications,
} from '@/api/index.js';
import Button from '@/components/ui/Button.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { formatMoneyPlain } from '@/utils/format.js';

function formatWhen(iso) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPanel({ refreshKey, onChanged }) {
  const navigate = useNavigate();
  const { joinHousehold } = useAuth();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchNotifications();
      setData(res);
    } catch (e) {
      setError(e.message ?? 'Не удалось загрузить');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const handleAccept = async (token) => {
    try {
      await joinHousehold(token);
      setOpen(false);
      onChanged?.();
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDecline = async (id) => {
    try {
      await declineHouseholdInvite(id);
      await load();
      onChanged?.();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelHouseholdInvite(id);
      await load();
      onChanged?.();
    } catch (e) {
      setError(e.message);
    }
  };

  const count = data?.unreadCount ?? 0;
  const incoming = data?.incomingInvites ?? [];
  const outgoing = data?.outgoingInvites ?? [];
  const activity = data?.memberActivity ?? [];

  return (
    <div className="notifications" ref={panelRef}>
      <button
        type="button"
        className="notifications__trigger"
        aria-label="Уведомления"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <Bell size={20} />
        {count > 0 && <span className="notifications__badge">{count > 99 ? '99+' : count}</span>}
      </button>

      {open && (
        <div className="notifications__panel card" role="dialog" aria-label="Уведомления">
          <div className="notifications__header">
            <h3>Уведомления</h3>
            <button type="button" className="notifications__close" onClick={() => setOpen(false)} aria-label="Закрыть">
              ×
            </button>
          </div>

          {loading && <p className="notifications__empty">Загрузка…</p>}
          {error && <p className="notifications__error">{error}</p>}

          {!loading && (
            <>
              <section className="notifications__section">
                <h4>Приглашения в семью</h4>
                {incoming.length === 0 && outgoing.length === 0 && (
                  <p className="notifications__empty">Нет активных приглашений</p>
                )}
                {incoming.map((inv) => (
                  <div key={inv.id} className="notifications__item">
                    <p className="notifications__item-title">
                      Вас приглашают в «{inv.householdName}»
                    </p>
                    <p className="notifications__item-meta">
                      от {inv.invitedByName} · до {formatWhen(inv.expiresAt)}
                    </p>
                    <div className="notifications__item-actions">
                      <Button type="button" onClick={() => handleAccept(inv.token)}>Принять</Button>
                      <Button type="button" variant="ghost" onClick={() => handleDecline(inv.id)}>Отклонить</Button>
                    </div>
                  </div>
                ))}
                {outgoing.map((inv) => (
                  <div key={inv.id} className="notifications__item notifications__item--muted">
                    <p className="notifications__item-title">Ожидает: {inv.email}</p>
                    <p className="notifications__item-meta">отправлено {formatWhen(inv.createdAt)}</p>
                    <div className="notifications__item-actions">
                      <Button type="button" variant="ghost" onClick={() => handleCancel(inv.id)}>Отменить</Button>
                    </div>
                  </div>
                ))}
              </section>

              <section className="notifications__section">
                <h4>Операции членов семьи</h4>
                {activity.length === 0 ? (
                  <p className="notifications__empty">Нет недавних операций других участников</p>
                ) : (
                  activity.map((tx) => (
                    <div key={`${tx.type}-${tx.id}`} className="notifications__item notifications__item--compact">
                      <p className="notifications__item-title">
                        <span className={tx.type === 'income' ? 'amount--income' : 'amount--expense'}>
                          {tx.type === 'income' ? '+' : '−'}
                          {formatMoneyPlain(tx.amount)}
                        </span>
                        {' '}
                        {tx.categoryName}
                      </p>
                      <p className="notifications__item-meta">
                        {tx.familyMemberName}
                        {tx.description ? ` · ${tx.description}` : ''}
                        {' · '}
                        {formatWhen(tx.occurredAt)}
                      </p>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
