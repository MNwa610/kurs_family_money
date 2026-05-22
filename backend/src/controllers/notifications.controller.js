import { prisma } from '../lib/prisma.js';
import { getHouseholdContext } from '../lib/household.js';
import {
  expenseInclude,
  incomeInclude,
  serializeExpense,
  serializeIncome,
} from '../lib/serializers.js';
import { HttpError } from '../utils/errors.js';

export async function list(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { email: true },
  });
  const email = user.email.toLowerCase();

  const incomingInvites = await prisma.householdInvite.findMany({
    where: {
      email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      household: { select: { id: true, name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  let outgoingInvites = [];
  let memberActivity = [];

  try {
    const ctx = await getHouseholdContext(req.user.id);

    if (ctx.role === 'owner') {
      outgoingInvites = await prisma.householdInvite.findMany({
        where: {
          householdId: ctx.householdId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    const selfMember = await prisma.familyMember.findFirst({
      where: { householdId: ctx.householdId, relation: 'self' },
      select: { id: true },
    });

    const since = new Date();
    since.setDate(since.getDate() - 14);

    const memberFilter = selfMember
      ? { familyMemberId: { not: selfMember.id } }
      : {};

    const baseWhere = {
      occurredAt: { gte: since },
      familyMember: { householdId: ctx.householdId },
      ...memberFilter,
    };

    const [incomes, expenses] = await Promise.all([
      prisma.income.findMany({
        where: baseWhere,
        include: incomeInclude,
        orderBy: { occurredAt: 'desc' },
        take: 10,
      }),
      prisma.expense.findMany({
        where: baseWhere,
        include: expenseInclude,
        orderBy: { occurredAt: 'desc' },
        take: 10,
      }),
    ]);

    memberActivity = [...incomes.map(serializeIncome), ...expenses.map(serializeExpense)]
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
      .slice(0, 12)
      .map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        occurredAt: tx.occurredAt,
        description: tx.description,
        familyMemberName: tx.familyMember?.name,
        categoryName: tx.incomeType?.name ?? tx.expenseCategory?.name,
      }));
  } catch {
    // пользователь без семьи — только входящие приглашения
  }

  const payload = {
    incomingInvites: incomingInvites.map((inv) => ({
      id: inv.id,
      token: inv.token,
      email: inv.email,
      householdId: inv.household.id,
      householdName: inv.household.name,
      invitedByName: inv.invitedBy.name ?? inv.invitedBy.email,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    })),
    outgoingInvites: outgoingInvites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
    })),
    memberActivity,
  };

  payload.unreadCount =
    payload.incomingInvites.length
    + payload.outgoingInvites.length
    + payload.memberActivity.length;

  res.json(payload);
}

export async function declineInvite(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { email: true },
  });
  const invite = await prisma.householdInvite.findUnique({ where: { id: req.params.id } });
  if (!invite || invite.acceptedAt) {
    throw new HttpError(404, 'Приглашение не найдено');
  }
  if (invite.email !== user.email.toLowerCase()) {
    throw new HttpError(403, 'Это приглашение не для вас');
  }
  await prisma.householdInvite.delete({ where: { id: invite.id } });
  res.status(204).send();
}
