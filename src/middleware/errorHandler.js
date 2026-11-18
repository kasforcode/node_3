import { Prisma } from '@prisma/client';
export function errorHandler(error, _req, res, _next) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(409).json({ error: 'Запись с таким уникальным полем уже существует' });
  console.error(error);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
