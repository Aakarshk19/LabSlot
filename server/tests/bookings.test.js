import request from 'supertest';
import { setupTestDb, teardownTestDb } from './setup.js';
import { createStudent, createTestResource, futureSlot, loginAgent, csrfFrom, createAdminUser } from './helpers.js';
import { Booking } from '../src/models/Booking.js';
import { hashPassword } from '../src/services/authService.js';
import { User } from '../src/models/User.js';

let app;

beforeAll(async () => {
  app = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

async function authedStudent(overrides) {
  const created = await createStudent(app, overrides);
  const { agent, csrfToken } = await loginAgent(app, created.email, created.password);
  return { ...created, agent, csrfToken };
}

describe('booking engine', () => {
  test('creates a valid reservation', async () => {
    const { agent, csrfToken } = await authedStudent();
    const resource = await createTestResource();
    const slot = futureSlot(3, 10, 1);
    const res = await agent.post('/api/v1/bookings').set('X-CSRF-Token', csrfToken).send({
      resourceId: resource._id.toString(),
      purpose: 'Circuit debugging lab',
      ...slot,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.booking.bookingReference).toMatch(/^LS-/);
    expect(res.body.data.booking.status).toBe('CONFIRMED');
    expect(res.body.data.booking.statusHistory).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'CONFIRMED', note: expect.any(String) }),
    ]));
    const notifications = await agent.get('/api/v1/notifications');
    expect(notifications.status).toBe(200);
    expect(notifications.body.data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'BOOKING_APPROVED' }),
    ]));
  });

  test('rejects overlapping bookings and allows adjacent ones', async () => {
    const { agent, csrfToken } = await authedStudent();
    const resource = await createTestResource();
    const first = futureSlot(4, 11, 1);
    const overlap = futureSlot(4, 11, 2);
    const adjacent = futureSlot(4, 12, 1);

    const a = await agent.post('/api/v1/bookings').set('X-CSRF-Token', csrfToken).send({
      resourceId: resource._id.toString(),
      purpose: 'Morning experiment',
      ...first,
    });
    expect(a.status).toBe(201);

    const b = await agent.post('/api/v1/bookings').set('X-CSRF-Token', csrfToken).send({
      resourceId: resource._id.toString(),
      purpose: 'Conflicting experiment',
      ...overlap,
    });
    expect(b.status).toBe(409);

    const c = await agent.post('/api/v1/bookings').set('X-CSRF-Token', csrfToken).send({
      resourceId: resource._id.toString(),
      purpose: 'Adjacent experiment',
      ...adjacent,
    });
    expect(c.status).toBe(201);
  });

  test('allows at most one of two simultaneous conflicting requests', async () => {
    const studentA = await authedStudent({ email: `a${Date.now()}@college.edu` });
    const studentB = await authedStudent({ email: `b${Date.now()}@college.edu` });
    const resource = await createTestResource();
    const slot = futureSlot(5, 9, 2);

    const payload = { resourceId: resource._id.toString(), purpose: 'Concurrent access test', ...slot };
    const [r1, r2] = await Promise.all([
      studentA.agent.post('/api/v1/bookings').set('X-CSRF-Token', studentA.csrfToken).send(payload),
      studentB.agent.post('/api/v1/bookings').set('X-CSRF-Token', studentB.csrfToken).send(payload),
    ]);

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([201, 409]);
    const confirmed = await Booking.countDocuments({
      resourceId: resource._id,
      status: { $in: ['PENDING', 'CONFIRMED'] },
    });
    expect(confirmed).toBe(1);
  });

  test('blocks bookings for resources under maintenance', async () => {
    const { agent, csrfToken } = await authedStudent();
    const resource = await createTestResource({ status: 'MAINTENANCE' });
    const slot = futureSlot(3, 10, 1);
    const res = await agent.post('/api/v1/bookings').set('X-CSRF-Token', csrfToken).send({
      resourceId: resource._id.toString(),
      purpose: 'Should fail maintenance',
      ...slot,
    });
    expect(res.status).toBe(409);
  });

  test('rejects past slots and inverted times', async () => {
    const { agent, csrfToken } = await authedStudent();
    const resource = await createTestResource();
    const past = await agent.post('/api/v1/bookings').set('X-CSRF-Token', csrfToken).send({
      resourceId: resource._id.toString(),
      purpose: 'Past slot attempt',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
    });
    expect(past.status).toBe(400);

    const inverted = await agent.post('/api/v1/bookings').set('X-CSRF-Token', csrfToken).send({
      resourceId: resource._id.toString(),
      purpose: 'Inverted times',
      startTime: futureSlot(3, 14, 1).endTime,
      endTime: futureSlot(3, 14, 1).startTime,
    });
    expect(inverted.status).toBe(400);
  });

  test('students cannot read another user reservation', async () => {
    const owner = await authedStudent({ email: `own${Date.now()}@college.edu` });
    const other = await authedStudent({ email: `oth${Date.now()}@college.edu` });
    const resource = await createTestResource();
    const created = await owner.agent.post('/api/v1/bookings').set('X-CSRF-Token', owner.csrfToken).send({
      resourceId: resource._id.toString(),
      purpose: 'Private reservation',
      ...futureSlot(6, 10, 1),
    });
    const id = created.body.data.booking.id;
    const peek = await other.agent.get(`/api/v1/bookings/${id}`);
    expect(peek.status).toBe(403);
  });

  test('students can cancel eligible reservations', async () => {
    const { agent, csrfToken } = await authedStudent();
    const resource = await createTestResource();
    const created = await agent.post('/api/v1/bookings').set('X-CSRF-Token', csrfToken).send({
      resourceId: resource._id.toString(),
      purpose: 'Cancel me please',
      ...futureSlot(7, 15, 1),
    });
    const id = created.body.data.booking.id;
    const cancelled = await agent.patch(`/api/v1/bookings/${id}/cancel`).set('X-CSRF-Token', csrfToken).send({
      reason: 'Plan changed',
    });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.booking.status).toBe('CANCELLED');
  });

  test('invalid ids return 400', async () => {
    const { agent } = await authedStudent();
    const res = await agent.get('/api/v1/bookings/not-an-id');
    expect(res.status).toBe(400);
  });
});

