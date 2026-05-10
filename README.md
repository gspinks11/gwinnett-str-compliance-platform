# Sentinel STR — Short-Term Rental Licensing & Compliance Platform

A production-ready SaaS platform for government licensing and compliance monitoring of short-term rentals, built as an MVP demo for the Gwinnett County RFP RP013-26.

## 🎯 Overview

**Three Core User Experiences:**

1. **Public Portal** — STR owners apply for and renew licenses online
2. **Admin Console** — County staff review applications, issue licenses, manage compliance
3. **Monitoring Dashboard** — Map-based view of licensed/unlicensed STRs with analytics

**Technology Stack:**

- Frontend: Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Backend: Hono (Lambda-optimized) + Node.js 20
- Database: PostgreSQL (local dev) + Drizzle ORM
- Auth: JWT-based mock Cognito (local) + AWS Cognito (production)
- Payments: Stripe (test mode)
- Storage: S3 mock (local) + AWS S3 (production)
- Maps: Amazon Location Service (mock URLs in dev)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker (optional, for PostgreSQL)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Initialize database
npm run db:migrate
npm run db:seed

# Start development environment
npm run dev
```

The dev environment will start:
- **Public Portal**: http://localhost:3000
- **Admin Console**: http://localhost:3003
- **API**: http://localhost:3004

## 📁 Project Structure

```
str-compliance-platform/
├── apps/
│   ├── public-portal/          # Next.js app for STR owners
│   ├── admin-console/          # Next.js app for county staff
│   └── api/                    # Hono API server
├── packages/
│   ├── db/                     # Drizzle schema + migrations
│   ├── shared-types/           # Zod schemas + TypeScript types
│   ├── ui/                     # Shared shadcn components
│   ├── auth/                   # JWT auth utilities
│   ├── email-templates/        # React Email templates
│   └── mock-data/              # Seed data generators
├── infrastructure/
│   └── cdk/                    # AWS CDK stacks (for AWS deployment)
└── docs/
    ├── architecture.md
    ├── data-model.md
    ├── api-spec.md
    └── demo-script.md
```

## 🔄 Development Workflow

### Local Development

```bash
# Start all services
npm run dev

# Run database migrations
npm run db:migrate

# Seed with mock data
npm run db:seed

# Type check everything
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test
```

### Database Management

```bash
# Start Drizzle Studio (visual DB browser)
npm run db:studio

# Create a new migration after schema changes
npm run db:generate-migration

# Reset database (⚠️ local dev only)
npm run db:reset
```

## 🏗️ Architecture

### Three-Phase Build

**Phase 1 (Weeks 1-3): Public Portal (60% depth)**
- Registration & login
- Property management
- 9-step application wizard
- Document upload
- Stripe payment integration
- Email notifications

**Phase 2 (Weeks 4-5): Admin Console (30% depth)**
- Dashboard with KPIs
- Application review queue
- License management
- Monthly reporting

**Phase 3 (Week 5-6): Monitoring Dashboard (10% depth)**
- Map view with licensed/unlicensed pins
- Mock external listings data
- Address matching interface

## 📊 Data Model

See [docs/data-model.md](docs/data-model.md) for the complete ER diagram and table descriptions.

### Key Entities

- `tenants` — Multi-tenancy support (each county = tenant)
- `users` — STR owners
- `admin_users` — County staff
- `properties` — Rental properties
- `applications` — License application lifecycle
- `licenses` — Issued STR licenses
- `external_listings` — Mock Airbnb/VRBO data
- `audit_logs` — Immutable audit trail

## 🔐 Security

- JWT-based auth (local) → AWS Cognito (production)
- Tenant isolation on every query
- Presigned S3 URLs (documents)
- Stripe tokenization (no card data stored)
- Audit logging for all state changes
- WCAG 2.1 AA accessibility

## 📝 API Documentation

See [docs/api-spec.md](docs/api-spec.md) for the full OpenAPI specification.

### Sample Endpoints

**Public Portal:**
```
POST   /api/v1/public/auth/register
GET    /api/v1/public/me
POST   /api/v1/public/applications
POST   /api/v1/public/payments/create-intent
```

**Admin Console:**
```
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/applications
POST   /api/v1/admin/applications/:id/approve
GET    /api/v1/admin/monitoring/listings
```

## 🎨 Design System

Shared UI components in `packages/ui/` based on shadcn/ui and Tailwind CSS.

- Button, Card, Dialog, Form
- DataTable with sorting/filtering
- Wizard/Stepper component
- Map integration
- File upload dropzone

## 🧪 Testing

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🚢 Deployment

### Local/Docker

```bash
# Build all packages
npm run build

# Run with Docker Compose (coming soon)
docker-compose up
```

### AWS

See [docs/deployment.md](docs/deployment.md) for CDK deployment instructions.

For fast beta hosting (pre-award MVP), use Amplify runbook:

- [docs/deployment.md](docs/deployment.md)
- [amplify/admin-console-amplify.yml](amplify/admin-console-amplify.yml)
- [amplify/public-portal-amplify.yml](amplify/public-portal-amplify.yml)

## 🔗 Key Documentation

- [Architecture & System Design](docs/architecture.md)
- [Data Model & Schema](docs/data-model.md)
- [API Specification](docs/api-spec.md)
- [Demo Script (15-minute walkthrough)](docs/demo-script.md)
- [Security & Compliance](docs/security.md)
- [Deployment Guide](docs/deployment.md)

## 📋 Demo Walkthrough

The platform supports a full 15-minute demo covering:

1. **Public Portal (5 min)** — Register & submit application end-to-end
2. **Admin Console (5 min)** — Review, approve, issue license
3. **Monitoring (3 min)** — Map view & compliance analytics
4. **Reporting (2 min)** — Monthly reports & SLA metrics

See [docs/demo-script.md](docs/demo-script.md) for the full script.

## ⚠️ Demo Environment Disclaimer

This platform uses **synthetic mock data** for the monitoring dashboard to demonstrate functionality without real scraping. The data is marked as mock in the database (`is_mock_data: true`) and is clearly labeled in the admin UI.

Production deployment would integrate with licensed data providers (AirDNA, Deckard) or partnered STR platform APIs.

See [docs/ethical-disclosure.md](docs/ethical-disclosure.md) for details.

## 🛣️ Roadmap

Out of scope for MVP but planned for future iterations:

- [ ] Real SAML/OIDC federation with Active Directory
- [ ] ClamAV virus scanning
- [ ] Amazon Connect call center integration
- [ ] ML-based address matching (SageMaker)
- [ ] Multi-region active-active
- [ ] SOC 2 Type II compliance audit

## 📧 Support

For questions or issues during development, see [docs/operations.md](docs/operations.md) for runbooks and troubleshooting.

---

**Codename:** Sentinel STR  
**Status:** MVP (6-week build)  
**Target:** Gwinnett County RFP RP013-26  
**Team Size:** 3.5 FTE  
**Est. Cost:** $90-120/month AWS (demo environment)
