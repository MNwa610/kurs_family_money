import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { seedUserDefaults } from '../lib/defaults.js';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/errors.js';

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { email: user.email },
    env.jwtSecret,
    { subject: user.id, expiresIn: env.jwtExpiresIn },
  );
}

export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body ?? {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Поле email обязательно' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Пароль обязателен (минимум 6 символов)' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const displayName = name?.trim() || null;

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: normalizedEmail,
        password: passwordHash,
        name: displayName,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    await seedUserDefaults(tx, created.id, displayName);
    return created;
  });

  res.status(201).json({ user, token: signToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Поле email обязательно' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Поле password обязательно' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  const publicUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
  res.json({ user: publicUser, token: signToken(publicUser) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }
  res.json({ user });
});
