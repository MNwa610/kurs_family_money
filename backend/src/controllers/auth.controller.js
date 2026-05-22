import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { normalizeAuthEmail } from '../lib/authEmail.js';
import { env } from '../config/env.js';
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

  const normalizedEmail = normalizeAuthEmail(email);
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const displayName = name?.trim() || null;

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: passwordHash,
      name: displayName,
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  res.status(201).json({ user, token: signToken(user), hasHousehold: false });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Поле email обязательно' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Поле password обязательно' });
  }

  const normalizedEmail = normalizeAuthEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  const membership = await prisma.householdMember.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const publicUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
  res.json({
    user: publicUser,
    token: signToken(publicUser),
    hasHousehold: Boolean(membership),
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) {
    return res.status(401).json({ message: 'Сессия недействительна. Войдите снова.' });
  }

  const membership = await prisma.householdMember.findUnique({
    where: { userId: req.user.id },
    select: { id: true },
  });

  res.json({ user, hasHousehold: Boolean(membership) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, currentPassword, newPassword } = req.body ?? {};

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(401).json({ message: 'Сессия недействительна. Войдите снова.' });
  }

  const data = {};

  if (name !== undefined) {
    if (typeof name !== 'string') {
      return res.status(400).json({ message: 'Имя должно быть строкой' });
    }
    const trimmed = name.trim();
    data.name = trimmed || null;
  }

  if (newPassword != null && newPassword !== '') {
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'Новый пароль — минимум 6 символов' });
    }
    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ message: 'Укажите текущий пароль' });
    }
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ message: 'Неверный текущий пароль' });
    }
    data.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'Нет данных для обновления' });
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: { id: true, email: true, name: true, createdAt: true },
  });

  res.json({ user: updated });
});
