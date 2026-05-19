import {
  balanceTrendByDay,
  expensesByCategory,
  getTotalBalance,
  sumExpenses,
  sumIncomes,
} from '../lib/aggregations.js';
import { prisma } from '../lib/prisma.js';
import { expenseInclude, incomeInclude, serializeExpense, serializeIncome } from '../lib/serializers.js';
import { parseDateRange } from '../utils/dates.js';

export async function getDashboard(req, res) {
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
    return res.status(400).json({ message: 'Некорректный период (month=YYYY-MM)' });
  }

  const [balance, income, expense, byCategory, trend, recentIncomes, recentExpenses] =
    await Promise.all([
      getTotalBalance(userId),
      sumIncomes(userId, from, to),
      sumExpenses(userId, from, to),
      expensesByCategory(userId, from, to),
      balanceTrendByDay(userId, from, to),
      prisma.income.findMany({
        where: { occurredAt: { gte: from, lte: to }, familyMember: { userId } },
        include: incomeInclude,
        orderBy: { occurredAt: 'desc' },
        take: 5,
      }),
      prisma.expense.findMany({
        where: { occurredAt: { gte: from, lte: to }, familyMember: { userId } },
        include: expenseInclude,
        orderBy: { occurredAt: 'desc' },
        take: 5,
      }),
    ]);

  const recent = [
    ...recentIncomes.map(serializeIncome),
    ...recentExpenses.map(serializeExpense),
  ]
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 7);

  const totalExpense = byCategory.reduce((s, c) => s + c.amount, 0);
  const expenseChart = byCategory.map((c, i) => ({
    name: c.name,
    value: c.amount,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#64748B'][i % 7],
    percent: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
  }));

  res.json({
    month,
    kpi: {
      balance,
      income,
      expense,
      net: Math.round((income - expense) * 100) / 100,
    },
    balanceTrend: trend,
    expenseByCategory: expenseChart,
    recentTransactions: recent,
  });
}
