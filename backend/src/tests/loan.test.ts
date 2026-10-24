import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { dbService } from '../database/db.js';

const app = createApp();

let authToken: string;

describe('Loan APIs, Validation & Summary', () => {
  beforeEach(async () => {
    await dbService._resetMemoryDb();

    // Authenticate a user
    const sendRes = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '9876543210' });

    const verifyRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: '9876543210', otp: sendRes.body.data.devMockOtp });

    authToken = verifyRes.body.data.token;
  });

  it('should validate loan creation input fields', async () => {
    // Missing friendName
    const res1 = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 1000, dueDate: '2026-11-01' });

    expect(res1.status).toBe(400);
    expect(res1.body.success).toBe(false);

    // Negative / Zero amount
    const res2 = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ friendName: 'Bob', amount: -50, dueDate: '2026-11-01' });

    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);

    // Invalid dueDate
    const res3 = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ friendName: 'Bob', amount: 500, dueDate: 'not-a-date' });

    expect(res3.status).toBe(400);
    expect(res3.body.success).toBe(false);
  });

  it('should create a loan entry successfully', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        friendName: 'Rohan Sharma',
        amount: 2500,
        dueDate: '2026-12-01',
        notes: 'Dinner bill split',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.loan.friendName).toBe('Rohan Sharma');
    expect(res.body.data.loan.amount).toBe(2500);
    expect(res.body.data.loan.isRepaid).toBe(false);
  });

  it('should mark a loan as repaid', async () => {
    const createRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        friendName: 'Priya',
        amount: 1500,
        dueDate: '2026-11-15',
      });

    const loanId = createRes.body.data.loan.id;

    const repayRes = await request(app)
      .patch(`/api/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(repayRes.status).toBe(200);
    expect(repayRes.body.success).toBe(true);
    expect(repayRes.body.data.loan.isRepaid).toBe(true);
    expect(repayRes.body.data.loan.repaidAt).toBeDefined();
  });

  it('should correctly calculate summary: total lent, total repaid, and overdue amount', async () => {
    // 1. Upcoming loan: ₹1000, due in future
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        friendName: 'Alice',
        amount: 1000,
        dueDate: '2030-01-01',
      });

    // 2. Overdue loan: ₹2000, due in past
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        friendName: 'Bob',
        amount: 2000,
        dueDate: '2020-01-01',
      });

    // 3. Repaid loan: ₹1500 (was due in past, but repaid)
    const repaidLoanRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        friendName: 'Charlie',
        amount: 1500,
        dueDate: '2021-01-01',
      });

    await request(app)
      .patch(`/api/loans/${repaidLoanRes.body.data.loan.id}/repay`)
      .set('Authorization', `Bearer ${authToken}`);

    // Summary endpoint check
    const summaryRes = await request(app)
      .get('/api/loans/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(summaryRes.status).toBe(200);
    const summary = summaryRes.body.data.summary;

    // Total Lent = 1000 + 2000 + 1500 = 4500
    expect(summary.totalLent).toBe(4500);

    // Total Repaid = 1500
    expect(summary.totalRepaid).toBe(1500);

    // Overdue Amount = 2000 (Bob's loan)
    expect(summary.overdueAmount).toBe(2000);

    // Pending (active non-overdue) = 1000 (Alice's loan)
    expect(summary.pendingAmount).toBe(1000);
    expect(summary.totalLoansCount).toBe(3);
    expect(summary.repaidLoansCount).toBe(1);
    expect(summary.overdueLoansCount).toBe(1);
  });

  it('should highlight overdue loans in getLoans response', async () => {
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        friendName: 'Overdue Friend',
        amount: 800,
        dueDate: '2022-01-01',
      });

    const res = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const overdueLoan = res.body.data.loans.find(
      (l: any) => l.friendName === 'Overdue Friend'
    );
    expect(overdueLoan).toBeDefined();
    expect(overdueLoan.isOverdue).toBe(true);
    expect(overdueLoan.daysOverdue).toBeGreaterThan(0);
  });
});
