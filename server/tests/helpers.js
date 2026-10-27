import request from 'supertest';
import { User } from '../src/models/User.js';
import { Resource } from '../src/models/Resource.js';
import { hashPassword } from '../src/services/authService.js';

export function csrfFrom(res) {
  return res.body?.data?.csrfToken;
}

export async function createStudent(app, overrides = {}) {
  const email = overrides.email || `student${Date.now()}${Math.random().toString(16).slice(2)}@college.edu`;
  const password = overrides.password || 'StudentPass123';
  const res = await request(app).post('/api/v1/auth/register').send({
    name: overrides.name || 'Test Student',
    email,
    password,
    department: 'Computer Science',
  });
  return { res, agent: request.agent(app), email, password, csrfToken: csrfFrom(res), user: res.body.data?.user };
}

export async function loginAgent(app, email, password) {
  const agent = request.agent(app);
  const res = await agent.post('/api/v1/auth/login').send({ email, password });
  return { agent, csrfToken: csrfFrom(res), res };
}

export async function createAdminUser() {
  return User.create({
    name: 'Test Admin',
    email: `admin${Date.now()}@labslot.local`,
    passwordHash: await hashPassword('AdminPass123'),
    role: 'ADMIN',
  });
}

export async function createTestResource(overrides = {}) {
  return Resource.create({
    name: overrides.name || 'Test Oscilloscope',
    resourceCode: overrides.resourceCode || `TST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    description: overrides.description || 'A test laboratory instrument used in automated tests.',
    category: overrides.category || 'ELECTRONIC_EQUIPMENT',
    location: overrides.location || 'Electronics Lab',
    specifications: 'Test spec',
    status: overrides.status || 'AVAILABLE',
    bookingConfig: {
      minDurationMinutes: 30,
      maxDurationMinutes: 180,
      maxAdvanceDays: 14,
      cancellationCutoffHours: 1,
      operatingStart: '08:00',
      operatingEnd: '18:00',
      slotIntervalMinutes: 30,
      ...(overrides.bookingConfig || {}),
    },
  });
}

export function futureSlot(daysAhead = 2, startHour = 10, durationHours = 1) {
  const start = new Date();
  start.setDate(start.getDate() + daysAhead);
  start.setHours(startHour, 0, 0, 0);
  const end = new Date(start);
  end.setHours(startHour + durationHours, 0, 0, 0);
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}
