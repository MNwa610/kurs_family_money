import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

export function assertEnv() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL не задан в .env');
  }
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET не задан в .env');
  }
}
