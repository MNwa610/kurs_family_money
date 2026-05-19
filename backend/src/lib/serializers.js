import { decimalToJson } from '../utils/decimal.js';

export function serializeAccount(account) {
  return {
    id: account.id,
    name: account.name,
    balance: decimalToJson(account.balance),
    currency: account.currency,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export function serializeIncome(row) {
  return {
    id: row.id,
    type: 'income',
    amount: decimalToJson(row.amount),
    occurredAt: row.occurredAt,
    description: row.description,
    familyMemberId: row.familyMemberId,
    familyMember: row.familyMember
      ? { id: row.familyMember.id, name: row.familyMember.name }
      : undefined,
    incomeTypeId: row.incomeTypeId,
    incomeType: row.incomeType ? { id: row.incomeType.id, name: row.incomeType.name } : undefined,
    accountId: row.accountId,
    account: row.account ? { id: row.account.id, name: row.account.name } : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function serializeExpense(row) {
  return {
    id: row.id,
    type: 'expense',
    amount: decimalToJson(row.amount),
    occurredAt: row.occurredAt,
    description: row.description,
    familyMemberId: row.familyMemberId,
    familyMember: row.familyMember
      ? { id: row.familyMember.id, name: row.familyMember.name }
      : undefined,
    expenseCategoryId: row.expenseCategoryId,
    expenseCategory: row.expenseCategory
      ? { id: row.expenseCategory.id, name: row.expenseCategory.name }
      : undefined,
    accountId: row.accountId,
    account: row.account ? { id: row.account.id, name: row.account.name } : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const incomeInclude = {
  familyMember: { select: { id: true, name: true } },
  incomeType: { select: { id: true, name: true } },
  account: { select: { id: true, name: true } },
};

const expenseInclude = {
  familyMember: { select: { id: true, name: true } },
  expenseCategory: { select: { id: true, name: true } },
  account: { select: { id: true, name: true } },
};

export { incomeInclude, expenseInclude };