describe('admin permissions', () => {
  test('students cannot create resources', async () => {
    const { agent, csrfToken } = await authedStudent();
    const res = await agent.post('/api/v1/admin/resources').set('X-CSRF-Token', csrfToken).send({
      name: 'Should fail',
      resourceCode: 'NOPE-1',
      description: 'Students must not create resources here.',
      category: 'COMPUTER',
      location: 'Nowhere',
    });
    expect(res.status).toBe(403);
  });

  test('admins can create resources and view dashboard stats', async () => {
    const admin = await User.create({
      name: 'Admin',
      email: `adm${Date.now()}@labslot.local`,
      passwordHash: await hashPassword('AdminPass123'),
      role: 'ADMIN',
    });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: admin.email,
      password: 'AdminPass123',
    });
    expect(login.status).toBe(200);
    const agent = request.agent(app);
    const logged = await agent.post('/api/v1/auth/login').send({
      email: admin.email,
      password: 'AdminPass123',
    });
    const csrf = csrfFrom(logged);
    const created = await agent.post('/api/v1/admin/resources').set('X-CSRF-Token', csrf).send({
      name: 'Admin Scope',
      resourceCode: 'ADM-SCOPE',
      description: 'Created by an administrator during tests.',
      category: 'COMPUTER',
      location: 'Admin Lab',
    });
    expect(created.status).toBe(201);
    const dashboard = await agent.get('/api/v1/admin/dashboard');
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.totals.activeResources).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.data.totals.totalUsers).toBeGreaterThanOrEqual(0);
  });
});
