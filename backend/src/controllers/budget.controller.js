import { prisma } from '../lib/prisma.js';
import { getExpenseCategoryForHousehold } from '../lib/ownership.js';
import { decimalToJson } from '../utils/decimal.js';
import { parseAmount } from '../utils/decimal.js';
import { HttpError } from '../utils/errors.js';

export async function list(req, res) {
  const month = req.query.month;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new HttpError(400, 'Укажите month=YYYY-MM');
  }
  const rows = await prisma.categoryBudget.findMany({
    where: { householdId: req.householdId, month },
    include: { expenseCategory: { select: { id: true, name: true } } },
    orderBy: { expenseCategory: { name: 'asc' } },
  });
  res.json({
    data: rows.map((r) => ({
      id: r.id,
      month: r.month,
      categoryId: r.expenseCategoryId,
      categoryName: r.expenseCategory.name,
      limit: decimalToJson(r.limitAmount),
    })),
  });
}

export async function upsert(req, res) {
  const month = req.body?.month;
  const expenseCategoryId = req.body?.expenseCategoryId;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw new HttpError(400, 'month в формате YYYY-MM обязателен');
  }
  if (!expenseCategoryId) throw new HttpError(400, 'expenseCategoryId обязателен');

  await getExpenseCategoryForHousehold(req.householdId, expenseCategoryId);
  const limitAmount = parseAmount(req.body?.limit);

  const row = await prisma.categoryBudget.upsert({
    where: {
      householdId_expenseCategoryId_month: {
        householdId: req.householdId,
        expenseCategoryId,
        month,
      },
    },
    create: {
      householdId: req.householdId,
      expenseCategoryId,
      month,
      limitAmount,
    },
    update: { limitAmount },
    include: { expenseCategory: { select: { name: true } } },
  });

  res.json({
    id: row.id,
    month: row.month,
    categoryId: row.expenseCategoryId,
    categoryName: row.expenseCategory.name,
    limit: decimalToJson(row.limitAmount),
  });
}

export async function remove(req, res) {
  const row = await prisma.categoryBudget.findFirst({
    where: { id: req.params.id, householdId: req.householdId },
  });
  if (!row) throw new HttpError(404, 'Лимит не найден');
  await prisma.categoryBudget.delete({ where: { id: row.id } });
  res.status(204).send();
}
