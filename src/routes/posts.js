import { Router } from 'express';
import Joi from 'joi';
import { validate } from '../middleware/validate.js';

export function createPostsRouter(prisma) {
  const router = Router();
  const postFields = { title: Joi.string().min(1).required(), content: Joi.string().allow('').optional(), published: Joi.boolean().default(false), authorId: Joi.number().integer().required(), tags: Joi.array().items(Joi.string().min(1)).default([]) };
  const createSchema = Joi.object(postFields);
  const updateSchema = Joi.object({ ...postFields, title: Joi.string().min(1), authorId: Joi.number().integer(), tags: Joi.array().items(Joi.string().min(1)) }).min(1);
  const include = { author: true, tags: true };
  router.get('/', async (req, res, next) => { try {
    const page = Math.max(Number(req.query.page) || 1, 1), limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const where = {};
    if (req.query.search) where.title = { contains: req.query.search, mode: 'insensitive' };
    if (req.query.published !== undefined) where.published = req.query.published === 'true';
    if (req.query.authorId !== undefined) where.authorId = Number(req.query.authorId);
    const [data, total] = await prisma.$transaction([prisma.post.findMany({ where, include, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }), prisma.post.count({ where })]);
    res.json({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (e) { next(e); } });
  router.get('/:id', async (req, res, next) => { try { const post = await prisma.post.findUnique({ where: { id: Number(req.params.id) }, include }); if (!post) return res.status(404).json({ error: 'Пост не найден' }); res.json(post); } catch (e) { next(e); } });
  router.post('/', validate(createSchema), async (req, res, next) => { try { const { tags, ...data } = req.body; const post = await prisma.post.create({ data: { ...data, tags: { connectOrCreate: tags.map((name) => ({ where: { name }, create: { name } })) } }, include }); res.status(201).json(post); } catch (e) { next(e); } });
  router.patch('/:id', validate(updateSchema), async (req, res, next) => { try { const { tags, ...data } = req.body; const post = await prisma.post.update({ where: { id: Number(req.params.id) }, data: { ...data, ...(tags && { tags: { set: [], connectOrCreate: tags.map((name) => ({ where: { name }, create: { name } })) } }) }, include }); res.json(post); } catch (e) { if (e.code === 'P2025') return res.status(404).json({ error: 'Пост не найден' }); next(e); } });
  router.delete('/:id', async (req, res, next) => { try { await prisma.post.delete({ where: { id: Number(req.params.id) } }); res.status(204).end(); } catch (e) { if (e.code === 'P2025') return res.status(404).json({ error: 'Пост не найден' }); next(e); } });
  return router;
}
