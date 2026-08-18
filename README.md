# Cruise Booking System - Odysseus Solutions Assessment

[![Tech Stack](https://img.shields.io/badge/Tech%20Stack-React%20%7C%20Node.js%20%7C%20Express%20%7C%20Prisma%20%7C%20PostgreSQL-blue)](https://github.com)

A full-stack **Cruise Booking System** built for the **Odysseus Solutions Campus Placement Technical Assessment**.

---

## 📁 Repository Structure & Deliverables

```
Cruise Booking/
├── BusinessRequirements.md     # Deliverable 1: Requirements, Assumptions & Gaps
├── TechnicalApproach.md        # Deliverable 2: Architecture, Prisma Schema & Reconstructability Strategy
├── UnitTestCases.md            # Deliverable 3: Complete Unit & Integration Test Matrix
├── README.md                   # Setup & Execution Guide
├── client/                     # React Frontend Application (Vite + TS + Glassmorphism UI)
│   ├── src/
│   │   ├── components/         # CruiseCard, BookingWizardModal, BookingLookupModal, Header
│   │   ├── services/           # API Client Services
│   │   ├── types/              # Type Declarations
│   │   ├── App.tsx             # Main Catalog & Search Filters
│   │   └── index.css           # Custom Glassmorphism Styling
│   ├── package.json
│   └── vite.config.ts
└── server/                     # Node.js + Express + Prisma + PostgreSQL Backend REST API
    ├── prisma/
    │   ├── schema.prisma       # Prisma ORM Data Schema (UUIDs, Integer Cents, Relations)
    │   └── seed.ts             # Database Seeder (5 Cruises, 4 Promo Codes, Pricing Rules)
    ├── src/
    │   ├── config/             # DB Connection (PostgreSQL + Automatic Memory Fallback Engine)
    │   ├── controllers/        # Cruise, Pricing & Booking Controllers
    │   ├── middleware/         # Zod Request Validation Middleware
    │   ├── routes/             # REST API Routes
    │   ├── services/           # Dynamic Pricing Engine & Transactional Booking Service
    │   ├── test/               # Vitest + Supertest API Integration Suite
    │   ├── types/              # Domain Types & Interfaces
    │   ├── validations/        # Zod Request Schemas
    │   └── index.ts            # Server Entry Point
    ├── prisma.config.ts        # Prisma 7 Configuration
    ├── package.json
    ├── tsconfig.json
    └── .env.example
```

---

## ⚡ Key Architecture & Assessment Features

1. **Prisma ORM & PostgreSQL**:
   - Single source of truth for database schema definitions ([schema.prisma](file:///c:/Users/visaveliya%20yagnik/Desktop/Cruise%20Booking/server/prisma/schema.prisma)).
   - Clean migrations and type-safe database queries.

2. **Data-Driven Configuration Engine (Requirement 10)**:
   - Base fares, child age bands (0-4: Free, 5-11: 50%, 12-17: 25%), group discount tiers (3-4: 5%, 5-6: 10%), optional services, tax rate (12%), and promotional codes are stored in database tables.
   - Changing rules in the database updates pricing behavior instantly **without code changes or redeployments**.

3. **Immutable Price Reconstruction (Requirement 8)**:
   - Every confirmed booking saves a complete frozen snapshot of base fares, discounts, optional add-ons, promo code value, tax rate, and total charged in integer cents.
   - Querying `GET /api/bookings/:reference` reconstructs the historic line-item invoice verbatim.

4. **Concurrency & Capacity Guard (Requirements 5 & 6)**:
   - Database-level atomic transactions prevent overbooking (`capacity_left >= required_seats`) and enforce promotional usage limits.

5. **Zod Validation & Vitest Testing**:
   - Runtime request payload validation via Zod middleware.
   - Automated API integration test suite using Vitest + Supertest.

---

## 🚀 Quick Setup & Execution

### 1. Backend API Setup (`server/`)

```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Run Prisma migrations & push schema to database
npx prisma db push

# Seed database with assessment data
npm run db:seed

# Run Vitest API test suite
npm run test

# Run backend development server (Port 5000)
npm run dev
```

### 2. Frontend React Client (`client/`)

```bash
# In a new terminal, navigate to client folder
cd client

# Install dependencies
npm install

# Start Vite React development server (Port 3000)
npm run dev
```

Open your browser to **`http://localhost:3000`**.
