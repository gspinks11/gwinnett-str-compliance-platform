# AWS MVP Deployment (Amplify)

This runbook deploys the existing MVP to AWS so your team can beta test remotely.

## Scope

This deployment targets current MVP behavior:

- Public portal (Next.js app)
- Admin console (Next.js app)
- Shared PostgreSQL database (RDS)

This does not implement full pre-award enterprise architecture (Step Functions, SQS orchestration, Entra federation, Connect, QuickSight pipelines, etc.).

## 1. AWS Prerequisites

- AWS account access with permissions for Amplify, RDS, Secrets Manager, Route 53, ACM.
- Region: `us-east-1` (recommended for MVP simplicity).
- Git repository connected to Amplify.

## 2. Create RDS PostgreSQL (MVP)

Create an RDS PostgreSQL instance (single AZ is acceptable for MVP beta).

Recommended baseline:

- Engine: PostgreSQL 15+
- Instance class: `db.t4g.micro` (or similar)
- Public access: `true` (MVP only)
- Security group inbound: allow PostgreSQL 5432 from Amplify egress range or controlled CIDR

After creation, build:

- `DATABASE_URL=postgresql://<user>:<pass>@<rds-endpoint>:5432/<db-name>`

Then run migrations + seed from your local machine once:

```bash
npm --prefix packages/db run migrate
npm --prefix packages/db run seed
```

## 3. Deploy Admin Console in Amplify

1. In Amplify Console: Create app -> Host web app -> connect repo/branch.
2. App root: `apps/admin-console`.
3. Build spec: paste the contents of [amplify/admin-console-amplify.yml](../amplify/admin-console-amplify.yml).
4. Environment variables:
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED` (same value is fine for MVP)
   - `NEXT_PUBLIC_ADMIN_URL` (set to Amplify app URL after first deploy, then redeploy)
5. Deploy.

## 4. Deploy Public Portal in Amplify

1. Create a second Amplify app for the same repo/branch.
2. App root: `apps/public-portal`.
3. Build spec: paste the contents of [amplify/public-portal-amplify.yml](../amplify/public-portal-amplify.yml).
4. Environment variables:
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_API_BASE_URL` (optional for current beta if login/register is not in scope)
5. Deploy.

## 5. DNS + TLS (Optional but recommended for proposal link)

- Attach custom domains in Amplify hosting settings.
- Use Route 53 records + ACM certificates managed through Amplify domain flow.

## 6. Stripe Webhook in Cloud

After public portal deploy:

1. Copy deployed webhook URL:
   - `https://<public-portal-domain>/api/stripe/webhook`
2. Add endpoint in Stripe dashboard.
3. Copy new webhook signing secret to Amplify env var `STRIPE_WEBHOOK_SECRET`.
4. Redeploy public portal.

## 7. Beta Validation Checklist

- Admin dashboard loads KPI metrics.
- `/applications` list and approve/deny work.
- `/licenses` list loads.
- `/monitoring` map and summary cards load.
- Public `/application` wizard progresses and Stripe checkout redirects.

## 8. Known MVP Constraints

- Monitoring feed is mock data (not live scraping).
- No production-grade SSO federation or call-center integration yet.
- Security controls are baseline for MVP; full Exhibit A hardening is post-award phase work.
