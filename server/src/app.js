import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  const skipRateLimit = env.nodeEnv === 'test';
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => skipRateLimit,
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => skipRateLimit,
    message: { success: false, message: 'Too many authentication attempts. Try again later.' },
  });

  app.use('/api', generalLimiter);

  app.get('/health', (_req, res) => {
    res.json({ success: true, status: 'ok' });
  });
  app.get('/api/v1/health', (_req, res) => {
    res.json({ success: true, status: 'ok', service: 'labslot-api' });
  });

  app.use((req, res, next) => {
    const skipCsrf = req.path.startsWith('/api/v1/auth/register') || req.path.startsWith('/api/v1/auth/login');
    if (skipCsrf) return next();
    return csrfProtection(req, res, next);
  });

  app.use('/api/v1/auth', authLimiter, authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/resources', resourceRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/notifications', notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
