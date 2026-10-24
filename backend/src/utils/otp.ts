import crypto from 'crypto';

/**
 * Generates a 6-digit numeric OTP.
 */
export function generateMockOtp(): string {
  // 6-digit cryptographically secure random number between 100000 and 999999
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

/**
 * Prints the mock OTP conspicuously in the server console for testing/reviewing.
 */
export function logMockOtp(phone: string, otp: string, expiresAt: Date): void {
  const line = '═'.repeat(60);
  console.log('\n' + line);
  console.log(' 📱 [MINILEDGER MOCK OTP SERVICE]');
  console.log(` Target Phone:   ${phone}`);
  console.log(` Verification Code: \x1b[1m\x1b[32m${otp}\x1b[0m  <-- (Use this OTP to login)`);
  console.log(` Valid Until:    ${expiresAt.toLocaleTimeString()} (${expiresAt.toISOString()})`);
  console.log(line + '\n');
}
