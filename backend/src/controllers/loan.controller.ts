import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { dbService } from '../database/db.js';
import { config } from '../config/env.js';

// Validation Schemas
export const createLoanSchema = z.object({
  friendName: z
    .string()
    .trim()
    .min(2, 'Friend name must be at least 2 characters')
    .max(100, 'Friend name is too long'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a valid number' })
    .positive('Amount must be greater than 0')
    .max(100000000, 'Amount is exceeds maximum limit'),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Due date must be a valid ISO date string (YYYY-MM-DD)',
    }),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
  receiptUrl: z.string().url('Receipt URL must be a valid URL').optional().nullable(),
});

export const loanController = {
  /**
   * Add a new loan entry
   * POST /api/loans
   */
  async createLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { friendName, amount, dueDate, notes, receiptUrl } = req.body;

      const loan = await dbService.createLoan({
        userId,
        friendName,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        notes: notes || null,
        receiptUrl: receiptUrl || null,
      });

      res.status(201).json({
        success: true,
        message: 'Loan entry created successfully.',
        data: { loan },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all loan entries for the current user
   * GET /api/loans?status=all|pending|overdue|repaid&search=query
   */
  async getLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const status = req.query.status as 'all' | 'pending' | 'overdue' | 'repaid' | undefined;
      const search = req.query.search as string | undefined;

      const loans = await dbService.getLoansByUser(userId, { status, search });

      res.status(200).json({
        success: true,
        count: loans.length,
        data: { loans },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark a loan entry as repaid
   * PATCH /api/loans/:id/repay
   */
  async markAsRepaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const loan = await dbService.findLoanById(id);
      if (!loan) {
        res.status(404).json({
          success: false,
          message: 'Loan entry not found.',
        });
        return;
      }

      if (loan.userId !== userId) {
        res.status(403).json({
          success: false,
          message: 'You are not authorized to modify this loan entry.',
        });
        return;
      }

      if (loan.isRepaid) {
        res.status(400).json({
          success: false,
          message: 'This loan entry is already marked as repaid.',
          data: { loan },
        });
        return;
      }

      const updated = await dbService.markLoanAsRepaid(id, userId);

      res.status(200).json({
        success: true,
        message: 'Loan marked as repaid successfully.',
        data: { loan: updated },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Return financial summary: total lent, total repaid, overdue amount
   * GET /api/loans/summary
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const summary = await dbService.getSummary(userId);

      res.status(200).json({
        success: true,
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a loan entry
   * DELETE /api/loans/:id
   */
  async deleteLoan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const deleted = await dbService.deleteLoan(id, userId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Loan entry not found or you are not authorized to delete it.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Loan entry deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload a photo of receipt (Bonus feature)
   * POST /api/loans/upload-receipt
   */
  async uploadReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No image file uploaded. Please upload a receipt photo.',
        });
        return;
      }

      const fileUrl = `${config.appBaseUrl}/uploads/${req.file.filename}`;

      res.status(200).json({
        success: true,
        message: 'Receipt uploaded successfully.',
        data: {
          filename: req.file.filename,
          url: fileUrl,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
