export function requireString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`REQUIRED_${fieldName.toUpperCase()}`);
  }
  return value.trim();
}

export function optionalString(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t || null;
}

export function requireId(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`REQUIRED_${fieldName.toUpperCase()}`);
  }
  return value.trim();
}

export function mapValidationError(err) {
  const code = err.message;
  const map = {
    INVALID_AMOUNT: [400, 'Сумма должна быть положительным числом'],
    INVALID_MONTH: [400, 'Некорректный месяц (формат YYYY-MM)'],
    INVALID_DATE_RANGE: [400, 'Некорректный период дат'],
    INVALID_DATE: [400, 'Некорректная дата'],
    REQUIRED_NAME: [400, 'Поле name обязательно'],
    REQUIRED_EMAIL: [400, 'Поле email обязательно'],
    NOT_FOUND: [404, 'Запись не найдена'],
    FORBIDDEN: [403, 'Нет доступа к ресурсу'],
  };
  if (code?.startsWith('REQUIRED_')) {
    return [400, `Обязательное поле: ${code.replace('REQUIRED_', '').toLowerCase()}`];
  }
  return map[code] || null;
}
