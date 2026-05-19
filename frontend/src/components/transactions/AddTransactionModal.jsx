import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import {
  createExpense,
  createIncome,
  fetchAccounts,
  fetchExpenseCategories,
  fetchFamilyMembers,
  fetchIncomeTypes,
} from '@/api/index.js';
import Button from '@/components/ui/Button.jsx';

export default function AddTransactionModal({ onClose, onSaved }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [members, setMembers] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeTypes, setIncomeTypes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchFamilyMembers(),
      fetchExpenseCategories(),
      fetchIncomeTypes(),
      fetchAccounts(),
    ])
      .then(([memRes, catRes, typeRes, accRes]) => {
        const mems = memRes.data ?? [];
        const cats = catRes.data ?? [];
        const types = typeRes.data ?? [];
        const accs = accRes.data ?? [];
        setMembers(mems);
        setExpenseCategories(cats);
        setIncomeTypes(types);
        setAccounts(accs);
        if (mems[0]) setMemberId(mems[0].id);
        if (cats[0]) setCategoryId(cats[0].id);
      })
      .catch((err) => setError(err.message ?? 'Не удалось загрузить справочники'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (type === 'income' && incomeTypes[0]) {
      setCategoryId(incomeTypes[0].id);
    } else if (type === 'expense' && expenseCategories[0]) {
      setCategoryId(expenseCategories[0].id);
    }
  }, [type, incomeTypes, expenseCategories]);

  const categories = type === 'income' ? incomeTypes : expenseCategories;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body = {
        amount: Number(amount),
        familyMemberId: memberId,
        description: note || undefined,
        occurredAt: date,
      };
      if (accountId) body.accountId = accountId;

      if (type === 'income') {
        await createIncome({ ...body, incomeTypeId: categoryId });
      } else {
        await createExpense({ ...body, expenseCategoryId: categoryId });
      }
      onSaved?.();
    } catch (err) {
      setError(err.message ?? 'Не удалось сохранить операцию');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="add-tx-title"
        style={{ position: 'relative' }}
      >
        <h2 id="add-tx-title" className="modal__title">
          Новая операция
        </h2>
        <div className="segmented">
          <button
            type="button"
            className={`segmented__btn${type === 'income' ? ' segmented__btn--active' : ''}`}
            onClick={() => setType('income')}
          >
            Доход
          </button>
          <button
            type="button"
            className={`segmented__btn${type === 'expense' ? ' segmented__btn--active' : ''}`}
            onClick={() => setType('expense')}
          >
            Расход
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div className="input-wrap">
              <label htmlFor="amount">Сумма</label>
              <input
                id="amount"
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="input-wrap">
              <label htmlFor="category">{type === 'income' ? 'Тип дохода' : 'Категория'}</label>
              <select
                id="category"
                className="select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Выберите</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-wrap">
              <label htmlFor="date">Дата</label>
              <input
                id="date"
                className="input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="input-wrap">
              <label htmlFor="member">Член семьи</label>
              <select
                id="member"
                className="select"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            {accounts.length > 0 && (
              <div className="input-wrap">
                <label htmlFor="account">Счёт (необязательно)</label>
                <select
                  id="account"
                  className="select"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  <option value="">Без счёта</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="input-wrap">
              <label htmlFor="note">Описание</label>
              <input
                id="note"
                className="input"
                type="text"
                placeholder="Комментарий"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && <p style={{ color: 'var(--expense)', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </div>
          </form>
        )}

        <button
          type="button"
          className="btn btn--icon"
          onClick={onClose}
          aria-label="Закрыть"
          style={{ position: 'absolute', top: 16, right: 16 }}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
