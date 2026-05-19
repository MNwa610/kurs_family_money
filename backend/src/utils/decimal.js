import { Decimal } from '@prisma/client/runtime/library.js';

export function parseAmount(value) {
  if (value === undefined || value === null || value === '') {
    throw new Error('INVALID_AMOUNT');
  }
  const num = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error('INVALID_AMOUNT');
  }
  return new Decimal(num.toFixed(2));
}

export function decimalToNumber(value) {
  if (value == null) return 0;
  return Number(value.toString());
}

export function decimalToJson(value) {
  return decimalToNumber(value);
}
