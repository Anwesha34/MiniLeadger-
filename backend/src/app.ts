import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes.js';
import loanRoutes from './routes/loan.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Application {
  const app: Application = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from uploads folder
  const uploadsDir = path.resolve(__dirname, '../../uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Healthcheck & Welcome API
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      app: 'MiniLedger Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/loans', loanRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'API route not found.',
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
