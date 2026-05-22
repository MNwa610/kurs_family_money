import crypto from 'node:crypto';

import { prisma } from './prisma.js';
import { HttpError } from '../utils/errors.js';

export async function getHouseholdContext(userId) {
  const membership = await prisma.householdMember.findUnique({
    where: { userId },
    include: { household: { select: { id: true, name: true } } },
  });
  if (!membership) {
    throw new HttpError(403, 'Пользователь не привязан к семье');
  }
  return {
    householdId: membership.householdId,
    role: membership.role,
    householdName: membership.household.name,
  };
}

export async function createHouseholdForUser(tx, userId, displayName, householdName) {
  const name =
    householdName?.trim()
    || (displayName ? `Семья ${displayName}` : 'Моя семья');
  const household = await tx.household.create({
    data: { name },
  });
  await tx.householdMember.create({
    data: { householdId: household.id, userId, role: 'owner' },
  });
  return household;
}

export function createInviteToken() {
  return crypto.randomBytes(24).toString('hex');
}

/** Покидает текущую семью; личную «пустую» семью удаляет целиком. */
export async function leaveCurrentHousehold(tx, userId) {
  const membership = await tx.householdMember.findUnique({
    where: { userId },
    select: { householdId: true, role: true },
  });
  if (!membership) return null;

  const membersCount = await tx.householdMember.count({
    where: { householdId: membership.householdId },
  });

  await tx.householdMember.delete({ where: { userId } });

  if (membersCount === 1) {
    await tx.household.delete({ where: { id: membership.householdId } });
    return { leftHouseholdId: membership.householdId, deletedHousehold: true };
  }

  if (membership.role === 'owner') {
    throw new HttpError(409, 'Сначала передайте роль владельца другому участнику');
  }

  return { leftHouseholdId: membership.householdId, deletedHousehold: false };
}

export const familyMemberWhere = (householdId) => ({ householdId });

export const householdResourceWhere = (householdId) => ({ householdId });

export const transactionMemberWhere = (householdId) => ({
  familyMember: { householdId },
});
