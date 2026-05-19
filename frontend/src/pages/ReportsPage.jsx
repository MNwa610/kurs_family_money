import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FileSpreadsheet } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

import { exportReports, fetchReportsSummary } from '@/api/index.js';
import Button from '@/components/ui/Button.jsx';
import MonthSelect from '@/components/ui/MonthSelect.jsx';
import { useMonth } from '@/context/MonthContext.jsx';
import { formatChartDay, formatMoneyPlain } from '@/utils/format.js';

export default function ReportsPage() {
  const { month } = useMonth();
  const { refreshKey } = useOutletContext() ?? {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchReportsSummary(month)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Не удалось загрузить отчёт');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, refreshKey]);

  const kpi = data?.kpi ?? { income: 0, expense: 0, net: 0, avgDailyExpense: 0 };
  const expenseByCategory = useMemo(
    () =>
      (data?.expenseByCategory ?? []).map((c) => ({
        name: c.name,
        value: c.amount ?? c.value ?? 0,
        color: c.color,
        percent: c.percent,
      })),
    [data?.expenseByCategory],
  );
  const balanceTrend = useMemo(
    () =>
      (data?.balanceTrend ?? []).map((point) => ({
        ...point,
        day: formatChartDay(point.day),
      })),
    [data?.balanceTrend],
  );
  const incomeVsExpense = data?.incomeVsExpense ?? [];
  const topCategories = data?.topCategories ?? [];

  const handleExport = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await exportReports(month);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message ?? 'Ошибка экспорта');
    } finally {
      setExporting(false);
    }
  };

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
      <div className="reports-toolbar">
        <MonthSelect style={{ width: 180 }} />
        <Button variant="secondary" onClick={handleExport} disabled={exporting}>
          <FileSpreadsheet size={18} />
          {exporting ? 'Экспорт…' : 'Экспорт в Excel'}
        </Button>
      </div>

      <section className="grid-kpi grid-kpi--4">
        <article className="card">
          <p className="kpi-card__label">Доходы</p>
          <p className="kpi-card__value kpi-card__value--income">{formatMoneyPlain(kpi.income)}</p>
        </article>
        <article className="card">
          <p className="kpi-card__label">Расходы</p>
          <p className="kpi-card__value kpi-card__value--expense">{formatMoneyPlain(kpi.expense)}</p>
        </article>
        <article className="card">
          <p className="kpi-card__label">Сальдо</p>
          <p className="kpi-card__value">{formatMoneyPlain(kpi.net)}</p>
        </article>
        <article className="card">
          <p className="kpi-card__label">Средний расход в день</p>
          <p className="kpi-card__value" style={{ fontSize: 24 }}>
            {formatMoneyPlain(kpi.avgDailyExpense)}
          </p>
        </article>
      </section>

      <section className="grid-2">
        <article className="card">
          <h2 className="chart-card__title">Структура расходов</h2>
          <p className="chart-card__subtitle">По категориям за период</p>
          {expenseByCategory.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', marginTop: 24 }}>Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {expenseByCategory.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatMoneyPlain(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="card">
          <h2 className="chart-card__title">Динамика баланса</h2>
          <p className="chart-card__subtitle">Баланс по дням</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={balanceTrend}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v) => [formatMoneyPlain(v), 'Баланс']} />
              <Line type="monotone" dataKey="balance" stroke="#2563EB" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="grid-2">
        <article className="card">
          <h2 className="chart-card__title">Доходы vs расходы</h2>
          <p className="chart-card__subtitle">По неделям</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={incomeVsExpense}>
              <CartesianGrid stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v) => formatMoneyPlain(v)} />
              <Legend />
              <Bar dataKey="income" name="Доходы" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Расходы" fill="#DC2626" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="card">
          <h2 className="chart-card__title">Топ категорий расходов</h2>
          <p className="chart-card__subtitle">За период</p>
          <div style={{ marginTop: 16 }}>
            {topCategories.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Нет данных</p>
            ) : (
              topCategories.map((cat) => (
                <div key={cat.name} className="top-category">
                  <span className="top-category__name">{cat.name}</span>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${cat.percent}%` }} />
                  </div>
                  <span className="top-category__amount">{formatMoneyPlain(cat.amount)}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
