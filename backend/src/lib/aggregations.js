import { prisma } from './prisma.js';
import { decimalToJson } from '../utils/decimal.js';

export async function getTotalBalance(userId) {
  const agg = await prisma.account.aggregate({
    where: { userId },
    _sum: { balance: true },
  });
  return decimalToJson(agg._sum.balance ?? 0);
}

export async function sumIncomes(userId, from, to) {
  const agg = await prisma.income.aggregate({
    where: {
      occurredAt: { gte: from, lte: to },
      familyMember: { userId },
    },
    _sum: { amount: true },
  });
  return decimalToJson(agg._sum.amount ?? 0);
}

export async function sumExpenses(userId, from, to) {
  const agg = await prisma.expense.aggregate({
    where: {
      occurredAt: { gte: from, lte: to },
      familyMember: { userId },
    },
    _sum: { amount: true },
  });
  return decimalToJson(agg._sum.amount ?? 0);
}

export async function expensesByCategory(userId, from, to) {
  const rows = await prisma.expense.groupBy({
    by: ['expenseCategoryId'],
    where: {
      occurredAt: { gte: from, lte: to },
      familyMember: { userId },
    },
    _sum: { amount: true },
  });
  if (rows.length === 0) return [];

  const categories = await prisma.expenseCategory.findMany({
    where: { userId, id: { in: rows.map((r) => r.expenseCategoryId) } },
    select: { id: true, name: true },
  });
  const nameById = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return rows
    .map((r) => ({
      categoryId: r.expenseCategoryId,
      name: nameById[r.expenseCategoryId] ?? 'Без категории',
      amount: decimalToJson(r._sum.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export async function balanceTrendByDay(userId, from, to) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { balance: true },
  });
  const currentBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({
      where: {
        occurredAt: { gte: from, lte: to },
        familyMember: { userId },
      },
      select: { amount: true, occurredAt: true },
      orderBy: { occurredAt: 'asc' },
    }),
    prisma.expense.findMany({
      where: {
        occurredAt: { gte: from, lte: to },
        familyMember: { userId },
      },
      select: { amount: true, occurredAt: true },
      orderBy: { occurredAt: 'asc' },
    }),
  ]);

  const dayMap = new Map();
  const add = (date, delta) => {
    const key = date.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + delta);
  };
  for (const i of incomes) add(i.occurredAt, Number(i.amount));
  for (const e of expenses) add(e.occurredAt, -Number(e.amount));

  const keys = [...dayMap.keys()].sort();
  if (keys.length === 0) {
    return [{ day: from.toISOString().slice(0, 10), balance: currentBalance }];
  }

  const netInPeriod = keys.reduce((s, k) => s + dayMap.get(k), 0);
  let running = currentBalance - netInPeriod;

  return keys.map((day) => {
    running += dayMap.get(day);
    return { day, balance: Math.round(running * 100) / 100 };
  });
}

export async function incomeVsExpenseByWeek(userId, from, to) {
  const incomes = await prisma.income.findMany({
    where: { occurredAt: { gte: from, lte: to }, familyMember: { userId } },
    select: { amount: true, occurredAt: true },
  });
  const expenses = await prisma.expense.findMany({
    where: { occurredAt: { gte: from, lte: to }, familyMember: { userId } },
    select: { amount: true, occurredAt: true },
  });

  const buckets = new Map();
  const weekKey = (d) => {
    const date = new Date(d);
    const day = date.getUTCDate();
    const week = Math.ceil(day / 7);
    return `Нед ${Math.min(week, 4)}`;
  };

  for (const i of incomes) {
    const k = weekKey(i.occurredAt);
    const b = buckets.get(k) ?? { period: k, income: 0, expense: 0 };
    b.income += Number(i.amount);
    buckets.set(k, b);
  }
  for (const e of expenses) {
    const k = weekKey(e.occurredAt);
    const b = buckets.get(k) ?? { period: k, income: 0, expense: 0 };
    b.expense += Number(e.amount);
    buckets.set(k, b);
  }

  return [...buckets.values()].sort((a, b) => a.period.localeCompare(b.period));
}
