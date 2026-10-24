export interface User {
  id: string;
  phone: string;
  name?: string | null;
  createdAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  friendName: string;
  amount: number;
  dueDate: string;
  notes?: string | null;
  receiptUrl?: string | null;
  isRepaid: boolean;
  repaidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
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

export type LoanFilter = 'all' | 'pending' | 'overdue' | 'repaid';
