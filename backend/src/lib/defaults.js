const INCOME_TYPES = ['Зарплата', 'Подработка', 'Подарки'];
const EXPENSE_CATEGORIES = ['Продукты', 'Жильё', 'Транспорт', 'Развлечения', 'Здоровье', 'Прочее'];

export async function seedUserDefaults(tx, householdId, displayName) {
  const memberName = displayName?.trim() || 'Я';

  await tx.familyMember.create({
    data: { householdId, name: memberName, relation: 'self' },
  });
  await tx.account.create({
    data: { householdId, name: 'Основной', currency: 'RUB' },
  });
  await tx.incomeType.createMany({
    data: INCOME_TYPES.map((name) => ({ householdId, name })),
  });
  await tx.expenseCategory.createMany({
    data: EXPENSE_CATEGORIES.map((name) => ({ householdId, name })),
  });
}
