# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Citizen/Owner                             │
│                                                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │  Public Portal (Next.js)             │
        │  - Apply for license                 │
        │  - Manage properties                 │
        │  - Upload documents                  │
        │  - Track applications                │
        └──────────────┬──────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │  API (Hono)                          │
        │  - Auth                              │
        │  - Applications                      │
        │  - Licenses                          │
        │  - Payments                          │
        │  - Documents                         │
        └──────────────┬──────────────────────┘
                       │
        ┌──────────────┴────────────────────┐
        │                                   │
        ▼                                   ▼
   ┌─────────────┐                  ┌──────────────┐
   │ PostgreSQL  │                  │ S3 Bucket    │
   │ - Users     │                  │ - Documents  │
   │ - Apps      │                  │ - Assets     │
   │ - Licenses  │                  │              │
   └─────────────┘                  └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    County Staff                              │
│                                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Admin Console (Next.js)         │
        │ - Review queue                  │
        │ - Approve/deny                  │
        │ - License management            │
        │ - Monitoring map                │
        │ - Reports                       │
        └────────────────────────────────┘
```

## Technical Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 + TypeScript | Fast iteration, full-stack TypeScript |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI development, accessible components |
| State | Zustand + TanStack Query | Lightweight, no Redux boilerplate |
| Backend | Hono + Node.js 20 | Lambda-optimized, minimal overhead |
| Database | PostgreSQL + Drizzle | Type-safe, migrations-first approach |
| Auth | JWT (local) → Cognito (prod) | Flexible for demo and production |
| Payments | Stripe (test mode) | PCI-DSS compliant, no card storage |
| Storage | S3 mock (local) → AWS S3 (prod) | Secure document storage |
| Monorepo | Turborepo | Fast builds, shared packages |

## Data Flow: Application Submission

```
1. Owner fills application wizard (Public Portal)
   ↓
2. Attachments uploaded to S3 (presigned URL)
   ↓
3. Submit button triggers POST /api/v1/public/applications/:id/submit
   ↓
4. API validates, stores in PostgreSQL, creates audit log
   ↓
5. Stripe payment flow (test mode)
   ↓
6. Payment webhook updates application.paymentId
   ↓
7. Step Functions orchestration begins:
   - Auto-validate (pass/fail)
   - If info needed: notify owner
   - If approved: start license issuance workflow
   ↓
8. Admin notified via email
   ↓
9. Admin Console shows in review queue
   ↓
10. Admin reviews, approves/denies
    ↓
11. System generates license, sends confirmation
    ↓
12. Owner sees license in Public Portal
```

## Data Model

### Core Entities

```
tenants (1) ──┬─→ (N) users
              ├─→ (N) admin_users
              ├─→ (N) properties
              │        └─→ (N) applications
              │                 ├─→ (1) licenses
              │                 ├─→ (N) documents
              │                 ├─→ (1) payments
              │                 └─→ (N) communications
              │
              ├─→ (N) external_listings (mock)
              │        └─→ (N) outreach_attempts
              │
              └─→ (N) audit_logs
```

### Multi-Tenancy

Every table has `tenant_id` foreign key:
```sql
SELECT * FROM applications 
WHERE tenant_id = 'tenant-gwinnett' 
  AND user_id = 'user-123'
```

This enforces tenant isolation at the application layer.

## Authentication Flow

### Public (STR Owners)

```
Register
  ↓
[JWT with sub, email, tenant_id, userType=owner]
  ↓
Stored in localStorage
  ↓
Sent in Authorization: Bearer <token> header
  ↓
API validates signature + checks tenant_id
  ↓
Request proceeds or 401 Unauthorized
```

### Admin (County Staff)

```
Admin-created user in Cognito
  ↓
MFA required
  ↓
[JWT with sub, email, tenant_id, userType=admin, role=admin|reviewer|director|readonly]
  ↓
API enforces role-based access
  ↓
RBAC middleware checks route permissions
```

## API Structure

### Public Portal Routes

```
POST   /api/v1/public/auth/register
POST   /api/v1/public/auth/login
POST   /api/v1/public/auth/forgot-password

GET    /api/v1/public/me
PATCH  /api/v1/public/me

