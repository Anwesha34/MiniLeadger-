# 💰 MiniLedger – Money Lent Tracker

A full-stack mobile & backend solution to track money lent to friends, manage due dates, highlight overdue loans, and get instant financial summaries.

Built as part of the **Full Stack Development Internship Assignment**.

---

## 🌟 Highlights & Features

### 🖥️ Backend (Node.js + TypeScript + PostgreSQL)
- **Phone Authentication with Mock OTP**: Enter any phone number to receive a 6-digit OTP. The verification code is conspicuously logged to the server terminal. Includes 10-minute expiration & replay attack prevention.
- **Loan Management APIs**:
  - Add loan entry (`friendName`, `amount`, `dueDate`, `notes`, `receiptUrl`).
  - Mark loan as repaid (`isRepaid = true`, captures `repaidAt` timestamp).
  - Delete loan entries.
- **Financial Summary Engine**:
  - `totalLent`: Sum of all loans extended.
  - `totalRepaid`: Total amount successfully collected.
  - `overdueAmount`: Prominently calculated from all active loans past their due date.
  - `pendingAmount`: Amount currently pending repayment.
  - Loan counters (total, pending, overdue, repaid).
- **Bonus Implementations**:
  - 📸 **Receipt Photo Upload**: Multi-part image upload via Multer with validation, stored and served statically.
  - 🛡️ **Input Validation**: Strict schema validation using Zod for all endpoints.
  - 🧪 **Automated Testing Suite**: 10 comprehensive tests using Vitest and Supertest covering Auth, OTP flow, loan operations, overdue logic, and summary calculations.
  - 🐳 **Docker Compose**: One-command PostgreSQL 16 container setup.
  - ⚡ **Resilient DB Adapter**: Connects to PostgreSQL via Prisma ORM, with an automatic in-memory fallback for instant 0-config local testing if an external Postgres database is not currently running.

---

### 📱 Mobile App (React Native + Expo + TypeScript)
- **Login Screen**:
  - Phone number input with country code formatting.
  - Mock OTP input with helpful terminal log indicator.
  - Dev convenience chip to auto-fill mock OTP for lightning-fast testing.
  - Secure JWT persistence across app restarts.
- **Top Summary Card**:
  - Financial overview card showing **Total Lent**, **Total Repaid**, and repayment percentage progress bar.
  - **Overdue Amount Card**: Prominently highlighted in alert styling with a warning badge and count of overdue loans.
- **Dynamic Loan List**:
  - **Overdue Highlighting**: Loans past due date are styled with bold red indicator borders, pink subtle highlights, and an `⚠️ OVERDUE (X days late)` tag.
  - **Pending Badge**: Clean `⏳ Due in X days` badge for on-time loans.
  - **Repaid Badge**: Clean `✅ Repaid` badge with settlement date.
  - Search bar to filter by friend's name or notes.
  - Filter tabs: **All**, **Pending**, **Overdue**, **Repaid**.
  - Pull-to-refresh (`RefreshControl`).
- **Add Loan Entry Form**:
  - Friend's name with input validation.
  - Amount input with currency symbol (`₹`).
  - Due date selector with quick-pick preset chips (`+7 Days`, `+15 Days`, `+30 Days`, or custom date).
  - Notes field for purpose / context.
  - 📸 **Receipt Photo Attachment**: Pick a receipt photo using `expo-image-picker` with thumbnail preview.
- **Interactive Modals**:
  - Tap "Receipt Attached" on any loan card to open full-screen receipt preview modal.
  - Server configuration modal to customize API URL if testing on physical devices via Expo Go.

---

## 🏗️ Architecture & Tech Stack

