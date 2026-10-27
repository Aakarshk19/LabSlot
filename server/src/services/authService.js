import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function registerStudent({ name, email, password, department }) {
  const normalized = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalized });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({
    name: name.trim(),
    email: normalized,
    passwordHash: await hashPassword(password),
    role: 'STUDENT',
    department: department?.trim() || '',
  });

  return user;
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'This account has been disabled');
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new ApiError(401, 'Invalid email or password');
  }
  return user;
}

export function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function createCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}

export async function updateProfile(userId, { name, department }) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (name !== undefined) user.name = name.trim();
  if (department !== undefined) user.department = department.trim();
  await user.save();
  return user;
}

export async function ensureAdmin() {
  const email = env.adminEmail;
  let admin = await User.findOne({ email });
  if (admin) return admin;
  admin = await User.create({
    name: env.adminName,
    email,
    passwordHash: await hashPassword(env.adminPassword),
    role: 'ADMIN',
  });
  return admin;
}
