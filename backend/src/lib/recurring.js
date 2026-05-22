import { Decimal } from '@prisma/client/runtime/library.js';

import { prisma } from './prisma.js';
import { HttpError } from '../utils/errors.js';
import { parseAmount } from '../utils/decimal.js';

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function addWeeks(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

export function computeNextRunAt(frequency, dayOfMonth, dayOfWeek, from = new Date()) {
  const base = new Date(from);
  if (frequency === 'weekly') {
    const target = dayOfWeek ?? base.getDay();
    const next = new Date(base);
    const diff = (target - next.getDay() + 7) % 7 || 7;
    next.setDate(next.getDate() + diff);
    next.setHours(12, 0, 0, 0);
    return next;
  }
  const dom = Math.min(Math.max(dayOfMonth ?? base.getDate(), 1), 28);
  const next = new Date(base.getFullYear(), base.getMonth(), dom, 12, 0, 0, 0);
  if (next <= base) return addMonths(next, 1);
  return next;
}

export async function processDueRecurringPayments(householdId) {
  const now = new Date();
  const due = await prisma.recurringPayment.findMany({
    where: {
      householdId,
      isActive: true,
      nextRunAt: { lte: now },
    },
  });

  const created = [];

  for (const item of due) {
    await prisma.$transaction(async (tx) => {
      if (item.type === 'income') {
        await tx.income.create({
          data: {
            amount: item.amount,
            familyMemberId: item.familyMemberId,
            incomeTypeId: item.incomeTypeId,
            accountId: item.accountId,
            description: item.description ?? 'Повторяющийся доход',
            occurredAt: item.nextRunAt,
          },
        });
        if (item.accountId) {
          await tx.account.update({
            where: { id: item.accountId },
            data: { balance: { increment: item.amount } },
          });
        }
      } else {
        if (item.accountId) {
          const account = await tx.account.findUnique({ where: { id: item.accountId } });
          const balance = account.balance instanceof Decimal ? account.balance : new Decimal(account.balance);
          if (balance.lessThan(item.amount)) {
            throw new HttpError(400, `Недостаточно средств для «${item.description ?? 'платёж'}»`);
          }
        }
        await tx.expense.create({
          data: {
            amount: item.amount,
            familyMemberId: item.familyMemberId,
            expenseCategoryId: item.expenseCategoryId,
            accountId: item.accountId,
            description: item.description ?? 'Повторяющийся расход',
            occurredAt: item.nextRunAt,
          },
        });
        if (item.accountId) {
          await tx.account.update({
            where: { id: item.accountId },
            data: { balance: { decrement: item.amount } },
          });
        }
      }

      const nextRunAt = item.frequency === 'weekly'
        ? addWeeks(item.nextRunAt, 1)
        : addMonths(item.nextRunAt, 1);

      await tx.recurringPayment.update({
        where: { id: item.id },
        data: { nextRunAt },
      });
    });
    created.push(item.id);
  }

  return { processed: created.length, ids: created };
}

export function serializeRecurring(row) {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    familyMemberId: row.familyMemberId,
    expenseCategoryId: row.expenseCategoryId,
    incomeTypeId: row.incomeTypeId,
    accountId: row.accountId,
    frequency: row.frequency,
    dayOfMonth: row.dayOfMonth,
    dayOfWeek: row.dayOfWeek,
    nextRunAt: row.nextRunAt,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function validateRecurringBody(body, type) {
  const amount = parseAmount(body?.amount);
  const familyMemberId = body?.familyMemberId;
  if (!familyMemberId) throw new HttpError(400, 'familyMemberId обязателен');
  const frequency = body?.frequency === 'weekly' ? 'weekly' : 'monthly';
  if (type === 'expense' && !body?.expenseCategoryId) {
    throw new HttpError(400, 'expenseCategoryId обязателен для расхода');
  }
  if (type === 'income' && !body?.incomeTypeId) {
    throw new HttpError(400, 'incomeTypeId обязателен для дохода');
  }
  return {
    amount,
    familyMemberId,
    frequency,
    dayOfMonth: body?.dayOfMonth != null ? Number(body.dayOfMonth) : null,
    dayOfWeek: body?.dayOfWeek != null ? Number(body.dayOfWeek) : null,
    expenseCategoryId: body?.expenseCategoryId ?? null,
    incomeTypeId: body?.incomeTypeId ?? null,
    accountId: body?.accountId ?? null,
    description: body?.description ?? null,
    isActive: body?.isActive !== false,
  };
}
