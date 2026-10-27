import request from 'supertest';
import bcrypt from 'bcrypt';
import { setupTestDb, teardownTestDb } from './setup.js';
import { User } from '../src/models/User.js';
import { csrfFrom, loginAgent } from './helpers.js';

let app;

beforeAll(async () => {
  app = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});

describe('authentication', () => {
  test('registers a student and hashes the password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Asha Kumar',
      email: 'asha@college.edu',
      password: 'StrongPass1',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.user.email).toBe('asha@college.edu');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    const stored = await User.findOne({ email: 'asha@college.edu' }).select('+passwordHash');
    expect(stored.passwordHash).not.toBe('StrongPass1');
    expect(await bcrypt.compare('StrongPass1', stored.passwordHash)).toBe(true);
  });

  test('rejects duplicate emails', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Asha Two',
      email: 'asha@college.edu',
      password: 'StrongPass1',
    });
    expect(res.status).toBe(409);
  });

  test('ignores role escalation on register', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Hacker',
      email: 'hack@college.edu',
      password: 'StrongPass1',
      role: 'ADMIN',
    });
    expect(res.status).toBe(400);
  });

  test('logs in with valid credentials and rejects invalid ones', async () => {
    const ok = await request(app).post('/api/v1/auth/login').send({
      email: 'asha@college.edu',
      password: 'StrongPass1',
    });
    expect(ok.status).toBe(200);
    expect(ok.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('labslot_token')]));

    const bad = await request(app).post('/api/v1/auth/login').send({
      email: 'asha@college.edu',
      password: 'wrong-password',
    });
    expect(bad.status).toBe(401);
  });

  test('protects /auth/me without a session', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns the current user when authenticated', async () => {
    const { agent } = await loginAgent(app, 'asha@college.edu', 'StrongPass1');
    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('asha@college.edu');
  });

  test('updates profile fields without changing role', async () => {
    const agent = request.agent(app);
    const login = await agent.post('/api/v1/auth/login').send({
      email: 'asha@college.edu',
      password: 'StrongPass1',
    });
    const csrf = csrfFrom(login);
    const patched = await agent
      .patch('/api/v1/users/me')
      .set('X-CSRF-Token', csrf)
      .send({ name: 'Asha K', department: 'ECE', role: 'ADMIN' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.user.name).toBe('Asha K');
    expect(patched.body.data.user.role).toBe('STUDENT');
  });
});