POST   /api/v1/public/properties
GET    /api/v1/public/properties/:id
PATCH  /api/v1/public/properties/:id

POST   /api/v1/public/applications
GET    /api/v1/public/applications/:id
PATCH  /api/v1/public/applications/:id
POST   /api/v1/public/applications/:id/submit
POST   /api/v1/public/applications/:id/resubmit

POST   /api/v1/public/documents/upload-url
POST   /api/v1/public/documents/confirm

GET    /api/v1/public/licenses
GET    /api/v1/public/licenses/:id/certificate

POST   /api/v1/public/payments/create-intent
POST   /api/v1/public/payments/webhook
GET    /api/v1/public/payments/history
```

### Admin Routes

```
GET    /api/v1/admin/dashboard

GET    /api/v1/admin/applications
GET    /api/v1/admin/applications/:id
POST   /api/v1/admin/applications/:id/request-info
POST   /api/v1/admin/applications/:id/approve
POST   /api/v1/admin/applications/:id/deny

GET    /api/v1/admin/licenses
POST   /api/v1/admin/licenses/:id/suspend
POST   /api/v1/admin/licenses/:id/revoke

GET    /api/v1/admin/monitoring/listings
GET    /api/v1/admin/monitoring/map
POST   /api/v1/admin/monitoring/listings/:id/match

GET    /api/v1/admin/reports/monthly?month=YYYY-MM
GET    /api/v1/admin/reports/export?type=licenses&format=csv

GET    /api/v1/admin/audit-logs
```

## Deployment (Production)

### Local Development

```
npm run dev → Next.js + Hono + PostgreSQL (Docker)
```

### AWS Deployment

```
CDK Stacks:
  ├── NetworkStack (VPC, subnets)
  ├── DataStack (Aurora Serverless, S3, KMS)
  ├── AuthStack (Cognito user pools)
  ├── ApiStack (API Gateway + Lambda)
  ├── FrontendStack (CloudFront + S3)
  └── MonitoringStack (CloudWatch, X-Ray)
```

**Frontend Deployment:**
- Next.js static export → S3 + CloudFront
- Or: Amplify Hosting (managed)

**API Deployment:**
- Hono runs on AWS Lambda
- API Gateway routes `/api/*` to Lambda
- Cold start optimized via Hono's lightweight footprint

**Database:**
- Aurora PostgreSQL Serverless v2
- Min 0.5 ACU, scales to 2 ACU
- Backup via AWS Backup
- Encryption at rest via KMS

## Security

### Authentication
- JWT validation on every protected route
- Token verified via RS256 (prod) / HS256 (dev)
- Tenant isolation enforced in every query

### Authorization
- Role-based access control (RBAC)
- Route-level permission checks
- Resource-level tenant filtering

### Data Protection
- TLS 1.2+ in transit
- KMS-encrypted at rest (RDS, S3, EBS)
- Presigned S3 URLs (time-limited access)
- Stripe tokenization (no card data stored)

### Audit
- Immutable audit_logs table
- All state changes logged
- CloudTrail for AWS API calls
- SIEM-ready logs

## Monitoring

### Dashboards
- CloudWatch: API latency, error rates, SLA metrics
- Custom dashboards: Application lifecycle, revenue

### Alerts
- Lambda errors → SNS → Email
- SLA breaches → Immediate notification
- Database performance warnings

### Logging
- Application logs → CloudWatch
- API request/response logging
- X-Ray tracing for complex flows

## Roadmap

### MVP (6 weeks)
- ✅ Three user experiences (owner, admin, monitoring)
- ✅ Application workflow end-to-end
- ✅ License issuance
- ✅ Mock monitoring data

### Phase 2 (6-8 weeks)
- Real STR platform integrations (AirDNA, Deckard)
- ML-based address matching (SageMaker)
- Advanced RBAC + multi-user roles
- Bulk operations (license suspension, renewal)

### Phase 3 (Quarter 3)
- SAML/OIDC federation with Active Directory
- Amazon Connect call center integration
- Multi-region active-active
- SOC 2 Type II compliance audit

---

**Last Updated:** 2025-05-09  
**Status:** Phase 0 complete, ready for Phase 1
