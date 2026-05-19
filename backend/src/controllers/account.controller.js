import { prisma } from '../lib/prisma.js';
import { getAccountForUser } from '../lib/ownership.js';
import { serializeAccount } from '../lib/serializers.js';
import { optionalString, requireString } from '../utils/validation.js';

export async function list(req, res) {
  const rows = await prisma.account.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ data: rows.map(serializeAccount) });
}

export async function create(req, res) {
  const name = requireString(req.body?.name, 'name');
  const currency = optionalString(req.body?.currency) ?? 'RUB';

  const account = await prisma.account.create({
    data: { userId: req.user.id, name, currency },
  });
  res.status(201).json(serializeAccount(account));
}

export async function update(req, res) {
  await getAccountForUser(req.user.id, req.params.id);
  const name = req.body?.name != null ? requireString(req.body.name, 'name') : undefined;
  const currency = req.body?.currency != null ? optionalString(req.body.currency) ?? 'RUB' : undefined;

  const account = await prisma.account.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(currency && { currency }),
    },
  });
  res.json(serializeAccount(account));
}

export async function remove(req, res) {
  const account = await getAccountForUser(req.user.id, req.params.id);
  const [incomeCount, expenseCount] = await Promise.all([
    prisma.income.count({ where: { accountId: account.id } }),
    prisma.expense.count({ where: { accountId: account.id } }),
  ]);
  const linked = incomeCount + expenseCount;
  if (linked > 0) {
    return res.status(409).json({
      message: 'Нельзя удалить счёт с привязанными операциями. Сначала отвяжите или удалите их.',
    });
  }
  await prisma.account.delete({ where: { id: account.id } });
  res.status(204).send();
}
