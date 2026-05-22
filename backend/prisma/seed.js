import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { DEMO_EMAIL } from '../src/lib/authEmail.js';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'demo1234';
const DEMO_USER_ID = '00000000-0000-4000-a000-000000000001';
const LEGACY_DEMO_EMAILS = ['demo@femily.local'];

function monthRange(year, month) {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { from, to, label: `${year}-${String(month).padStart(2, '0')}` };
}

function randomDayInMonth(year, month) {
  const days = new Date(year, month, 0).getDate();
  const day = 1 + Math.floor(Math.random() * days);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

async function clearDemoHousehold(userId) {
  const membership = await prisma.householdMember.findUnique({
    where: { userId },
    select: { householdId: true },
  });
  if (!membership) return;

  await prisma.household.delete({ where: { id: membership.householdId } });
}

async function main() {
  console.log('Сидирование демо-данных…');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.user.deleteMany({
    where: { email: { in: LEGACY_DEMO_EMAILS } },
  });

  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    await clearDemoHousehold(existing.id);
  }

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { password: passwordHash, name: 'Иван' },
    create: {
      id: DEMO_USER_ID,
      email: DEMO_EMAIL,
      password: passwordHash,
      name: 'Иван',
    },
  });

  const household = await prisma.household.create({
    data: { name: 'Семья Ивановых' },
  });

  await prisma.householdMember.create({
    data: { householdId: household.id, userId: user.id, role: 'owner' },
  });

  const ivan = await prisma.familyMember.create({
    data: { householdId: household.id, name: 'Иван', relation: 'self' },
  });
  const maria = await prisma.familyMember.create({
    data: { householdId: household.id, name: 'Мария', relation: 'partner' },
  });

  const account = await prisma.account.create({
    data: { householdId: household.id, name: 'Сбербанк', currency: 'RUB', balance: 0 },
  });

  const incomeTypes = await Promise.all(
    ['Зарплата', 'Подработка', 'Подарки'].map((name) =>
      prisma.incomeType.create({ data: { householdId: household.id, name } }),
    ),
  );

  const categories = await Promise.all(
    ['Продукты', 'Жильё', 'Транспорт', 'Развлечения', 'Здоровье', 'Прочее'].map((name) =>
      prisma.expenseCategory.create({ data: { householdId: household.id, name } }),
    ),
  );

  const catByName = Object.fromEntries(categories.map((c) => [c.name, c]));
  const typeByName = Object.fromEntries(incomeTypes.map((t) => [t.name, t]));

  const months = [
    { y: 2026, m: 2 },
    { y: 2026, m: 3 },
    { y: 2026, m: 4 },
    { y: 2026, m: 5 },
  ];

  let totalIncome = 0;
  let totalExpense = 0;

  for (const { y, m } of months) {
    const { label } = monthRange(y, m);

    await prisma.categoryBudget.createMany({
      data: [
        { householdId: household.id, expenseCategoryId: catByName['Продукты'].id, month: label, limitAmount: 25000 },
        { householdId: household.id, expenseCategoryId: catByName['Жильё'].id, month: label, limitAmount: 35000 },
        { householdId: household.id, expenseCategoryId: catByName['Транспорт'].id, month: label, limitAmount: 12000 },
        { householdId: household.id, expenseCategoryId: catByName['Развлечения'].id, month: label, limitAmount: 10000 },
      ],
    });

    const salary = 85000 + Math.floor(Math.random() * 5000);
    await prisma.income.create({
      data: {
        amount: salary,
        familyMemberId: maria.id,
        incomeTypeId: typeByName['Зарплата'].id,
        accountId: account.id,
        description: 'Зарплата',
        occurredAt: new Date(Date.UTC(y, m - 1, 5, 10, 0, 0)),
      },
    });
    totalIncome += salary;

    if (m % 2 === 0) {
      const freelance = 12000 + Math.floor(Math.random() * 4000);
      await prisma.income.create({
        data: {
          amount: freelance,
          familyMemberId: ivan.id,
          incomeTypeId: typeByName['Подработка'].id,
          accountId: account.id,
          description: 'Фриланс',
          occurredAt: randomDayInMonth(y, m),
        },
      });
      totalIncome += freelance;
    }

    const expensePlan = [
      ['Продукты', 18000, 24000, ivan],
      ['Жильё', 32000, 32000, maria],
      ['Транспорт', 6000, 11000, ivan],
      ['Развлечения', 3000, 9000, maria],
      ['Здоровье', 2000, 7000, ivan],
      ['Прочее', 1500, 6000, maria],
    ];

    for (const [name, min, max, member] of expensePlan) {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i += 1) {
        const amount = Math.round(min / count + Math.random() * ((max - min) / count));
        await prisma.expense.create({
          data: {
            amount,
            familyMemberId: member.id,
            expenseCategoryId: catByName[name].id,
            accountId: account.id,
            description: `${name} — покупка`,
            occurredAt: randomDayInMonth(y, m),
          },
        });
        totalExpense += amount;
      }
    }
  }

  await prisma.account.update({
    where: { id: account.id },
    data: { balance: totalIncome - totalExpense },
  });

  await prisma.recurringPayment.createMany({
    data: [
      {
        householdId: household.id,
        type: 'expense',
        amount: 32000,
        description: 'Аренда квартиры',
        familyMemberId: maria.id,
        expenseCategoryId: catByName['Жильё'].id,
        accountId: account.id,
        frequency: 'monthly',
        dayOfMonth: 3,
        nextRunAt: new Date(Date.UTC(2026, 5, 3, 12, 0, 0)),
        isActive: true,
      },
      {
        householdId: household.id,
        type: 'income',
        amount: 85000,
        description: 'Зарплата',
        familyMemberId: maria.id,
        incomeTypeId: typeByName['Зарплата'].id,
        accountId: account.id,
        frequency: 'monthly',
        dayOfMonth: 5,
        nextRunAt: new Date(Date.UTC(2026, 5, 5, 12, 0, 0)),
        isActive: true,
      },
    ],
  });

  console.log('Готово.');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  (также:   demo@femily.local — опечатка, тоже принимается при входе)`);
  console.log(`  Пароль:   ${DEMO_PASSWORD}`);
  console.log(`  Баланс:   ${totalIncome - totalExpense} ₽`);
  console.log(`  Месяцы:   фев–май 2026`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
