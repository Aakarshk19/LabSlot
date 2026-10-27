import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requiredInProduction(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (process.env.NODE_ENV === 'production' && !process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/labslot',
  jwtSecret: requiredInProduction('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  requireBookingApproval: process.env.REQUIRE_BOOKING_APPROVAL === 'true',
  adminName: process.env.ADMIN_NAME || 'Lab Administrator',
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@labslot.local').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || 'ChangeThisAdminPassword1',
};

export const isProduction = env.nodeEnv === 'production';
