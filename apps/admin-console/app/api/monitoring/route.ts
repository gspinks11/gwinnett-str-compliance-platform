import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { connectDb, db, schema } from '@repo/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ComplianceStatus = 'licensed' | 'matched_unlicensed' | 'unmatched';

export async function GET() {
  try {
    await connectDb();

    const rows = await db
      .select({
        id: schema.externalListings.id,
        source: schema.externalListings.source,
        title: schema.externalListings.title,
        sourceUrl: schema.externalListings.sourceUrl,
        matchStatus: schema.externalListings.matchStatus,
        matchConfidence: schema.externalListings.matchConfidence,
        approximateLat: schema.externalListings.approximateLat,
        approximateLng: schema.externalListings.approximateLng,
        firstSeenAt: schema.externalListings.firstSeenAt,
        matchedPropertyId: schema.externalListings.matchedPropertyId,
        propertyAddress: schema.properties.streetAddress,
        propertyCity: schema.properties.city,
        licenseNumber: schema.licenses.licenseNumber,
        licenseStatus: schema.licenses.status,
      })
      .from(schema.externalListings)
      .leftJoin(
        schema.properties,
        eq(schema.externalListings.matchedPropertyId, schema.properties.id)
      )
      .leftJoin(
        schema.licenses,
        and(
          eq(schema.licenses.propertyId, schema.properties.id),
          eq(schema.licenses.status, 'active')
        )
      );

    const listings = rows
      .map((row) => {
        const lat = row.approximateLat ? Number(row.approximateLat) : null;
        const lng = row.approximateLng ? Number(row.approximateLng) : null;
        if (lat == null || Number.isNaN(lat) || lng == null || Number.isNaN(lng)) {
          return null;
        }

        let complianceStatus: ComplianceStatus = 'unmatched';
        if (row.matchedPropertyId && row.licenseStatus === 'active') {
          complianceStatus = 'licensed';
        } else if (row.matchedPropertyId) {
          complianceStatus = 'matched_unlicensed';
        }

        return {
          id: row.id,
          source: row.source,
          title: row.title,
          sourceUrl: row.sourceUrl,
          matchStatus: row.matchStatus,
          matchConfidence: row.matchConfidence ? Number(row.matchConfidence) : 0,
          lat,
          lng,
          firstSeenAt: row.firstSeenAt,
          matchedPropertyId: row.matchedPropertyId,
          propertyAddress: row.propertyAddress,
          propertyCity: row.propertyCity,
          licenseNumber: row.licenseNumber,
          licenseStatus: row.licenseStatus,
          complianceStatus,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    const summary = {
      total: listings.length,
      licensed: listings.filter((x) => x.complianceStatus === 'licensed').length,
      matchedUnlicensed: listings.filter((x) => x.complianceStatus === 'matched_unlicensed').length,
      unmatched: listings.filter((x) => x.complianceStatus === 'unmatched').length,
    };

    return NextResponse.json({ listings, summary });
  } catch (error) {
    console.error('GET /api/monitoring error:', error);
    return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: 500 });
  }
}
