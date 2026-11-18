import express from 'express';
import { PrismaClient } from '@prisma/client';
import { config } from './config/index.js';
import { createUsersRouter } from './routes/users.js';
import { createPostsRouter } from './routes/posts.js';
import { errorHandler } from './middleware/errorHandler.js';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use('/api/users', createUsersRouter(prisma));
app.use('/api/posts', createPostsRouter(prisma));
app.use((_req, res) => res.status(404).json({ error: 'Маршрут не найден' }));
app.use(errorHandler);
app.listen(config.port, () => console.log(`API запущен: http://localhost:${config.port}`));
