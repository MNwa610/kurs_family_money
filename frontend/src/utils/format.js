const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export function currentMonthParam() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(monthParam) {
  const match = /^(\d{4})-(\d{2})$/.exec(monthParam ?? '');
  if (!match) return monthParam ?? '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatMoney(value) {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(abs);
  if (value < 0) return `−${formatted} ₽`;
  if (value > 0) return `+${formatted} ₽`;
  return `${formatted} ₽`;
}

export function formatMoneyPlain(value) {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)} ₽`;
}

export function formatChartDay(day) {
  if (!day) return '';
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) return String(day);
  return String(d.getUTCDate());
}
