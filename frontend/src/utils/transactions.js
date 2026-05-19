function formatDateLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Сегодня';
  if (sameDay(d, yesterday)) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

const CATEGORY_STYLES = {
  Продукты: { icon: 'shopping', iconBg: '#DBEAFE' },
  Жильё: { icon: 'wallet', iconBg: '#D1FAE5' },
  Транспорт: { icon: 'car', iconBg: '#FEF3C7' },
  Развлечения: { icon: 'film', iconBg: '#FEE2E2' },
  Зарплата: { icon: 'wallet', iconBg: '#D1FAE5' },
  Подработка: { icon: 'briefcase', iconBg: '#E0E7FF' },
};

const TYPE_STYLES = {
  income: { icon: 'wallet', iconBg: '#D1FAE5' },
  expense: { icon: 'shopping', iconBg: '#FEE2E2' },
};

export function mapTransactionForRow(tx) {
  const title = tx.title ?? tx.incomeType?.name ?? tx.expenseCategory?.name ?? 'Операция';
  const category = tx.incomeType?.name ?? tx.expenseCategory?.name ?? '';
  const styles = CATEGORY_STYLES[category] ?? TYPE_STYLES[tx.type] ?? TYPE_STYLES.expense;
  const amount = tx.displayAmount ?? (tx.type === 'expense' ? -Number(tx.amount) : Number(tx.amount));

  return {
    ...tx,
    title,
    subtitle: tx.subtitle ?? tx.description ?? '',
    meta: tx.meta ?? [tx.familyMember?.name, tx.account?.name].filter(Boolean).join(' · '),
    category,
    amount,
    dateLabel: tx.dateLabel ?? formatDateLabel(tx.occurredAt),
    icon: tx.icon ?? styles.icon,
    iconBg: tx.iconBg ?? styles.iconBg,
  };
}
