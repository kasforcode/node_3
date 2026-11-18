import { Router } from 'express';
import Joi from 'joi';
import { validate } from '../middleware/validate.js';

export function createUsersRouter(prisma) {
  const router = Router();
  const createSchema = Joi.object({ email: Joi.string().email().required(), name: Joi.string().min(2).required(), role: Joi.string().valid('USER', 'ADMIN').default('USER') });
  const updateSchema = Joi.object({ email: Joi.string().email(), name: Joi.string().min(2), role: Joi.string().valid('USER', 'ADMIN') }).min(1);
  router.get('/', async (req, res, next) => { try {
    const page = Math.max(Number(req.query.page) || 1, 1), limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const [data, total] = await prisma.$transaction([prisma.user.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { id: 'asc' } }), prisma.user.count()]);
    res.json({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (e) { next(e); } });
  router.get('/:id', async (req, res, next) => { try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) }, include: { posts: { orderBy: { createdAt: 'desc' } } } });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' }); res.json(user);
  } catch (e) { next(e); } });
  router.post('/', validate(createSchema), async (req, res, next) => { try { res.status(201).json(await prisma.user.create({ data: req.body })); } catch (e) { next(e); } });
  router.patch('/:id', validate(updateSchema), async (req, res, next) => { try {
    const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data: req.body }); res.json(user);
  } catch (e) { if (e.code === 'P2025') return res.status(404).json({ error: 'Пользователь не найден' }); next(e); } });
  router.delete('/:id', async (req, res, next) => { try { await prisma.user.delete({ where: { id: Number(req.params.id) } }); res.status(204).end(); } catch (e) { if (e.code === 'P2025') return res.status(404).json({ error: 'Пользователь не найден' }); next(e); } });
  return router;
}
