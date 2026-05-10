import { NextRequest, NextResponse } from 'next/server';
import { db, connectDb, schema } from '@repo/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { action, notes } = await req.json() as { action: 'approve' | 'deny'; notes?: string };

  if (!['approve', 'deny'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const newStatus = action === 'approve' ? 'approved' : 'denied';

  try {
    await connectDb();

    const [updated] = await db
      .update(schema.applications)
      .set({
        status: newStatus,
        decidedAt: new Date(),
        decisionNotes: notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.applications.id, params.id))
      .returning({
        id: schema.applications.id,
        status: schema.applications.status,
        decidedAt: schema.applications.decidedAt,
      });

    if (!updated) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Auto-create license on approval
    if (action === 'approve') {
      const [app] = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, params.id));

      const today = new Date();
      const expiry = new Date(today);
      expiry.setFullYear(expiry.getFullYear() + 1);
      const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

      const licenseNumber = `GCO-${app.applicationNumber.replace(/^APP-/, '')}`;

      await db.insert(schema.licenses).values({
        tenantId: app.tenantId,
        applicationId: app.id,
        propertyId: app.propertyId,
        licenseNumber,
        issuedDate: toDateStr(today),
        expirationDate: toDateStr(expiry),
        status: 'active',
      }).onConflictDoNothing();
    }

    return NextResponse.json({ application: updated });
  } catch (err) {
    console.error('PATCH /api/applications/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
