import { env } from './env.js';

// Solo el frontend puede hacer pedidos a la API
export const corsOptions = {
  origin: env.CORS_ORIGIN,
};
