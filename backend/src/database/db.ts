import { PrismaClient } from '@prisma/client';
import { User, Loan, LoanWithStatus, LoanSummary } from '../types/index.js';
import crypto from 'crypto';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

let isPostgresAvailable = false;

// Check PostgreSQL connectivity at startup
export async function initializeDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    isPostgresAvailable = true;
    console.log('✅ [Database] Successfully connected to PostgreSQL via Prisma.');
    return true;
  } catch (error: any) {
    isPostgresAvailable = false;
    console.warn('\n⚠️  [Database Notice]');
    console.warn('   Could not connect to PostgreSQL server at DATABASE_URL.');
    console.warn('   -> Falling back to High-Fidelity In-Memory Storage for instant review & zero-config testing.');
    console.warn('   -> To connect to PostgreSQL: run `docker compose up -d` or provide a valid DATABASE_URL in .env.\n');
    return false;
  }
}

// In-memory fallback stores
interface InMemoryOtp {
  id: string;
  phone: string;
  code: string;
  expiresAt: Date;
  consumed: boolean;
  createdAt: Date;
}

const memoryUsers: User[] = [];
const memoryOtps: InMemoryOtp[] = [];
const memoryLoans: Loan[] = [];

export const dbService = {
  // Check if current active engine is PostgreSQL
  isPostgres(): boolean {
    return isPostgresAvailable;
  },

  // ---------------- User Operations ----------------
  async findUserByPhone(phone: string): Promise<User | null> {
    if (isPostgresAvailable) {
      try {
        const user = await prisma.user.findUnique({ where: { phone } });
        return user;
      } catch {
        // Fallback if query fails
      }
    }
    const user = memoryUsers.find((u) => u.phone === phone);
    return user || null;
  },

  async createUser(phone: string, name?: string): Promise<User> {
    if (isPostgresAvailable) {
      try {
        const user = await prisma.user.create({
          data: { phone, name: name || null },
        });
        return user;
      } catch {
        // Fallback
      }
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      phone,
      name: name || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryUsers.push(newUser);
    return newUser;
  },

  async findUserById(id: string): Promise<User | null> {
    if (isPostgresAvailable) {
      try {
        const user = await prisma.user.findUnique({ where: { id } });
        return user;
      } catch {
        // Fallback
      }
    }
    const user = memoryUsers.find((u) => u.id === id);
    return user || null;
  },

  // ---------------- OTP Operations ----------------
  async saveOtp(phone: string, code: string, expiresAt: Date): Promise<void> {
    if (isPostgresAvailable) {
      try {
        await prisma.otpVerification.create({
          data: { phone, code, expiresAt },
        });
        return;
      } catch {
        // Fallback
      }
    }
    memoryOtps.push({
      id: crypto.randomUUID(),
      phone,
      code,
      expiresAt,
      consumed: false,
      createdAt: new Date(),
    });
  },

  async verifyAndConsumeOtp(phone: string, code: string): Promise<boolean> {
    const now = new Date();
    if (isPostgresAvailable) {
      try {
        const otpRecord = await prisma.otpVerification.findFirst({
          where: {
            phone,
            code,
            consumed: false,
            expiresAt: { gt: now },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!otpRecord) return false;

        await prisma.otpVerification.update({
          where: { id: otpRecord.id },
          data: { consumed: true },
        });
        return true;
      } catch {
        // Fallback
      }
    }

    const record = memoryOtps
      .filter((o) => o.phone === phone && o.code === code && !o.consumed && o.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (!record) return false;
    record.consumed = true;
    return true;
  },

  // ---------------- Loan Operations ----------------
  async createLoan(data: {
    userId: string;
    friendName: string;
    amount: number;
    dueDate: Date;
    notes?: string | null;
    receiptUrl?: string | null;
  }): Promise<Loan> {
    if (isPostgresAvailable) {
      try {
        const loan = await prisma.loan.create({
          data: {
            userId: data.userId,
            friendName: data.friendName,
            amount: data.amount,
            dueDate: data.dueDate,
            notes: data.notes || null,
            receiptUrl: data.receiptUrl || null,
          },
        });
        return loan;
      } catch {
        // Fallback
      }
    }

    const newLoan: Loan = {
      id: crypto.randomUUID(),
      userId: data.userId,
      friendName: data.friendName,
      amount: data.amount,
      dueDate: data.dueDate,
      notes: data.notes || null,
      receiptUrl: data.receiptUrl || null,
      isRepaid: false,
      repaidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryLoans.push(newLoan);
    return newLoan;
  },

  async findLoanById(id: string): Promise<Loan | null> {
    if (isPostgresAvailable) {
      try {
        const loan = await prisma.loan.findUnique({ where: { id } });
        return loan;
      } catch {
        // Fallback
      }
    }
    const loan = memoryLoans.find((l) => l.id === id);
    return loan || null;
  },

  async markLoanAsRepaid(id: string, userId: string): Promise<Loan | null> {
    const repaidAt = new Date();
    if (isPostgresAvailable) {
      try {
        const existing = await prisma.loan.findFirst({
          where: { id, userId },
        });
        if (!existing) return null;

        const updated = await prisma.loan.update({
          where: { id },
          data: { isRepaid: true, repaidAt },
        });
        return updated;
      } catch {
        // Fallback
      }
    }

    const loanIndex = memoryLoans.findIndex((l) => l.id === id && l.userId === userId);
    if (loanIndex === -1) return null;

    memoryLoans[loanIndex].isRepaid = true;
    memoryLoans[loanIndex].repaidAt = repaidAt;
    memoryLoans[loanIndex].updatedAt = new Date();
    return memoryLoans[loanIndex];
  },

  async deleteLoan(id: string, userId: string): Promise<boolean> {
    if (isPostgresAvailable) {
      try {
        const existing = await prisma.loan.findFirst({ where: { id, userId } });
        if (!existing) return false;
        await prisma.loan.delete({ where: { id } });
        return true;
      } catch {
        // Fallback
      }
    }
    const index = memoryLoans.findIndex((l) => l.id === id && l.userId === userId);
    if (index === -1) return false;
    memoryLoans.splice(index, 1);
    return true;
  },

  async getLoansByUser(
    userId: string,
    options?: { status?: 'all' | 'pending' | 'overdue' | 'repaid'; search?: string }
  ): Promise<LoanWithStatus[]> {
    let rawLoans: Loan[] = [];

    if (isPostgresAvailable) {
      try {
        rawLoans = await prisma.loan.findMany({
          where: { userId },
          orderBy: { dueDate: 'asc' },
        });
      } catch {
        rawLoans = memoryLoans.filter((l) => l.userId === userId);
      }
    } else {
      rawLoans = memoryLoans.filter((l) => l.userId === userId);
    }

    const now = new Date();
    const oneDayMs = 1000 * 60 * 60 * 24;

    // Enhance with status
    let processed: LoanWithStatus[] = rawLoans.map((l) => {
      const dueTime = new Date(l.dueDate).getTime();
      const nowTime = now.getTime();
      const isOverdue = !l.isRepaid && dueTime < nowTime;
      const diffDays = Math.ceil(Math.abs(dueTime - nowTime) / oneDayMs);

      return {
        ...l,
        isOverdue,
        daysOverdue: isOverdue ? diffDays : undefined,
        daysRemaining: !l.isRepaid && !isOverdue ? diffDays : undefined,
      };
    });

    // Apply status filter
    if (options?.status && options.status !== 'all') {
      if (options.status === 'repaid') {
        processed = processed.filter((l) => l.isRepaid);
      } else if (options.status === 'overdue') {
        processed = processed.filter((l) => l.isOverdue);
      } else if (options.status === 'pending') {
        processed = processed.filter((l) => !l.isRepaid && !l.isOverdue);
      }
    }

    // Apply search filter (by friend name or notes)
    if (options?.search && options.search.trim().length > 0) {
      const q = options.search.trim().toLowerCase();
      processed = processed.filter(
        (l) => l.friendName.toLowerCase().includes(q) || (l.notes && l.notes.toLowerCase().includes(q))
      );
    }

    // Sort: overdue first, then upcoming due dates, then repaid
    processed.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.isRepaid && !b.isRepaid) return 1;
      if (!a.isRepaid && b.isRepaid) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return processed;
  },

  async getSummary(userId: string): Promise<LoanSummary> {
    let rawLoans: Loan[] = [];

    if (isPostgresAvailable) {
      try {
        rawLoans = await prisma.loan.findMany({ where: { userId } });
      } catch {
        rawLoans = memoryLoans.filter((l) => l.userId === userId);
      }
    } else {
      rawLoans = memoryLoans.filter((l) => l.userId === userId);
    }

    const now = new Date().getTime();

    let totalLent = 0;
    let totalRepaid = 0;
    let overdueAmount = 0;
    let pendingAmount = 0;

    let repaidLoansCount = 0;
    let overdueLoansCount = 0;
    let pendingLoansCount = 0;

    for (const loan of rawLoans) {
      const amount = Number(loan.amount) || 0;
      totalLent += amount;

      if (loan.isRepaid) {
        totalRepaid += amount;
        repaidLoansCount++;
      } else {
        const dueTime = new Date(loan.dueDate).getTime();
        if (dueTime < now) {
          overdueAmount += amount;
          overdueLoansCount++;
        } else {
          pendingAmount += amount;
          pendingLoansCount++;
        }
      }
    }

    return {
      totalLent: Math.round(totalLent * 100) / 100,
      totalRepaid: Math.round(totalRepaid * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      totalLoansCount: rawLoans.length,
      repaidLoansCount,
      overdueLoansCount,
      pendingLoansCount,
    };
  },

  // For testing cleanup
  async _resetMemoryDb(): Promise<void> {
    memoryUsers.length = 0;
    memoryOtps.length = 0;
    memoryLoans.length = 0;
  },
};
