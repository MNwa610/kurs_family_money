import { prisma } from '../lib/prisma.js';
import { createHouseholdForUser, createInviteToken, leaveCurrentHousehold } from '../lib/household.js';
import { seedUserDefaults } from '../lib/defaults.js';
import { processDueRecurringPayments } from '../lib/recurring.js';
import { HttpError } from '../utils/errors.js';
import { optionalString, requireString } from '../utils/validation.js';

export async function setupCreateHousehold(req, res) {
  const existing = await prisma.householdMember.findUnique({
    where: { userId: req.user.id },
  });
  if (existing) {
    return res.status(409).json({ message: 'Вы уже состоите в семье' });
  }

  const customName = optionalString(req.body?.name);
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { name: true, email: true },
  });
  const displayName = user.name?.trim() || user.email.split('@')[0];

  const household = await prisma.$transaction(async (tx) => {
    const created = await createHouseholdForUser(
      tx,
      req.user.id,
      displayName,
      customName,
    );
    await seedUserDefaults(tx, created.id, displayName);
    return created;
  });

  res.status(201).json({
    id: household.id,
    name: household.name,
    role: 'owner',
    hasHousehold: true,
    message: 'Семья создана',
  });
}

export async function getHousehold(req, res) {
  const household = await prisma.household.findUnique({
    where: { id: req.householdId },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      },
      invites: {
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true, email: true, expiresAt: true, createdAt: true },
      },
    },
  });

  res.json({
    id: household.id,
    name: household.name,
    role: req.householdRole,
    members: household.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      email: m.user.email,
      name: m.user.name,
    })),
    pendingInvites: household.invites,
  });
}

export async function updateHousehold(req, res) {
  if (req.householdRole !== 'owner') {
    return res.status(403).json({ message: 'Только владелец может переименовать семью' });
  }
  const name = requireString(req.body?.name, 'name');
  const household = await prisma.household.update({
    where: { id: req.householdId },
    data: { name },
  });
  res.json({ id: household.id, name: household.name });
}

export async function createInvite(req, res) {
  if (req.householdRole !== 'owner') {
    return res.status(403).json({ message: 'Только владелец может приглашать' });
  }
  const email = requireString(req.body?.email, 'email').trim().toLowerCase();

  const inviter = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { email: true },
  });
  if (inviter.email.toLowerCase() === email) {
    return res.status(400).json({ message: 'Нельзя пригласить себя' });
  }

  const alreadyHere = await prisma.householdMember.findFirst({
    where: {
      householdId: req.householdId,
      user: { email },
    },
  });
  if (alreadyHere) {
    return res.status(409).json({ message: 'Пользователь уже в этой семье' });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const existingInvite = await prisma.householdInvite.findFirst({
    where: {
      householdId: req.householdId,
      email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvite) {
    return res.status(200).json({
      id: existingInvite.id,
      email: existingInvite.email,
      token: existingInvite.token,
      expiresAt: existingInvite.expiresAt,
      message: 'Активное приглашение уже отправлено',
    });
  }

  const token = createInviteToken();
  const invite = await prisma.householdInvite.create({
    data: {
      householdId: req.householdId,
      email,
      token,
      invitedById: req.user.id,
      expiresAt,
    },
  });

  res.status(201).json({
    id: invite.id,
    email: invite.email,
    token: invite.token,
    expiresAt: invite.expiresAt,
    message: 'Приглашение создано. Пользователь увидит его в уведомлениях',
  });
}

export async function acceptInvite(req, res) {
  const token = requireString(req.body?.token, 'token');
  const invite = await prisma.householdInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt) {
    throw new HttpError(404, 'Приглашение не найдено');
  }
  if (invite.expiresAt < new Date()) {
    throw new HttpError(410, 'Срок приглашения истёк');
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new HttpError(403, 'Приглашение выдано на другой email');
  }

  const existing = await prisma.householdMember.findUnique({ where: { userId: req.user.id } });
  if (existing?.householdId === invite.householdId) {
    throw new HttpError(409, 'Вы уже в этой семье');
  }

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await leaveCurrentHousehold(tx, req.user.id);
    }

    await tx.householdMember.create({
      data: {
        householdId: invite.householdId,
        userId: req.user.id,
        role: 'member',
      },
    });

    const displayName = user.name?.trim() || user.email.split('@')[0];
    const existingProfile = await tx.familyMember.findFirst({
      where: { householdId: invite.householdId, name: displayName },
    });
    if (!existingProfile) {
      await tx.familyMember.create({
        data: {
          householdId: invite.householdId,
          name: displayName,
          relation: 'member',
        },
      });
    }
    await tx.householdInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    await tx.householdInvite.deleteMany({
      where: {
        email: user.email.toLowerCase(),
        acceptedAt: null,
        id: { not: invite.id },
      },
    });
  });

  const household = await prisma.household.findUnique({ where: { id: invite.householdId } });
  res.json({
    message: `Вы присоединились к «${household.name}»`,
    householdId: household.id,
    hasHousehold: true,
  });
}

export async function cancelInvite(req, res) {
  if (req.householdRole !== 'owner') {
    return res.status(403).json({ message: 'Только владелец может отменять приглашения' });
  }
  const invite = await prisma.householdInvite.findFirst({
    where: { id: req.params.id, householdId: req.householdId, acceptedAt: null },
  });
  if (!invite) throw new HttpError(404, 'Приглашение не найдено');
  await prisma.householdInvite.delete({ where: { id: invite.id } });
  res.status(204).send();
}

export async function removeMember(req, res) {
  if (req.householdRole !== 'owner') {
    return res.status(403).json({ message: 'Только владелец может удалять участников' });
  }
  const member = await prisma.householdMember.findFirst({
    where: { id: req.params.id, householdId: req.householdId },
  });
  if (!member) throw new HttpError(404, 'Участник не найден');
  if (member.role === 'owner') {
    return res.status(400).json({ message: 'Нельзя удалить владельца' });
  }
  await prisma.householdMember.delete({ where: { id: member.id } });
  res.status(204).send();
}

export async function processRecurring(req, res) {
  const result = await processDueRecurringPayments(req.householdId);
  res.json(result);
}
