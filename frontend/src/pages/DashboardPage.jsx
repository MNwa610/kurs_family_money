import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';

import { fetchDashboard } from '@/api/index.js';
import TransactionRow from '@/components/ui/TransactionRow.jsx';
import { useMonth } from '@/context/MonthContext.jsx';
import { formatChartDay, formatMoneyPlain } from '@/utils/format.js';
import { mapTransactionForRow } from '@/utils/transactions.js';

export default function DashboardPage() {
  const { month } = useMonth();
  const { refreshKey } = useOutletContext() ?? {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchDashboard(month)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Не удалось загрузить данные');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, refreshKey]);

  const balanceTrend = useMemo(
    () =>
      (data?.balanceTrend ?? []).map((point) => ({
        ...point,
        day: formatChartDay(point.day),
      })),
    [data?.balanceTrend],
  );

  const expenseByCategory = data?.expenseByCategory ?? [];
  const transactions = useMemo(
    () => (data?.recentTransactions ?? []).map(mapTransactionForRow),
    [data?.recentTransactions],
  );
  const kpi = data?.kpi ?? { balance: 0, income: 0, expense: 0, net: 0 };
  const totalExpenses = expenseByCategory.reduce((s, c) => s + (c.value ?? 0), 0);

  if (loading) {
    return (
      <main className="page">
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <p style={{ color: 'var(--expense)' }}>{error}</p>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="grid-kpi">
        <article className="card kpi-card">
          <div>
            <p className="kpi-card__label">Баланс</p>
            <p className="kpi-card__value">{formatMoneyPlain(kpi.balance)}</p>
            <p className="kpi-card__trend" style={{ color: 'var(--text-secondary)' }}>
              На всех счетах
            </p>
          </div>
          <div className="kpi-card__icon" style={{ background: 'var(--color-primary-muted)' }}>
            <Wallet size={22} color="var(--color-primary)" />
          </div>
        </article>
        <article className="card kpi-card">
          <div>
            <p className="kpi-card__label">Доходы за месяц</p>
            <p className="kpi-card__value kpi-card__value--income">
              {formatMoneyPlain(kpi.income)}
            </p>
            <p className="kpi-card__trend kpi-card__trend--up">
              Сальдо: {formatMoneyPlain(kpi.net)}
            </p>
          </div>
          <div className="kpi-card__icon" style={{ background: 'var(--income-bg)' }}>
            <ArrowUpRight size={22} color="var(--income)" />
          </div>
        </article>
        <article className="card kpi-card">
          <div>
            <p className="kpi-card__label">Расходы за месяц</p>
            <p className="kpi-card__value kpi-card__value--expense">
              {formatMoneyPlain(kpi.expense)}
            </p>
            <p className="kpi-card__trend" style={{ color: 'var(--text-secondary)' }}>
              За выбранный период
            </p>
          </div>
          <div className="kpi-card__icon" style={{ background: 'var(--expense-bg)' }}>
            <ArrowDownRight size={22} color="var(--expense)" />
          </div>
        </article>
      </section>

      <section className="grid-2-1">
        <article className="card">
          <h2 className="chart-card__title">Динамика за месяц</h2>
          <p className="chart-card__subtitle">Баланс по дням</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={balanceTrend}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                formatter={(v) => [formatMoneyPlain(v), 'Баланс']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB' }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#balanceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </article>
        <article className="card">
          <h2 className="chart-card__title">Бюджет по категориям</h2>
          <p className="chart-card__subtitle">Структура расходов</p>
          {expenseByCategory.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', marginTop: 24 }}>Нет расходов за период</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {expenseByCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoneyPlain(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8 }}>
                {expenseByCategory.slice(0, 6).map((c) => (
                  <div key={c.name} className="legend-item legend-item--stacked">
                    <div className="legend-item__row">
                      <span className="legend-item__dot" style={{ background: c.color }} />
                      <span>
                        {c.name} — {formatMoneyPlain(c.value)}
                        {c.limit != null && (
                          <span style={{ color: c.limitPercent > 100 ? 'var(--expense)' : 'var(--text-secondary)' }}>
                            {' '}/ лимит {formatMoneyPlain(c.limit)}
                            {c.limitPercent != null ? ` (${c.limitPercent}%)` : ''}
                          </span>
                        )}
                      </span>
                    </div>
                    {c.limitPercent != null && (
                      <div className="progress-bar progress-bar--sm">
                        <div
                          className="progress-bar__fill"
                          style={{
                            width: `${Math.min(c.limitPercent, 100)}%`,
                            background: c.limitPercent > 100 ? 'var(--expense)' : 'var(--color-primary)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </section>

      <section>
        <div className="section-header">
          <h2>Последние операции</h2>
          <Link to="/transactions" className="link-more">
            Все транзакции →
          </Link>
        </div>
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Операций пока нет</p>
          ) : (
            transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </div>
      </section>
    </main>
  );
}
