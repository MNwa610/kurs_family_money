import { Decimal } from '@prisma/client/runtime/library.js';

import { prisma } from './prisma.js';

export async function adjustAccountBalance(accountId, delta) {
  if (!accountId || delta.equals(0)) return;
  await prisma.account.update({
    where: { id: accountId },
    data: { balance: { increment: delta } },
  });
}

export function amountDelta(type, amount, sign = 1) {
  const dec = amount instanceof Decimal ? amount : new Decimal(amount);
  if (type === 'income') return dec.mul(sign);
  if (type === 'expense') return dec.mul(-sign);
  throw new Error('INVALID_TYPE');
}

export async function applyBalanceChange(accountId, type, amount, sign = 1) {
  if (!accountId) return;
  const delta = amountDelta(type, amount, sign);
  await adjustAccountBalance(accountId, delta);
}
