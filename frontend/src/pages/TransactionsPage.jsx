import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

import { fetchExpenseCategories, fetchFamilyMembers, fetchTransactions } from '@/api/index.js';
import Button from '@/components/ui/Button.jsx';
import MonthSelect from '@/components/ui/MonthSelect.jsx';
import TransactionRow from '@/components/ui/TransactionRow.jsx';
import { useMonth } from '@/context/MonthContext.jsx';
import { mapTransactionForRow } from '@/utils/transactions.js';

const TYPE_FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'income', label: 'Доходы' },
  { id: 'expense', label: 'Расходы' },
];

export default function TransactionsPage() {
  const { openAddModal, refreshKey } = useOutletContext() ?? {};
  const { month } = useMonth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryId, setCategoryId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchExpenseCategories(), fetchFamilyMembers()])
      .then(([catRes, memRes]) => {
        setCategories(catRes.data ?? []);
        setMembers(memRes.data ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const params = { month, limit: 100 };
    if (typeFilter !== 'all') params.type = typeFilter;
    if (search.trim()) params.search = search.trim();
    if (memberId) params.familyMemberId = memberId;
    if (categoryId && typeFilter !== 'income') params.expenseCategoryId = categoryId;

    const timer = setTimeout(() => {
      fetchTransactions(params)
        .then((res) => {
          if (!cancelled) {
            setTransactions((res.data ?? []).map(mapTransactionForRow));
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err.message ?? 'Не удалось загрузить операции');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, search.trim() ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [month, typeFilter, search, categoryId, memberId, refreshKey]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const tx of transactions) {
      const label = tx.dateLabel;
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(tx);
    }
    return [...map.entries()];
  }, [transactions]);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryId('');
    setMemberId('');
  };

  return (
    <main className="page">
      <div className="filter-bar">
        <div className="filter-bar__search">
          <Search size={18} />
          <input
            className="input input--search"
            type="search"
            placeholder="Поиск по описанию…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <MonthSelect style={{ width: 160 }} />
        <div className="filter-bar__chips">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`chip${typeFilter === f.id ? ' chip--active' : ''}`}
              onClick={() => setTypeFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          className="select"
          aria-label="Категория"
          style={{ width: 160 }}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={typeFilter === 'income'}
        >
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="select"
          aria-label="Член семьи"
          style={{ width: 160 }}
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        >
          <option value="">Вся семья</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <div className="filter-bar__spacer" />
        <Button variant="ghost" type="button" onClick={resetFilters}>
          Сбросить
        </Button>
        <Button type="button" onClick={openAddModal}>
          <Plus size={18} />
          Добавить
        </Button>
      </div>

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>}
      {error && <p style={{ color: 'var(--expense)' }}>{error}</p>}

      {!loading && !error && grouped.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Операций не найдено</p>
          <Button onClick={openAddModal}>Добавить операцию</Button>
        </div>
      ) : (
        grouped.map(([label, items]) => (
          <section key={label}>
            <div className="date-group__label">{label}</div>
            <div className="transactions-list">
              {items.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          </section>
        ))
      )}

      <button type="button" className="fab" onClick={openAddModal} aria-label="Добавить операцию">
        <Plus size={24} />
      </button>
    </main>
  );
}
