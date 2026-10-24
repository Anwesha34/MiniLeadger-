import { Router } from 'express';
import {
  loanController,
  createLoanSchema,
} from '../controllers/loan.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadReceiptMiddleware } from '../utils/upload.js';

const router = Router();

// All loan routes require authentication
router.use(authenticate);

// Financial summary endpoint (Must be defined before /:id routes)
router.get('/summary', loanController.getSummary);

// Loan CRUD
router.get('/', loanController.getLoans);
router.post('/', validate(createLoanSchema), loanController.createLoan);
router.patch('/:id/repay', loanController.markAsRepaid);
router.delete('/:id', loanController.deleteLoan);

// Bonus: Upload receipt photo
router.post(
  '/upload-receipt',
  uploadReceiptMiddleware.single('receipt'),
  loanController.uploadReceipt
);

export default router;
