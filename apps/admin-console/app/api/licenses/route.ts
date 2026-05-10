import { NextRequest, NextResponse } from 'next/server';
import { db, connectDb, schema } from '@repo/db';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    await connectDb();

    const rows = await db
      .select({
        id: schema.licenses.id,
        licenseNumber: schema.licenses.licenseNumber,
        issuedDate: schema.licenses.issuedDate,
        expirationDate: schema.licenses.expirationDate,
        status: schema.licenses.status,
        suspendedAt: schema.licenses.suspendedAt,
        suspendedReason: schema.licenses.suspendedReason,
        propertyAddress: schema.properties.streetAddress,
        propertyCity: schema.properties.city,
        propertyZip: schema.properties.zip,
        ownerFirstName: schema.users.firstName,
        ownerLastName: schema.users.lastName,
        ownerEmail: schema.users.email,
      })
      .from(schema.licenses)
      .leftJoin(schema.properties, eq(schema.licenses.propertyId, schema.properties.id))
      .leftJoin(schema.applications, eq(schema.licenses.applicationId, schema.applications.id))
      .leftJoin(schema.users, eq(schema.applications.userId, schema.users.id))
      .orderBy(desc(schema.licenses.issuedDate));

    return NextResponse.json({ licenses: rows });
  } catch (err) {
    console.error('GET /api/licenses error:', err);
    return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 });
  }
}
