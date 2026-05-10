# Quick Start Guide

## Phase 0: Foundation ✅ COMPLETE

The monorepo scaffold is ready. Here's how to get everything running:

### Prerequisites

- **Node.js 20+** — [Install](https://nodejs.org/)
- **PostgreSQL 15+** — [Install](https://www.postgresql.org/download/) or use Docker:
  ```bash
  docker run --name str-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=str_compliance_dev -p 5432:5432 -d postgres:15
  ```

### 1. Install Dependencies

```bash
npm install
```

This installs dependencies for all apps and packages via Turborepo.

### 2. Set Up Database

```bash
# Create tables and enums
npm run db:migrate

# Seed with realistic mock data
npm run db:seed
```

You now have:
- 1 tenant (Gwinnett County)
- 5 admin users
- 10 STR owner users
- 10 properties
- 10 applications (various statuses)
- 5 licenses
- 50 mock external listings
- 20 audit log entries

**Browse the database:**
```bash
npm run db:studio
```

This opens Drizzle Studio at `http://localhost:5555` — a visual database browser.

### 3. Start Development Servers

```bash
npm run dev
```

This starts all three services in parallel:

- **Public Portal**: http://localhost:3000
- **Admin Console**: http://localhost:3003
- **API Server**: http://localhost:3004

### 4. Verify Everything Works

✅ Open http://localhost:3000 — You should see the landing page  
✅ Open http://localhost:3003 — You should see the admin dashboard  
✅ Open http://localhost:3004/health — You should get `{"status":"ok"}`

## Project Structure

```
str-compliance-platform/
├── apps/
│   ├── public-portal/          # Next.js (port 3000)
│   ├── admin-console/          # Next.js (port 3003)
│   └── api/                    # Hono (port 3004)
├── packages/
│   ├── db/                     # Drizzle ORM + schema
│   ├── shared-types/           # Zod + TypeScript types
│   ├── ui/                     # shadcn/ui components
│   ├── auth/                   # JWT utilities
│   ├── email-templates/        # React Email
│   └── mock-data/              # Seed generators
├── .env.local                  # Dev environment
├── turbo.json                  # Monorepo config
└── package.json                # Root scripts
```

## Common Commands

```bash
# Development
npm run dev              # Start all services
npm run type-check      # Check TypeScript
npm run lint            # Run ESLint

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed mock data
npm run db:studio       # Open Drizzle Studio
npm run db:reset        # ⚠️ Drop all tables

# Building
npm run build           # Build all packages
```

## Next Steps (Phase 1)

Week 1-3: Build the Public Portal

- [ ] Register/login flows
- [ ] Property management pages
- [ ] 9-step application wizard
- [ ] Document upload to S3 (mock)
- [ ] Stripe payment integration
- [ ] Email notifications via SES (mock)

## Troubleshooting

**"Cannot find module '@repo/db'"**
→ Make sure you ran `npm install` from the root

**"Connection refused" on port 5432**
→ Start PostgreSQL or the Docker container (see above)

**"Next.js build failing"**
→ Run `npm run type-check` to see TypeScript errors

**Changes not showing up**
→ Turborepo caches builds. Run `npm run build --force` to rebuild

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full system design.

## Demo Script

Once Phase 1-3 are complete, see [docs/demo-script.md](docs/demo-script.md) for the 15-minute walkthrough.

---

**Status:** Phase 0 complete. Ready for Phase 1 (Public Portal builds).  
**Time to complete Phase 1:** 2-3 weeks  
**Team size:** 3.5 FTE (1 tech lead, 2 full-stack, 0.5 DevOps)
