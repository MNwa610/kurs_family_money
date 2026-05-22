import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import {
  createExpense,
  createIncome,
  deleteExpense,
  deleteIncome,
  fetchAccounts,
  fetchExpenseCategories,
  fetchFamilyMembers,
  fetchIncomeTypes,
  updateExpense,
  updateIncome,
} from '@/api/index.js';
import Button from '@/components/ui/Button.jsx';

function toDateInput(iso) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return new Date(iso).toISOString().slice(0, 10);
}

export default function TransactionModal({ transaction, onClose, onSaved }) {
  const isEdit = Boolean(transaction?.id);
  const [type, setType] = useState(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction ? String(Math.abs(transaction.amount ?? transaction.displayAmount ?? 0)) : '');
  const [categoryId, setCategoryId] = useState('');
  const [memberId, setMemberId] = useState(transaction?.familyMemberId ?? '');
  const [accountId, setAccountId] = useState(transaction?.accountId ?? '');
  const [date, setDate] = useState(toDateInput(transaction?.occurredAt));
  const [note, setNote] = useState(transaction?.description ?? transaction?.subtitle ?? '');
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
        setMembers(memRes.data ?? []);
        setExpenseCategories(catRes.data ?? []);
        setIncomeTypes(typeRes.data ?? []);
        setAccounts(accRes.data ?? []);
        if (transaction) {
          setType(transaction.type);
          setCategoryId(
            transaction.incomeTypeId ?? transaction.expenseCategoryId ?? transaction.incomeType?.id ?? transaction.expenseCategory?.id ?? '',
          );
          setMemberId(transaction.familyMemberId ?? '');
          setAccountId(transaction.accountId ?? '');
        } else if (memRes.data?.[0]) {
          setMemberId(memRes.data[0].id);
          if (catRes.data?.[0]) setCategoryId(catRes.data[0].id);
        }
      })
      .catch((err) => setError(err.message ?? 'Не удалось загрузить справочники'))
      .finally(() => setLoading(false));
  }, [transaction]);

  useEffect(() => {
    if (isEdit) return;
    if (type === 'income' && incomeTypes[0]) setCategoryId(incomeTypes[0].id);
    else if (type === 'expense' && expenseCategories[0]) setCategoryId(expenseCategories[0].id);
  }, [type, incomeTypes, expenseCategories, isEdit]);

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
        accountId: accountId || null,
      };

      if (isEdit) {
        if (type === 'income') {
          await updateIncome(transaction.id, { ...body, incomeTypeId: categoryId });
        } else {
          await updateExpense(transaction.id, { ...body, expenseCategoryId: categoryId });
        }
      } else if (type === 'income') {
        await createIncome({ ...body, incomeTypeId: categoryId });
      } else {
        await createExpense({ ...body, expenseCategoryId: categoryId });
      }
      onSaved?.();
    } catch (err) {
      setError(err.message ?? 'Не удалось сохранить');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !window.confirm('Удалить операцию?')) return;
    setSubmitting(true);
    try {
      if (type === 'income') await deleteIncome(transaction.id);
      else await deleteExpense(transaction.id);
      onSaved?.();
    } catch (err) {
      setError(err.message ?? 'Не удалось удалить');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" style={{ position: 'relative' }}>
        <h2 className="modal__title">{isEdit ? 'Редактировать операцию' : 'Новая операция'}</h2>

        {!isEdit && (
          <div className="segmented">
            <button type="button" className={`segmented__btn${type === 'income' ? ' segmented__btn--active' : ''}`} onClick={() => setType('income')}>Доход</button>
            <button type="button" className={`segmented__btn${type === 'expense' ? ' segmented__btn--active' : ''}`} onClick={() => setType('expense')}>Расход</button>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-wrap">
              <label htmlFor="amount">Сумма</label>
              <input id="amount" className="input" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="input-wrap">
              <label htmlFor="category">{type === 'income' ? 'Тип дохода' : 'Категория'}</label>
              <select id="category" className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="">Выберите</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="input-wrap">
              <label htmlFor="date">Дата</label>
              <input id="date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="input-wrap">
              <label htmlFor="member">Член семьи</label>
              <select id="member" className="select" value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            {accounts.length > 0 && (
              <div className="input-wrap">
                <label htmlFor="account">Счёт</label>
                <select id="account" className="select" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  <option value="">Без счёта</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="input-wrap">
              <label htmlFor="note">Описание</label>
              <input id="note" className="input" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {error && <p style={{ color: 'var(--expense)', margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 8 }}>
              {isEdit ? (
                <Button type="button" variant="ghost" onClick={handleDelete} disabled={submitting} style={{ color: 'var(--expense)' }}>
                  Удалить
                </Button>
              ) : (
                <span />
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
                <Button type="submit" disabled={submitting}>{submitting ? '…' : 'Сохранить'}</Button>
              </div>
            </div>
          </form>
        )}
        <button type="button" className="btn btn--icon" onClick={onClose} aria-label="Закрыть" style={{ position: 'absolute', top: 16, right: 16 }}>
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
