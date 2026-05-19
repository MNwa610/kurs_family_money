export function parseMonthParam(monthStr) {
  if (!monthStr || typeof monthStr !== 'string') {
    const now = new Date();
    return monthRange(now.getFullYear(), now.getMonth() + 1);
  }
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr.trim());
  if (!match) {
    throw new Error('INVALID_MONTH');
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error('INVALID_MONTH');
  }
  return monthRange(year, month);
}

export function monthRange(year, month) {
  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { from, to, label: `${year}-${String(month).padStart(2, '0')}` };
}

export function parseDateRange(query) {
  if (query.from && query.to) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new Error('INVALID_DATE_RANGE');
    }
    to.setHours(23, 59, 59, 999);
    return {
      from,
      to,
      label: `${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}`,
    };
  }
  if (query.month) {
    return parseMonthParam(query.month);
  }
  return parseMonthParam(null);
}

export function parseOccurredAt(value) {
  if (!value) return new Date();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error('INVALID_DATE');
  }
  return d;
}
