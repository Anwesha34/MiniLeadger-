import { dbService } from '../database/db.js';
import { generateMockOtp, logMockOtp } from '../utils/otp.js';

async function seed() {
  console.log('🌱 [MiniLedger] Seeding initial test data...');

  const demoPhone = '9876543210';
  let user = await dbService.findUserByPhone(demoPhone);
  if (!user) {
    user = await dbService.createUser(demoPhone, 'Harsh (Demo)');
  }

  // 1. Overdue loan 1: Lent to Rohan 15 days ago, due 5 days ago
  const overdueDate1 = new Date();
  overdueDate1.setDate(overdueDate1.getDate() - 5);
  await dbService.createLoan({
    userId: user.id,
    friendName: 'Rohan Sharma',
    amount: 3500,
    dueDate: overdueDate1,
    notes: 'Concert tickets for weekend music fest',
  });

  // 2. Overdue loan 2: Lent to Priya, due 2 days ago
  const overdueDate2 = new Date();
  overdueDate2.setDate(overdueDate2.getDate() - 2);
  await dbService.createLoan({
    userId: user.id,
    friendName: 'Priya Patel',
    amount: 1200,
    dueDate: overdueDate2,
    notes: 'Weekend dinner split & cabs',
  });

  // 3. Upcoming loan 1: Lent to Aman, due in 7 days
  const upcomingDate1 = new Date();
  upcomingDate1.setDate(upcomingDate1.getDate() + 7);
  await dbService.createLoan({
    userId: user.id,
    friendName: 'Aman Verma',
    amount: 5000,
    dueDate: upcomingDate1,
    notes: 'Advance for Airbnb booking',
  });

  // 4. Upcoming loan 2: Lent to Neha, due in 14 days
  const upcomingDate2 = new Date();
  upcomingDate2.setDate(upcomingDate2.getDate() + 14);
  await dbService.createLoan({
    userId: user.id,
    friendName: 'Neha Gupta',
    amount: 2000,
    dueDate: upcomingDate2,
    notes: 'Textbook purchase split',
  });

  // 5. Repaid loan: Lent to Vikram, already repaid
  const repaidLoan = await dbService.createLoan({
    userId: user.id,
    friendName: 'Vikram Singh',
    amount: 4000,
    dueDate: new Date(),
    notes: 'Gift contribution',
  });
  await dbService.markLoanAsRepaid(repaidLoan.id, user.id);

  // Generate an initial mock OTP
  const initialOtp = generateMockOtp();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await dbService.saveOtp(demoPhone, initialOtp, expiresAt);
  logMockOtp(demoPhone, initialOtp, expiresAt);

  console.log('✅ [MiniLedger] Seed completed successfully!');
  console.log(`👤 Demo User Phone: ${demoPhone}`);
  console.log(`🔑 Login OTP: ${initialOtp}`);
  console.log(`📊 Summary generated: 2 Overdue, 2 Pending, 1 Repaid.`);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
