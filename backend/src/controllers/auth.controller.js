import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { email: user.email },
    env.jwtSecret,
    { subject: user.id, expiresIn: env.jwtExpiresIn },
  );
}

export async function register(req, res) {
  try {
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
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: passwordHash,
        name: name?.trim() || null,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
}

export async function login(req, res) {
  try {
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
    return res.status(200).json({ user: publicUser, token: signToken(publicUser) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
}
