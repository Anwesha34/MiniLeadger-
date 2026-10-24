import { Router } from 'express';
import {
  authController,
  sendOtpSchema,
  verifyOtpSchema,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);

// Protected routes
router.get('/me', authenticate, authController.getMe);

export default router;
