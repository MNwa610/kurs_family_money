import { prisma } from '../lib/prisma.js';
import { expenseInclude, incomeInclude, serializeExpense, serializeIncome } from '../lib/serializers.js';
import { parseDateRange } from '../utils/dates.js';

function formatDateLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Сегодня';
  if (sameDay(d, yesterday)) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export async function list(req, res) {
  const householdId = req.householdId;
  const type = req.query.type;
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

  let from;
  let to;
  try {
    ({ from, to } = parseDateRange(req.query));
  } catch {
    from = new Date(0);
    to = new Date();
  }

  const dateFilter = { gte: from, lte: to };
  const memberFilter = req.query.familyMemberId
    ? { familyMemberId: req.query.familyMemberId }
    : {};

  const incomeWhere = {
    occurredAt: dateFilter,
    familyMember: { householdId },
    ...memberFilter,
  };
  const expenseWhere = {
    occurredAt: dateFilter,
    familyMember: { householdId },
    ...memberFilter,
  };

  if (req.query.expenseCategoryId) {
    expenseWhere.expenseCategoryId = req.query.expenseCategoryId;
  }
  if (req.query.incomeTypeId) {
    incomeWhere.incomeTypeId = req.query.incomeTypeId;
  }

  const fetchIncomes = type !== 'expense';
  const fetchExpenses = type !== 'income';

  const [incomes, expenses] = await Promise.all([
    fetchIncomes
      ? prisma.income.findMany({
        where: incomeWhere,
        include: incomeInclude,
        orderBy: { occurredAt: 'desc' },
        take: limit,
      })
      : [],
    fetchExpenses
      ? prisma.expense.findMany({
        where: expenseWhere,
        include: expenseInclude,
        orderBy: { occurredAt: 'desc' },
        take: limit,
      })
      : [],
  ]);

  let items = [
    ...incomes.map(serializeIncome),
    ...expenses.map(serializeExpense),
  ];

  if (search) {
    items = items.filter((tx) => {
      const hay = [
        tx.description,
        tx.incomeType?.name,
        tx.expenseCategory?.name,
        tx.familyMember?.name,
        tx.account?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(search);
    });
  }

  items.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
  items = items.slice(0, limit);

  const withLabels = items.map((tx) => ({
    ...tx,
    dateLabel: formatDateLabel(tx.occurredAt),
    displayAmount: tx.type === 'expense' ? -tx.amount : tx.amount,
    title: tx.incomeType?.name ?? tx.expenseCategory?.name ?? 'Операция',
    subtitle: tx.description ?? '',
    meta: [tx.familyMember?.name, tx.account?.name].filter(Boolean).join(' · '),
  }));

  res.json({ data: withLabels });
}
