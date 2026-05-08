import { prisma } from '../lib/prisma.js';

export async function create(req, res) {
  try {
    const { name, relation } = req.body ?? {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Поле name обязательно' });
    }

    const member = await prisma.familyMember.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        relation: relation?.trim() || null,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        relation: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(member);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
}

export async function list(req, res) {
  try {
    const members = await prisma.familyMember.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        relation: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(200).json({ data: members });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
}
