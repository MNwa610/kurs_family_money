import { prisma } from '../lib/prisma.js';
import {
  getExpenseCategoryForUser,
  getIncomeTypeForUser,
} from '../lib/ownership.js';
import { optionalString, requireString } from '../utils/validation.js';

export async function listIncomeTypes(req, res) {
  const data = await prisma.incomeType.findMany({
    where: { userId: req.user.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, createdAt: true },
  });
  res.json({ data });
}

export async function createIncomeType(req, res) {
  const name = requireString(req.body?.name, 'name');
  const row = await prisma.incomeType.create({
    data: { userId: req.user.id, name },
    select: { id: true, name: true, createdAt: true },
  });
  res.status(201).json(row);
}

export async function removeIncomeType(req, res) {
  await getIncomeTypeForUser(req.user.id, req.params.id);
  const count = await prisma.income.count({ where: { incomeTypeId: req.params.id } });
  if (count > 0) {
    return res.status(409).json({ message: 'Тип дохода используется в операциях' });
  }
  await prisma.incomeType.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function listExpenseCategories(req, res) {
  const data = await prisma.expenseCategory.findMany({
    where: { userId: req.user.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, createdAt: true },
  });
  res.json({ data });
}

export async function createExpenseCategory(req, res) {
  const name = requireString(req.body?.name, 'name');
  const row = await prisma.expenseCategory.create({
    data: { userId: req.user.id, name },
    select: { id: true, name: true, createdAt: true },
  });
  res.status(201).json(row);
}

export async function removeExpenseCategory(req, res) {
  await getExpenseCategoryForUser(req.user.id, req.params.id);
  const count = await prisma.expense.count({ where: { expenseCategoryId: req.params.id } });
  if (count > 0) {
    return res.status(409).json({ message: 'Категория используется в операциях' });
  }
  await prisma.expenseCategory.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
