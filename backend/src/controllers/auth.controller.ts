import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { dbService } from '../database/db.js';
import { generateMockOtp, logMockOtp } from '../utils/otp.js';

// Request Validation Schemas
export const sendOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long')
    .regex(/^\+?[0-9\s-]+$/, 'Invalid phone number format'),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number is too long'),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^[0-9]{6}$/, 'OTP must be numeric'),
  name: z.string().trim().optional(),
});

export const authController = {
  /**
   * Request a mock OTP for phone number login
   */
  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone } = req.body;
      const cleanPhone = phone.replace(/\s+/g, '');

      // Generate 6-digit OTP
      const otp = generateMockOtp();
      const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

      // Save OTP record
      await dbService.saveOtp(cleanPhone, otp, expiresAt);

      // Conspicuously print OTP in server logs as required
      logMockOtp(cleanPhone, otp, expiresAt);

      res.status(200).json({
        success: true,
        message: `Mock OTP generated and printed to server logs. Valid for ${config.otpExpiryMinutes} minutes.`,
        data: {
          phone: cleanPhone,
          expiresInMinutes: config.otpExpiryMinutes,
          // Included for convenience during local testing & development
          devMockOtp: config.nodeEnv !== 'production' ? otp : undefined,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify mock OTP and login / register user
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, otp, name } = req.body;
      const cleanPhone = phone.replace(/\s+/g, '');

      const isValid = await dbService.verifyAndConsumeOtp(cleanPhone, otp);

      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP. Please check the server logs and try again.',
        });
        return;
      }

      // Find or create user
      let user = await dbService.findUserByPhone(cleanPhone);
      if (!user) {
        user = await dbService.createUser(cleanPhone, name);
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, phone: user.phone },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current authenticated user profile
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const user = await dbService.findUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },
};
