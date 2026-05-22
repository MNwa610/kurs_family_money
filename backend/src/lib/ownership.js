import { prisma } from './prisma.js';
import { HttpError } from '../utils/errors.js';

function notFound() {
  const err = new Error('NOT_FOUND');
  throw err;
}

export async function getFamilyMemberForHousehold(householdId, familyMemberId) {
  const member = await prisma.familyMember.findFirst({
    where: { id: familyMemberId, householdId },
  });
  if (!member) notFound();
  return member;
}

export async function getAccountForHousehold(householdId, accountId) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, householdId },
  });
  if (!account) notFound();
  return account;
}

export async function getIncomeTypeForHousehold(householdId, incomeTypeId) {
  const row = await prisma.incomeType.findFirst({
    where: { id: incomeTypeId, householdId },
  });
  if (!row) notFound();
  return row;
}

export async function getExpenseCategoryForHousehold(householdId, expenseCategoryId) {
  const row = await prisma.expenseCategory.findFirst({
    where: { id: expenseCategoryId, householdId },
  });
  if (!row) notFound();
  return row;
}

export async function getIncomeForHousehold(householdId, incomeId) {
  const row = await prisma.income.findFirst({
    where: {
      id: incomeId,
      familyMember: { householdId },
    },
    include: { familyMember: true },
  });
  if (!row) notFound();
  return row;
}

export async function getExpenseForHousehold(householdId, expenseId) {
  const row = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      familyMember: { householdId },
    },
    include: { familyMember: true },
  });
  if (!row) notFound();
  return row;
}

export async function assertAccountOptional(householdId, accountId) {
  if (!accountId) return null;
  return getAccountForHousehold(householdId, accountId);
}

export async function getRecurringForHousehold(householdId, id) {
  const row = await prisma.recurringPayment.findFirst({
    where: { id, householdId },
  });
  if (!row) throw new HttpError(404, 'Повторяющийся платёж не найден');
  return row;
}
