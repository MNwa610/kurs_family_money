import {
  balanceTrendByDay,
  expensesByCategory,
  incomeVsExpenseByWeek,
  sumExpenses,
  sumIncomes,
} from '../lib/aggregations.js';
import { parseDateRange } from '../utils/dates.js';

export async function getSummary(req, res) {
  const userId = req.user.id;
  let from;
  let to;
  let month;
  try {
    const range = parseDateRange(req.query);
    from = range.from;
    to = range.to;
    month = range.label;
  } catch {
    return res.status(400).json({ message: 'Некорректный период (month=YYYY-MM или from/to)' });
  }

  const [income, expense, byCategory, trend, weekly] = await Promise.all([
    sumIncomes(userId, from, to),
    sumExpenses(userId, from, to),
    expensesByCategory(userId, from, to),
    balanceTrendByDay(userId, from, to),
    incomeVsExpenseByWeek(userId, from, to),
  ]);

  const totalExpense = byCategory.reduce((s, c) => s + c.amount, 0);
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#64748B'];

  res.json({
    month,
    kpi: {
      income,
      expense,
      net: Math.round((income - expense) * 100) / 100,
      avgDailyExpense: Math.round((expense / Math.max(1, daysInRange(from, to))) * 100) / 100,
    },
    expenseByCategory: byCategory.map((c, i) => ({
      ...c,
      color: colors[i % colors.length],
      percent: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
    })),
    balanceTrend: trend,
    incomeVsExpense: weekly,
    topCategories: byCategory.slice(0, 5).map((c) => ({
      name: c.name,
      amount: c.amount,
      percent: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
    })),
  });
}

function daysInRange(from, to) {
  return Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
}

export async function exportSummary(req, res) {
  const userId = req.user.id;
  let from;
  let to;
  try {
    ({ from, to } = parseDateRange(req.query));
  } catch {
    return res.status(400).json({ message: 'Некорректный период' });
  }

  const byCategory = await expensesByCategory(userId, from, to);
  const income = await sumIncomes(userId, from, to);
  const expense = await sumExpenses(userId, from, to);

  const lines = [
    'Отчёт «Семейный бюджет»',
    `Период;${from.toISOString().slice(0, 10)} — ${to.toISOString().slice(0, 10)}`,
    '',
    'Показатель;Сумма (RUB)',
    `Доходы;${income}`,
    `Расходы;${expense}`,
    `Сальдо;${income - expense}`,
    '',
    'Категория;Сумма расходов',
    ...byCategory.map((c) => `${c.name};${c.amount}`),
  ];

  const bom = '\uFEFF';
  const csv = bom + lines.join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="report-${from.toISOString().slice(0, 10)}.csv"`,
  );
  res.send(csv);
}
