import { NextRequest, NextResponse } from 'next/server';
import { db, connectDb, schema } from '@repo/db';
import { eq, count, sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    await connectDb();

    const [appCounts] = await db
      .select({
        total: count(),
        submitted: sql<number>`count(*) filter (where ${schema.applications.status} = 'submitted')`,
        under_review: sql<number>`count(*) filter (where ${schema.applications.status} = 'under_review')`,
        approved: sql<number>`count(*) filter (where ${schema.applications.status} = 'approved')`,
        denied: sql<number>`count(*) filter (where ${schema.applications.status} = 'denied')`,
      })
      .from(schema.applications);

    const [licCounts] = await db
      .select({
        active: sql<number>`count(*) filter (where ${schema.licenses.status} = 'active')`,
        expired: sql<number>`count(*) filter (where ${schema.licenses.status} = 'expired')`,
        suspended: sql<number>`count(*) filter (where ${schema.licenses.status} = 'suspended')`,
      })
      .from(schema.licenses);

    const [violationCounts] = await db
      .select({
        open: sql<number>`count(*) filter (where ${schema.violations.status} = 'open')`,
        escalated: sql<number>`count(*) filter (where ${schema.violations.status} = 'escalated')`,
      })
      .from(schema.violations);

    const [revenueRow] = await db
      .select({
        total: sql<number>`coalesce(sum(${schema.payments.amountCents}), 0)`,
      })
      .from(schema.payments)
      .where(eq(schema.payments.status, 'succeeded'));

    return NextResponse.json({
      applications: appCounts,
      licenses: licCounts,
      violations: violationCounts,
      revenueYtdCents: Number(revenueRow?.total ?? 0),
    });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
