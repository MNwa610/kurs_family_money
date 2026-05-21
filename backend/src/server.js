import express from 'express';
import cors from 'cors';
import { assertEnv, env } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import routes from './routes/index.js';

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.status(200).json({
      service: 'family-budget-api',
      health: '/health',
      apiBase: '/api',
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'family-budget-api' });
  });

  app.use('/api', routes);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Маршрут не найден' });
  });

  app.use(errorMiddleware);

  return app;
}

async function main() {
  assertEnv();
  const app = createApp();
  const host = process.env.HOST ?? '0.0.0.0';
  app.listen(env.port, host, () => {
    console.log(`Сервер запущен на http://${host}:${env.port}`);
    console.log(`API: http://${host}:${env.port}/api`);
  });
}

main().catch((err) => {
  console.error('Ошибка запуска сервера:', err);
  process.exit(1);
});

export { createApp };
