import { prisma } from '../lib/prisma.js';
import {
  assertAccountOptional,
  getFamilyMemberForUser,
  getIncomeForUser,
  getIncomeTypeForUser,
} from '../lib/ownership.js';
import { expenseInclude, incomeInclude, serializeIncome } from '../lib/serializers.js';
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
  if (req.query.familyMemberId) {
    where.familyMemberId = req.query.familyMemberId;
  }

  const rows = await prisma.income.findMany({
    where,
    include: incomeInclude,
    orderBy: { occurredAt: 'desc' },
  });
  res.json({ data: rows.map(serializeIncome) });
}

export async function create(req, res) {
  const userId = req.user.id;
  const amount = parseAmount(req.body?.amount);
  const familyMemberId = requireId(req.body?.familyMemberId, 'familyMemberId');
  const incomeTypeId = requireId(req.body?.incomeTypeId, 'incomeTypeId');
  const accountId = req.body?.accountId ?? null;
  const description = optionalString(req.body?.description);
  const occurredAt = parseOccurredAt(req.body?.occurredAt);

  await getFamilyMemberForUser(userId, familyMemberId);
  await getIncomeTypeForUser(userId, incomeTypeId);
  await assertAccountOptional(userId, accountId);

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.income.create({
      data: {
        amount,
        familyMemberId,
        incomeTypeId,
        accountId,
        description,
        occurredAt,
      },
      include: incomeInclude,
    });
    if (accountId) {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: amount } },
      });
    }
    return created;
  });

  res.status(201).json(serializeIncome(row));
}

export async function update(req, res) {
  const userId = req.user.id;
  const existing = await getIncomeForUser(userId, req.params.id);

  const amount = req.body?.amount != null ? parseAmount(req.body.amount) : existing.amount;
  const familyMemberId = req.body?.familyMemberId ?? existing.familyMemberId;
  const incomeTypeId = req.body?.incomeTypeId ?? existing.incomeTypeId;
  const accountId = req.body?.accountId !== undefined ? req.body.accountId : existing.accountId;
  const description = req.body?.description !== undefined
    ? optionalString(req.body.description)
    : existing.description;
  const occurredAt = req.body?.occurredAt != null
    ? parseOccurredAt(req.body.occurredAt)
    : existing.occurredAt;

  await getFamilyMemberForUser(userId, familyMemberId);
  await getIncomeTypeForUser(userId, incomeTypeId);
  await assertAccountOptional(userId, accountId);

  const row = await prisma.$transaction(async (tx) => {
    if (existing.accountId) {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { decrement: existing.amount } },
      });
    }
    const updated = await tx.income.update({
      where: { id: existing.id },
      data: {
        amount,
        familyMemberId,
        incomeTypeId,
        accountId,
        description,
        occurredAt,
      },
      include: incomeInclude,
    });
    if (accountId) {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: amount } },
      });
    }
    return updated;
  });

  res.json(serializeIncome(row));
}

export async function remove(req, res) {
  const existing = await getIncomeForUser(req.user.id, req.params.id);

  await prisma.$transaction(async (tx) => {
    if (existing.accountId) {
      await tx.account.update({
        where: { id: existing.accountId },
        data: { balance: { decrement: existing.amount } },
      });
    }
    await tx.income.delete({ where: { id: existing.id } });
  });

  res.status(204).send();
}
