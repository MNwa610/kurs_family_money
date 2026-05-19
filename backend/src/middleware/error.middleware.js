import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/errors.js';
import { mapValidationError } from '../utils/validation.js';

export function errorMiddleware(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    const body = { message: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  const mapped = mapValidationError(err);
  if (mapped) {
    return res.status(mapped[0]).json({ message: mapped[1] });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Запись с такими данными уже существует' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Запись не найдена' });
    }
  }

  console.error(err);
  return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
}
