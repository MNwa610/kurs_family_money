import { prisma } from '../lib/prisma.js';
import {
  assertAccountOptional,
  getExpenseCategoryForHousehold,
  getFamilyMemberForHousehold,
  getIncomeTypeForHousehold,
  getRecurringForHousehold,
} from '../lib/ownership.js';
import {
  computeNextRunAt,
  serializeRecurring,
  validateRecurringBody,
} from '../lib/recurring.js';
import { parseOccurredAt } from '../utils/dates.js';
import { HttpError } from '../utils/errors.js';

export async function list(req, res) {
  const rows = await prisma.recurringPayment.findMany({
    where: { householdId: req.householdId },
    orderBy: { nextRunAt: 'asc' },
  });
  res.json({ data: rows.map(serializeRecurring) });
}

export async function create(req, res) {
  const type = req.body?.type === 'income' ? 'income' : 'expense';
  const data = validateRecurringBody(req.body, type);

  await getFamilyMemberForHousehold(req.householdId, data.familyMemberId);
  if (type === 'expense') {
    await getExpenseCategoryForHousehold(req.householdId, data.expenseCategoryId);
  } else {
    await getIncomeTypeForHousehold(req.householdId, data.incomeTypeId);
  }
  await assertAccountOptional(req.householdId, data.accountId);

  const start = req.body?.startDate ? parseOccurredAt(req.body.startDate) : new Date();
  const nextRunAt = computeNextRunAt(
    data.frequency,
    data.dayOfMonth,
    data.dayOfWeek,
    start,
  );

  const row = await prisma.recurringPayment.create({
    data: {
      householdId: req.householdId,
      type,
      amount: data.amount,
      description: data.description,
      familyMemberId: data.familyMemberId,
      expenseCategoryId: type === 'expense' ? data.expenseCategoryId : null,
      incomeTypeId: type === 'income' ? data.incomeTypeId : null,
      accountId: data.accountId,
      frequency: data.frequency,
      dayOfMonth: data.dayOfMonth,
      dayOfWeek: data.dayOfWeek,
      nextRunAt,
      isActive: data.isActive,
    },
  });

  res.status(201).json(serializeRecurring(row));
}

export async function update(req, res) {
  const existing = await getRecurringForHousehold(req.householdId, req.params.id);
  const type = req.body?.type ?? existing.type;
  const data = validateRecurringBody({ ...serializeRecurring(existing), ...req.body }, type);

  await getFamilyMemberForHousehold(req.householdId, data.familyMemberId);
  if (type === 'expense') {
    await getExpenseCategoryForHousehold(req.householdId, data.expenseCategoryId);
  } else {
    await getIncomeTypeForHousehold(req.householdId, data.incomeTypeId);
  }
  await assertAccountOptional(req.householdId, data.accountId);

  const nextRunAt = req.body?.nextRunAt
    ? parseOccurredAt(req.body.nextRunAt)
    : computeNextRunAt(data.frequency, data.dayOfMonth, data.dayOfWeek, existing.nextRunAt);

  const row = await prisma.recurringPayment.update({
    where: { id: existing.id },
    data: {
      type,
      amount: data.amount,
      description: data.description,
      familyMemberId: data.familyMemberId,
      expenseCategoryId: type === 'expense' ? data.expenseCategoryId : null,
      incomeTypeId: type === 'income' ? data.incomeTypeId : null,
      accountId: data.accountId,
      frequency: data.frequency,
      dayOfMonth: data.dayOfMonth,
      dayOfWeek: data.dayOfWeek,
      nextRunAt,
      isActive: req.body?.isActive !== undefined ? Boolean(req.body.isActive) : existing.isActive,
    },
  });

  res.json(serializeRecurring(row));
}

export async function remove(req, res) {
  await getRecurringForHousehold(req.householdId, req.params.id);
  await prisma.recurringPayment.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