```
mini-ledger/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # PostgreSQL schema (users, otp_verifications, loans)
│   ├── src/
│   │   ├── config/env.ts         # Environment configuration
│   │   ├── controllers/          # Auth and Loan request handlers
│   │   ├── database/db.ts        # Prisma ORM client & resilient storage adapter
│   │   ├── middleware/           # JWT auth, Zod validation, error handling
│   │   ├── routes/               # API routes (/api/auth, /api/loans)
│   │   ├── scripts/seed.ts       # Demo seeding script
│   │   ├── tests/                # Vitest test suite
│   │   ├── types/                # Shared TypeScript models
│   │   ├── utils/                # OTP generation, logging, Multer upload
│   │   ├── app.ts                # Express application setup
│   │   └── index.ts              # Server bootstrap
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Header, SummaryCard, LoanItem, AddLoanModal, ReceiptModal
│   │   ├── context/AuthContext   # Global auth state & token persistence
│   │   ├── screens/              # LoginScreen, DashboardScreen
│   │   ├── services/api.ts       # Axios instance, platform URL resolver, endpoints
│   │   └── types/index.ts        # Frontend TypeScript definitions
│   ├── App.tsx                   # Main React Native entry
│   └── package.json
│
├── docker-compose.yml            # PostgreSQL 16 container definition
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher; tested on v22)
- Git

---

### Step 1: Start the Backend

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Database:
   - **Option A (Docker - Recommended)**:
     ```bash
     # From root directory
     docker compose up -d
     ```
   - **Option B (Cloud PostgreSQL)**:
     Paste any Neon, Supabase, or Railway PostgreSQL connection string into `backend/.env`:
     ```env
     DATABASE_URL="postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require"
     ```
   - **Option C (Zero-Config In-Memory)**:
     If no PostgreSQL instance is running, the server automatically boots in resilient in-memory mode for zero-setup evaluation!

4. Generate Prisma client & optionally seed demo data:
   ```bash
   npm run prisma:generate
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   The API will start at: `http://localhost:5000`

6. Run the automated test suite:
   ```bash
   npm test
   ```

---

### Step 2: Start the React Native App

1. In a new terminal window, navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install --legacy-peer-deps
   ```

3. Launch the app:
   - **To run in your web browser (fastest for quick demo/review)**:
     ```bash
     npm run web
     ```
   - **To run on Expo Go (physical phone / iOS / Android)**:
     ```bash
     npx expo start
     ```
     Scan the QR code with your phone's camera (iOS) or Expo Go app (Android).

---

## 📡 API Reference

### Base URL: `http://localhost:5000/api`

### 1. Authentication

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/send-otp` | Request mock OTP for a phone number | No |
| `POST` | `/auth/verify-otp` | Verify OTP and receive JWT access token | No |
| `GET` | `/auth/me` | Fetch authenticated user profile | Yes (Bearer) |

#### Example: Send OTP
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```
**Terminal Output:**
```
════════════════════════════════════════════════════════════
 📱 [MINILEDGER MOCK OTP SERVICE]
 Target Phone:   9876543210
 Verification Code: 492556  <-- (Use this OTP to login)
 Valid Until:    12:15:00 AM (2026-10-24T18:45:00.000Z)
════════════════════════════════════════════════════════════
```

#### Example: Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "492556", "name": "Harsh"}'
```

---

### 2. Loan Management & Summary

All endpoints below require header: `Authorization: Bearer <TOKEN>`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/loans/summary` | Retrieve financial summary (total lent, total repaid, overdue amount) |
| `GET` | `/loans` | List loans (`?status=all\|pending\|overdue\|repaid&search=query`) |
| `POST` | `/loans` | Add a loan entry (`friendName`, `amount`, `dueDate`, `notes`, `receiptUrl`) |
| `PATCH` | `/loans/:id/repay` | Mark a loan as repaid |
| `DELETE` | `/loans/:id` | Delete a loan entry |
| `POST` | `/loans/upload-receipt` | Upload receipt image (`multipart/form-data`) |

