import { Decimal } from '@prisma/client/runtime/library.js';

import { prisma } from '../lib/prisma.js';
import {
  assertAccountOptional,
  getExpenseCategoryForUser,
  getExpenseForUser,
  getFamilyMemberForUser,
} from '../lib/ownership.js';
import { HttpError } from '../utils/errors.js';
import { expenseInclude, serializeExpense } from '../lib/serializers.js';
import { parseAmount } from '../utils/decimal.js';
import { parseOccurredAt } from '../utils/dates.js';
import { optionalString, requireId } from '../utils/validation.js';

export async function list(req, res) {
  const { from, to } = req.query;
  const where = { familyMember: { userId: req.user.id } };
  if (from || to) {
    where.occurredAt = {};
    if (from) where.occurredAt.gte = new Date(from);
    if (to) {
      const t = new Date(to);
      t.setHours(23, 59, 59, 999);
      where.occurredAt.lte = t;
    }
  }
  if (req.query.familyMemberId) where.familyMemberId = req.query.familyMemberId;
  if (req.query.expenseCategoryId) where.expenseCategoryId = req.query.expenseCategoryId;

  const rows = await prisma.expense.findMany({
    where,
    include: expenseInclude,
    orderBy: { occurredAt: 'desc' },
  });
  res.json({ data: rows.map(serializeExpense) });
}

export async function create(req, res) {
  const userId = req.user.id;
  const amount = parseAmount(req.body?.amount);
  const familyMemberId = requireId(req.body?.familyMemberId, 'familyMemberId');
  const expenseCategoryId = requireId(req.body?.expenseCategoryId, 'expenseCategoryId');
  const accountId = req.body?.accountId ?? null;
  const description = optionalString(req.body?.description);
  const occurredAt = parseOccurredAt(req.body?.occurredAt);

  await getFamilyMemberForUser(userId, familyMemberId);
  await getExpenseCategoryForUser(userId, expenseCategoryId);
  const account = await assertAccountOptional(userId, accountId);
  if (account) {
    const balance = account.balance instanceof Decimal ? account.balance : new Decimal(account.balance);
    if (balance.lessThan(amount)) {
      throw new HttpError(400, 'Недостаточно средств на счёте');
    }
  }

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        amount,
        familyMemberId,
        expenseCategoryId,
        accountId,
        description,
        occurredAt,
      },
      include: expenseInclude,
    });
    if (accountId) {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });
    }
    return created;
  });

  res.status(201).json(serializeExpense(row));
}

export async function update(req, res) {
  const userId = req.user.id;
  const existing = await getExpenseForUser(userId, req.params.id);

  const amount = req.body?.amount != null ? parseAmount(req.body.amount) : existing.amount;
  const familyMemberId = req.body?.familyMemberId ?? existing.familyMemberId;
  const expenseCategoryId = req.body?.expenseCategoryId ?? existing.expenseCategoryId;
  const accountId = req.body?.accountId !== undefined ? req.body.accountId : existing.accountId;
  const description = req.body?.description !== undefined
    ? optionalString(req.body.description)
    : existing.description;
  const occurredAt = req.body?.occurredAt != null
    ? parseOccurredAt(req.body.occurredAt)
    : existing.occurredAt;

  await getFamilyMemberForUser(userId, familyMemberId);
  await getExpenseCategoryForUser(userId, expenseCategoryId);
  const account = await assertAccountOptional(userId, accountId);
  if (account) {
    let available = account.balance instanceof Decimal ? account.balance : new Decimal(account.balance);
    if (existing.accountId === accountId) {
      available = available.plus(existing.amount);
    }
    if (available.lessThan(amount)) {
      throw new HttpError(400, 'Недостаточно средств на счёте');
    }
  }

  const row = await prisma.$transaction(async (tx) => {
    if (existing.accountId) {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: existing.amount } },
      });
    }
    const updated = await tx.expense.update({
      where: { id: existing.id },
      data: {
        amount,
        familyMemberId,
        expenseCategoryId,
        accountId,
        description,
        occurredAt,
      },
      include: expenseInclude,
    });
    if (accountId) {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });
    }
    return updated;
  });

  res.json(serializeExpense(row));
}

export async function remove(req, res) {
  const existing = await getExpenseForUser(req.user.id, req.params.id);

  await prisma.$transaction(async (tx) => {
    if (existing.accountId) {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: existing.amount } },
      });
    }
    await tx.expense.delete({ where: { id: existing.id } });
  });

  res.status(204).send();
}
