import { createApp } from './app.js';
import { config } from './config/env.js';
import { initializeDatabase } from './database/db.js';

async function bootstrap() {
  // Initialize Database (attempts PostgreSQL connection, falls back seamlessly if unreachable)
  await initializeDatabase();

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`\n🚀 [MiniLedger API Server] Running on http://localhost:${config.port}`);
    console.log(`📡 Healthcheck: http://localhost:${config.port}/api/health`);
    console.log(`🔐 Environment: ${config.nodeEnv}`);
    console.log(`✨ Mock OTP Service ready (OTPs will print directly in this log)\n`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
