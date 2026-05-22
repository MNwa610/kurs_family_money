import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import {
  acceptHouseholdInvite,
  createFamilyMember,
  createHouseholdInvite,
  createRecurring,
  deleteBudget,
  deleteFamilyMember,
  deleteRecurring,
  fetchBudgets,
  fetchExpenseCategories,
  fetchFamilyMembers,
  fetchHousehold,
  fetchIncomeTypes,
  fetchRecurring,
  processRecurring,
  removeHouseholdMember,
  updateFamilyMember,
  updateHousehold,
  upsertBudget,
} from '@/api/index.js';
import Button from '@/components/ui/Button.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { useMonth } from '@/context/MonthContext.jsx';
import { RELATION_OPTIONS, relationLabel } from '@/utils/family.js';
import { formatMoneyPlain } from '@/utils/format.js';

const TABS = [
  { id: 'profile', label: 'Профиль' },
  { id: 'family', label: 'Семья' },
  { id: 'budgets', label: 'Лимиты' },
  { id: 'recurring', label: 'Повторяющиеся' },
];

export default function SettingsPage() {
  const { month, label: monthLabel } = useMonth();
  const { refreshKey } = useOutletContext() ?? {};
  const { user, updateProfile } = useAuth();

  const [tab, setTab] = useState('profile');
  const [household, setHousehold] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [incomeTypes, setIncomeTypes] = useState([]);

  const [householdName, setHouseholdName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [lastInvite, setLastInvite] = useState(null);

  const [profileForm, setProfileForm] = useState({ name: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [familyForm, setFamilyForm] = useState({ name: '', relation: 'partner' });
  const [editingMember, setEditingMember] = useState(null);

  const [budgetForm, setBudgetForm] = useState({ categoryId: '', limit: '' });
  const [recForm, setRecForm] = useState({
    type: 'expense',
    amount: '',
    description: '',
    categoryId: '',
    memberId: '',
    dayOfMonth: '1',
    frequency: 'monthly',
  });

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setProfileForm((f) => ({ ...f, name: user.name ?? '' }));
    }
  }, [user]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [hh, bud, cats, rec, mems, types] = await Promise.all([
        fetchHousehold(),
        fetchBudgets(month),
        fetchExpenseCategories(),
        fetchRecurring(),
        fetchFamilyMembers(),
        fetchIncomeTypes(),
      ]);
      setHousehold(hh);
      setHouseholdName(hh.name ?? '');
      setBudgets(bud.data ?? []);
      setCategories(cats.data ?? []);
      setRecurring(rec.data ?? []);
      setFamilyMembers(mems.data ?? []);
      setIncomeTypes(types.data ?? []);

      setBudgetForm((f) => ({
        categoryId: f.categoryId || cats.data?.[0]?.id || '',
        limit: f.limit,
      }));
      setRecForm((f) => ({
        ...f,
        memberId: f.memberId || mems.data?.[0]?.id || '',
        categoryId: f.categoryId || (f.type === 'income' ? types.data?.[0]?.id : cats.data?.[0]?.id) || '',
      }));
    } catch (e) {
      setError(e.message ?? 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  const handleProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      setError('Новый пароль и подтверждение не совпадают');
      return;
    }
    try {
      const body = { name: profileForm.name };
      if (profileForm.newPassword) {
        body.currentPassword = profileForm.currentPassword;
        body.newPassword = profileForm.newPassword;
      }
      await updateProfile(body);
      setProfileForm((f) => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setMsg('Профиль сохранён');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleHouseholdRename = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await updateHousehold(householdName);
      setMsg('Название семьи обновлено');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await createFamilyMember({ name: familyForm.name.trim(), relation: familyForm.relation });
      setFamilyForm({ name: '', relation: 'partner' });
      setMsg('Член семьи добавлен');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveFamilyMember = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    setMsg('');
    try {
      await updateFamilyMember(editingMember.id, {
        name: editingMember.name.trim(),
        relation: editingMember.relation,
      });
      setEditingMember(null);
      setMsg('Изменения сохранены');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await createHouseholdInvite(inviteEmail);
      setLastInvite(res);
      setMsg(res.message ?? 'Приглашение отправлено. Пользователь увидит его в колокольчике уведомлений.');
      setInviteEmail('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAccept = async (e) => {
    e.preventDefault();
    try {
      const res = await acceptHouseholdInvite(inviteToken);
      setMsg(res.message);
      setInviteToken('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBudget = async (e) => {
    e.preventDefault();
    try {
      await upsertBudget({
        month,
        expenseCategoryId: budgetForm.categoryId,
        limit: Number(budgetForm.limit),
      });
      setBudgetForm((f) => ({ ...f, limit: '' }));
      setMsg('Лимит сохранён');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRecurring = async (e) => {
    e.preventDefault();
    try {
      const body = {
        type: recForm.type,
        amount: Number(recForm.amount),
        description: recForm.description,
        familyMemberId: recForm.memberId,
        frequency: recForm.frequency,
        dayOfMonth: Number(recForm.dayOfMonth),
      };
      if (recForm.type === 'expense') body.expenseCategoryId = recForm.categoryId;
      else body.incomeTypeId = recForm.categoryId;
      await createRecurring(body);
      setMsg('Повторяющийся платёж добавлен');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProcessRecurring = async () => {
    try {
      const res = await processRecurring();
      setMsg(`Создано операций: ${res.processed}`);
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && !household && tab !== 'profile') {
    return (
      <main className="page">
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="settings-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip${tab === t.id ? ' chip--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="settings-msg settings-msg--error">{error}</p>}
      {msg && <p className="settings-msg settings-msg--ok">{msg}</p>}

      {tab === 'profile' && user && (
        <section className="settings-section card">
          <h2>Профиль</h2>
          <form onSubmit={handleProfile} className="settings-form">
            <div className="input-wrap">
              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" className="input" type="email" value={user.email} disabled />
            </div>
            <div className="input-wrap">
              <label htmlFor="profile-name">Отображаемое имя</label>
              <input
                id="profile-name"
                className="input"
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Иван"
              />
            </div>

            <h3 style={{ marginTop: 8 }}>Сменить пароль</h3>
            <p className="settings-hint">Оставьте пустым, если пароль менять не нужно</p>
            <div className="input-wrap">
              <label htmlFor="profile-current">Текущий пароль</label>
              <input
                id="profile-current"
                className="input"
                type="password"
                autoComplete="current-password"
                value={profileForm.currentPassword}
                onChange={(e) => setProfileForm((f) => ({ ...f, currentPassword: e.target.value }))}
              />
            </div>
            <div className="settings-form__row">
              <div className="input-wrap">
                <label htmlFor="profile-new">Новый пароль</label>
                <input
                  id="profile-new"
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm((f) => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
              <div className="input-wrap">
                <label htmlFor="profile-confirm">Подтверждение</label>
                <input
                  id="profile-confirm"
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={profileForm.confirmPassword}
                  onChange={(e) => setProfileForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            <Button type="submit">Сохранить профиль</Button>
          </form>
        </section>
      )}

      {tab === 'family' && household && (
        <>
          <section className="settings-section card">
            <h2>Бюджет семьи</h2>
            {household.role === 'owner' ? (
              <form onSubmit={handleHouseholdRename} className="settings-form">
                <div className="settings-form__row">
                  <input
                    className="input"
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="secondary">Переименовать</Button>
                </div>
              </form>
            ) : (
              <p>{household.name}</p>
            )}
            <p className="settings-hint">Ваша роль: {household.role === 'owner' ? 'владелец' : 'участник'}</p>

            <h3 style={{ marginTop: 24 }}>Члены семьи</h3>
            <p className="settings-hint">
              Участники бюджета — кто получает доходы и совершает расходы (отображаются в операциях и отчётах).
            </p>

            <ul className="settings-list">
              {familyMembers.map((m) => (
                <li key={m.id} className={`settings-list__item${editingMember?.id === m.id ? ' settings-list__item--edit' : ''}`}>
                  {editingMember?.id === m.id ? (
                    <form onSubmit={handleSaveFamilyMember} className="settings-form settings-form--inline">
                      <div className="settings-form__row">
                        <input
                          className="input"
                          type="text"
                          value={editingMember.name}
                          onChange={(e) => setEditingMember((em) => ({ ...em, name: e.target.value }))}
                          required
                        />
                        <select
                          className="select"
                          value={editingMember.relation ?? ''}
                          onChange={(e) => setEditingMember((em) => ({ ...em, relation: e.target.value }))}
                        >
                          {RELATION_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <Button type="submit" variant="secondary">Сохранить</Button>
                        <Button type="button" variant="ghost" onClick={() => setEditingMember(null)}>Отмена</Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <span>
                        <strong>{m.name}</strong>
                        {m.relation && (
                          <span className="settings-member-relation"> — {relationLabel(m.relation)}</span>
                        )}
                      </span>
                      <span className="settings-list__actions">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => setEditingMember({ id: m.id, name: m.name, relation: m.relation ?? 'other' })}
                        >
                          Изменить
                        </Button>
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => deleteFamilyMember(m.id).then(reload).catch((err) => setError(err.message))}
                        >
                          Удалить
                        </Button>
                      </span>
                    </>
                  )}
                </li>
              ))}
              {familyMembers.length === 0 && (
                <li style={{ color: 'var(--text-secondary)' }}>Добавьте хотя бы одного члена семьи</li>
              )}
            </ul>

            <form onSubmit={handleAddFamilyMember} className="settings-form" style={{ marginTop: 16 }}>
              <h4>Добавить члена семьи</h4>
              <div className="settings-form__row">
                <input
                  className="input"
                  type="text"
                  placeholder="Имя"
                  value={familyForm.name}
                  onChange={(e) => setFamilyForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <select
                  className="select"
                  value={familyForm.relation}
                  onChange={(e) => setFamilyForm((f) => ({ ...f, relation: e.target.value }))}
                >
                  {RELATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <Button type="submit">Добавить</Button>
              </div>
            </form>
          </section>

          <section className="settings-section card" style={{ marginTop: 16 }}>
            <h3>Участники приложения</h3>
            <p className="settings-hint">
              Зарегистрированные пользователи с доступом к этому бюджету (не путать с членами семьи выше).
            </p>
            <ul className="settings-list">
              {household.members.map((m) => (
                <li key={m.id} className="settings-list__item">
                  <span>
                    {m.name ?? m.email}
                    <span className="settings-member-relation"> — {m.role === 'owner' ? 'владелец' : 'участник'}</span>
                  </span>
                  {household.role === 'owner' && m.role !== 'owner' && (
                    <Button variant="ghost" onClick={() => removeHouseholdMember(m.id).then(reload)}>
                      Удалить
                    </Button>
                  )}
                </li>
              ))}
            </ul>

            {household.role === 'owner' && (
              <>
                <form onSubmit={handleInvite} className="settings-form" style={{ marginTop: 24 }}>
                  <h4>Пригласить по email</h4>
                  <div className="input-wrap">
                    <input
                      className="input"
                      type="email"
                      placeholder="partner@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit">Отправить приглашение</Button>
                </form>
                {lastInvite?.token && (
                  <p className="settings-hint">
                    Приглашённый увидит заявку в уведомлениях (колокольчик). Токен для ручного ввода: <code>{lastInvite.token}</code>
                  </p>
                )}
              </>
            )}

            <form onSubmit={handleAccept} className="settings-form" style={{ marginTop: 24 }}>
              <h4>Принять приглашение</h4>
              <div className="input-wrap">
                <input
                  className="input"
                  type="text"
                  placeholder="Токен приглашения"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary">Присоединиться к семье</Button>
            </form>
          </section>
        </>
      )}

      {tab === 'budgets' && (
        <section className="settings-section card">
          <h2>Лимиты на {monthLabel}</h2>
          <form onSubmit={handleBudget} className="settings-form">
            <div className="settings-form__row">
              <select className="select" value={budgetForm.categoryId} onChange={(e) => setBudgetForm((f) => ({ ...f, categoryId: e.target.value }))}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input className="input" type="number" placeholder="Лимит ₽" value={budgetForm.limit} onChange={(e) => setBudgetForm((f) => ({ ...f, limit: e.target.value }))} required />
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
          <ul className="settings-list" style={{ marginTop: 16 }}>
            {budgets.map((b) => (
              <li key={b.id} className="settings-list__item">
                <span>{b.categoryName}: {formatMoneyPlain(b.limit)}</span>
                <Button variant="ghost" onClick={() => deleteBudget(b.id).then(reload)}>Удалить</Button>
              </li>
            ))}
            {budgets.length === 0 && <li style={{ color: 'var(--text-secondary)' }}>Лимиты не заданы</li>}
          </ul>
        </section>
      )}

      {tab === 'recurring' && (
        <section className="settings-section card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Повторяющиеся платежи</h2>
            <Button variant="secondary" onClick={handleProcessRecurring}>Выполнить сейчас</Button>
          </div>
          <form onSubmit={handleRecurring} className="settings-form" style={{ marginTop: 16 }}>
            <div className="segmented">
              <button type="button" className={`segmented__btn${recForm.type === 'income' ? ' segmented__btn--active' : ''}`} onClick={() => setRecForm((f) => ({ ...f, type: 'income', categoryId: incomeTypes[0]?.id ?? '' }))}>Доход</button>
              <button type="button" className={`segmented__btn${recForm.type === 'expense' ? ' segmented__btn--active' : ''}`} onClick={() => setRecForm((f) => ({ ...f, type: 'expense', categoryId: categories[0]?.id ?? '' }))}>Расход</button>
            </div>
            <div className="settings-form__row">
              <input className="input" type="number" placeholder="Сумма" value={recForm.amount} onChange={(e) => setRecForm((f) => ({ ...f, amount: e.target.value }))} required />
              <input className="input" type="text" placeholder="Описание" value={recForm.description} onChange={(e) => setRecForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="settings-form__row">
              <select className="select" value={recForm.categoryId} onChange={(e) => setRecForm((f) => ({ ...f, categoryId: e.target.value }))}>
                {(recForm.type === 'income' ? incomeTypes : categories).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select className="select" value={recForm.memberId} onChange={(e) => setRecForm((f) => ({ ...f, memberId: e.target.value }))}>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <input className="input" type="number" min="1" max="28" placeholder="День месяца" value={recForm.dayOfMonth} onChange={(e) => setRecForm((f) => ({ ...f, dayOfMonth: e.target.value }))} style={{ width: 120 }} />
            </div>
            <Button type="submit">Добавить</Button>
          </form>
          <ul className="settings-list" style={{ marginTop: 16 }}>
            {recurring.map((r) => (
              <li key={r.id} className="settings-list__item">
                <span>
                  {r.type === 'income' ? '+' : '−'}
                  {formatMoneyPlain(r.amount)} — {r.description ?? 'Без описания'} (день {r.dayOfMonth})
                </span>
                <Button variant="ghost" onClick={() => deleteRecurring(r.id).then(reload)}>Удалить</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