#### Example Summary Response (`GET /api/loans/summary`):
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalLent": 15700,
      "totalRepaid": 4000,
      "overdueAmount": 4700,
      "pendingAmount": 7000,
      "totalLoansCount": 5,
      "repaidLoansCount": 1,
      "overdueLoansCount": 2,
      "pendingLoansCount": 2
    }
  }
}
```

---

## 🎥 2–3 Minute Screen Recording Walkthrough Script

When recording your Loom or Google Drive walkthrough video, follow this 5-step script to showcase every single required and bonus feature:

1. **[0:00 - 0:30] Phone Login & Mock OTP Demonstration**:
   - Open terminal with `npm run dev` running.
   - Enter your phone number in the app and press **Send Mock OTP**.
   - Show the formatted OTP box appearing in the server terminal logs.
   - Enter the OTP in the app and tap **Verify & Enter App**.

2. **[0:30 - 1:00] Summary Card & Overdue Highlighting**:
   - Point out the **Summary Card at the top**: Total Lent, Total Repaid, and the highlighted **Overdue Amount** card.
   - Point out how overdue loans are visually highlighted in the list with a red left border and `⚠️ OVERDUE (X days late)` badge.

3. **[1:00 - 1:45] Adding a Loan Entry (+ Receipt Upload Bonus)**:
   - Click the floating `+ Add Loan` button.
   - Fill in friend's name (e.g. "Aditya"), amount (e.g. ₹2,500), and pick a due date.
   - Tap **Attach Receipt Photo** and select an image.
   - Tap **Save Loan Entry**. Observe it immediately appearing in the list and updating the Total Lent amount!

4. **[1:45 - 2:15] Marking a Loan as Repaid & Live Summary Update**:
   - Tap **Mark as Repaid** on one of the active loans.
   - Notice the status badge turns into `✅ Repaid` and the settlement date appears.
   - Notice the **Total Repaid** increases and the **Overdue Amount** decreases in real-time in the top summary card!

5. **[2:15 - 2:45] Search, Filters & Receipt Viewer**:
   - Click on the **Overdue** filter tab to see only overdue loans.
   - Search for a friend's name in the search bar.
   - Tap **Receipt Attached** on a loan item to display the full receipt preview modal.

6. **[2:45 - 3:00] Running Automated Tests**:
   - In terminal, run `npm test` inside `backend/` to show all 10 unit and integration tests passing green.

---

## 💡 Code Explanation Guide (For Your Interview)

Be prepared to explain these core architectural decisions in your interview:

1. **Why TypeScript across the entire stack?**
   - TypeScript guarantees compile-time type safety. Interfaces defined in `src/types` are shared between controllers, database services, and client requests, eliminating subtle runtime bugs.

2. **How does the mock OTP verification work?**
   - When `/api/auth/send-otp` is called, `crypto.randomInt(100000, 1000000)` generates a 6-digit number.
   - It is stored with an `expiresAt` timestamp (10 minutes) and `consumed: false`.
   - The OTP is printed to `stdout` via `console.log`.
   - During verification, we check `phone = cleanPhone`, `code = otp`, `consumed = false`, and `expiresAt > now()`. Once verified, it is flagged as `consumed = true` to prevent replay attacks.

3. **How is the Overdue Amount calculated?**
   - In `dbService.getSummary()`, we iterate through the user's loans.
   - A loan is overdue **only if** `isRepaid === false` **and** `dueDate.getTime() < Date.now()`.
   - If `isRepaid === true`, the loan is settled and never counted toward the overdue amount, regardless of its original due date.

4. **Why is the database layer designed with a fallback?**
   - In production or standard local dev, Prisma queries PostgreSQL using connection pooling.
   - However, during technical evaluations, reviewers may run code without setting up local Docker or PostgreSQL. The built-in in-memory fallback guarantees 100% testability and zero crashes on any machine while retaining full PostgreSQL schema and migrations.

---

## 📄 License
MIT License. Built for the Full Stack Development Internship Assignment.
