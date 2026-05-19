import { prisma } from './prisma.js';

export async function getFamilyMemberForUser(userId, familyMemberId) {
  const member = await prisma.familyMember.findFirst({
    where: { id: familyMemberId, userId },
  });
  if (!member) {
    const err = new Error('NOT_FOUND');
    throw err;
  }
  return member;
}

export async function getAccountForUser(userId, accountId) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId },
  });
  if (!account) {
    const err = new Error('NOT_FOUND');
    throw err;
  }
  return account;
}

export async function getIncomeTypeForUser(userId, incomeTypeId) {
  const row = await prisma.incomeType.findFirst({
    where: { id: incomeTypeId, userId },
  });
  if (!row) {
    const err = new Error('NOT_FOUND');
    throw err;
  }
  return row;
}

export async function getExpenseCategoryForUser(userId, expenseCategoryId) {
  const row = await prisma.expenseCategory.findFirst({
    where: { id: expenseCategoryId, userId },
  });
  if (!row) {
    const err = new Error('NOT_FOUND');
    throw err;
  }
  return row;
}

export async function getIncomeForUser(userId, incomeId) {
  const row = await prisma.income.findFirst({
    where: {
      id: incomeId,
      familyMember: { userId },
    },
    include: { familyMember: true },
  });
  if (!row) {
    const err = new Error('NOT_FOUND');
    throw err;
  }
  return row;
}

export async function getExpenseForUser(userId, expenseId) {
  const row = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      familyMember: { userId },
    },
    include: { familyMember: true },
  });
  if (!row) {
    const err = new Error('NOT_FOUND');
    throw err;
  }
  return row;
}

export async function assertAccountOptional(userId, accountId) {
  if (!accountId) return null;
  return getAccountForUser(userId, accountId);
}
