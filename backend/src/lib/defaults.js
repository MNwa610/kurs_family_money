const INCOME_TYPES = ['Зарплата', 'Подработка', 'Подарки'];
const EXPENSE_CATEGORIES = ['Продукты', 'Жильё', 'Транспорт', 'Развлечения', 'Здоровье', 'Прочее'];

export async function seedUserDefaults(tx, userId, displayName) {
  const memberName = displayName?.trim() || 'Я';

  await tx.familyMember.create({
    data: { userId, name: memberName, relation: 'self' },
  });
  await tx.account.create({
    data: { userId, name: 'Основной', currency: 'RUB' },
  });
  await tx.incomeType.createMany({
    data: INCOME_TYPES.map((name) => ({ userId, name })),
  });
  await tx.expenseCategory.createMany({
    data: EXPENSE_CATEGORIES.map((name) => ({ userId, name })),
  });
}
