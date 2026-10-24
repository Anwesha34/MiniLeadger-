import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { dbService } from '../database/db.js';

const app = createApp();

describe('Auth API & Mock OTP', () => {
  beforeEach(async () => {
    await dbService._resetMemoryDb();
  });

  it('should generate a mock OTP and return devMockOtp in development', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '+919876543210' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.phone).toBe('+919876543210');
    expect(res.body.data.devMockOtp).toBeDefined();
    expect(res.body.data.devMockOtp).toMatch(/^[0-9]{6}$/);
  });

  it('should fail when phone number is too short or invalid', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should verify OTP and return a JWT token', async () => {
    const sendRes = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9876543210' });

    const otp = sendRes.body.data.devMockOtp;

    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: '9876543210', otp, name: 'Alex' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.token).toBeDefined();
    expect(verifyRes.body.data.user.phone).toBe('9876543210');
  });

  it('should reject invalid OTP', async () => {
    await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9876543210' });

    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: '9876543210', otp: '000000' });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.success).toBe(false);
  });

  it('should access protected /api/auth/me with valid Bearer token', async () => {
    const sendRes = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9876543210' });

    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: '9876543210', otp: sendRes.body.data.devMockOtp });

    const token = verifyRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.phone).toBe('9876543210');
  });
});
