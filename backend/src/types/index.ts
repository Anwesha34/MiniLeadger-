export interface User {
  id: string;
  phone: string;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: string;
  userId: string;
  friendName: string;
  amount: number;
  dueDate: Date;
  notes?: string | null;
  receiptUrl?: string | null;
  isRepaid: boolean;
  repaidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanWithStatus extends Loan {
  isOverdue: boolean;
  daysOverdue?: number;
  daysRemaining?: number;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  pendingAmount: number;
  totalLoansCount: number;
  repaidLoansCount: number;
  overdueLoansCount: number;
  pendingLoansCount: number;
}

export interface JwtPayload {
  userId: string;
  phone: string;
}
