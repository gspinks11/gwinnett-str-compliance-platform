import { NextRequest, NextResponse } from 'next/server';
import { db, connectDb, schema } from '@repo/db';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');

  try {
    await connectDb();

    let query = db
      .select({
        id: schema.applications.id,
        applicationNumber: schema.applications.applicationNumber,
        type: schema.applications.type,
        status: schema.applications.status,
        submittedAt: schema.applications.submittedAt,
        decidedAt: schema.applications.decidedAt,
        decisionNotes: schema.applications.decisionNotes,
        createdAt: schema.applications.createdAt,
        updatedAt: schema.applications.updatedAt,
        propertyAddress: schema.properties.streetAddress,
        propertyCity: schema.properties.city,
        propertyZip: schema.properties.zip,
        ownerFirstName: schema.users.firstName,
        ownerLastName: schema.users.lastName,
        ownerEmail: schema.users.email,
      })
      .from(schema.applications)
      .leftJoin(schema.properties, eq(schema.applications.propertyId, schema.properties.id))
      .leftJoin(schema.users, eq(schema.applications.userId, schema.users.id))
      .orderBy(desc(schema.applications.createdAt))
      .$dynamic();

    if (status && status !== 'all') {
      query = query.where(eq(schema.applications.status, status as typeof schema.applications.status._.data));
    }

    const rows = await query;

    return NextResponse.json({ applications: rows });
  } catch (err) {
    console.error('GET /api/applications error:', err);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
