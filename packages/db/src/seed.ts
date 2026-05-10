import { db, connectDb, disconnectDb, schema } from './index';
import { faker } from '@faker-js/faker';

const GWINNETT_CITIES = [
  { city: 'Snellville', zip: '30078' },
  { city: 'Lilburn', zip: '30047' },
  { city: 'Lawrenceville', zip: '30046' },
  { city: 'Duluth', zip: '30096' },
  { city: 'Grayson', zip: '30017' },
  { city: 'Suwanee', zip: '30024' },
  { city: 'Norcross', zip: '30071' },
];

async function seed() {
  try {
    await connectDb();

    console.log('🌱 Starting seed...');

    // 1. Create tenant (Gwinnett County)
    const tenantResult = await db
      .insert(schema.tenants)
      .values({
        name: 'Gwinnett County',
        slug: 'gwinnett-county',
        state: 'GA',
        branding: {
          color: '#003366',
          logo: 'https://example.com/gwinnett-logo.png',
        },
        settings: {
          licenseValidityYears: 1,
          newLicenseFee: 50000, // $500.00 in cents
          renewalFee: 30000, // $300.00 in cents
        },
      })
      .returning();

    const tenantId = tenantResult[0].id;
    console.log('✓ Created tenant:', tenantId);

    // 2. Create 5 admin users
    const adminEmails = [
      'director@gwinnett.gov',
      'reviewer1@gwinnett.gov',
      'reviewer2@gwinnett.gov',
      'readonly@gwinnett.gov',
      'admin@gwinnett.gov',
    ];

    const adminRoles = ['director', 'reviewer', 'reviewer', 'readonly', 'admin'];

    const adminUsers = await Promise.all(
      adminEmails.map((email, index) =>
        db
          .insert(schema.adminUsers)
          .values({
            tenantId,
            email,
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            role: adminRoles[index] as 'director' | 'reviewer' | 'readonly' | 'admin',
            cognitoSub: `admin-${index}`,
          })
          .returning()
      )
    );

    console.log('✓ Created 5 admin users');

    // 3. Create 10 STR owner users
    const users = [];
    for (let i = 0; i < 10; i++) {
      const mailingCity = faker.helpers.arrayElement(GWINNETT_CITIES);
      const user = await db
        .insert(schema.users)
        .values({
          tenantId,
          email: faker.internet.email(),
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          phone: faker.phone.number('555-###-####'),
          cognitoSub: `user-${i}`,
          mailingAddress: {
            street: faker.address.streetAddress(),
            city: mailingCity.city,
            state: 'GA',
            zip: mailingCity.zip,
          },
        })
        .returning();
      users.push(user[0]);
    }

    console.log('✓ Created 10 STR owner users');

    // 4. Create 10 properties (in Gwinnett County)
    const properties = [];
    const gwinnettLat = 33.96;
    const gwinnettLng = -84.2;

    for (let i = 0; i < 10; i++) {
      const propertyCity = faker.helpers.arrayElement(GWINNETT_CITIES);
      const property = await db
        .insert(schema.properties)
        .values({
          tenantId,
          ownerUserId: users[i].id,
          streetAddress: faker.address.streetAddress(),
          city: propertyCity.city,
          state: 'GA',
          zip: propertyCity.zip,
          latitude: (gwinnettLat + (Math.random() - 0.5) * 0.5).toString(),
          longitude: (gwinnettLng + (Math.random() - 0.5) * 0.5).toString(),
          inJurisdiction: true,
          commissionDistrict: `District ${faker.datatype.number({ min: 1, max: 4 })}`,
        })
        .returning();
      properties.push(property[0]);
    }

    console.log('✓ Created 10 properties');

    // 5. Create local agents
    const localAgents = [];
    for (let i = 0; i < 5; i++) {
      const agentCity = faker.helpers.arrayElement(GWINNETT_CITIES);
      const agent = await db
        .insert(schema.localAgents)
        .values({
          userId: users[i].id,
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          email: faker.internet.email(),
          phone: faker.phone.number('555-###-####'),
          address: {
            street: faker.address.streetAddress(),
            city: agentCity.city,
            state: 'GA',
            zip: agentCity.zip,
          },
          countyOfResidence: 'Gwinnett',
        })
        .returning();
      localAgents.push(agent[0]);
    }

    console.log('✓ Created 5 local agents');

    // 6. Create applications in various states
    const statuses: Array<'draft' | 'submitted' | 'under_review' | 'approved' | 'denied'> = [
      'draft',
      'draft',
      'submitted',
      'under_review',
      'under_review',
      'approved',
      'approved',
      'denied',
      'submitted',
      'approved',
    ];

    const applications = [];
    for (let i = 0; i < 10; i++) {
      const app = await db
        .insert(schema.applications)
        .values({
          tenantId,
          propertyId: properties[i].id,
          userId: users[i].id,
          localAgentId: localAgents[i % 5].id,
          applicationNumber: `GWN-2027-${String(i + 1).padStart(5, '0')}`,
          type: 'new',
          status: statuses[i],
          submittedAt: statuses[i] !== 'draft' ? new Date() : null,
          decidedAt:
            statuses[i] === 'approved' || statuses[i] === 'denied' ? new Date() : null,
          decidedBy:
            statuses[i] === 'approved' || statuses[i] === 'denied'
              ? adminUsers[0][0].id
              : null,
          attestations: {
            rulesAndRegulations: true,
            fireCode: true,
            neighborhoodCompatibility: true,
          },
        })
        .returning();
      applications.push(app[0]);
    }

    console.log('✓ Created 10 applications in various states');

    // 7. Create licenses for approved applications
    for (let i = 0; i < applications.length; i++) {
      if (applications[i].status === 'approved') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const expiration = new Date();
        expiration.setFullYear(expiration.getFullYear() + 1);

        await db
          .insert(schema.licenses)
          .values({
            tenantId,
            applicationId: applications[i].id,
            propertyId: applications[i].propertyId,
            licenseNumber: `STR-2027-${String(i + 1).padStart(5, '0')}`,
            issuedDate: new Date().toISOString().split('T')[0],
            expirationDate: expiration.toISOString().split('T')[0],
            status: 'active',
          })
          .returning();
      }
    }

    console.log('✓ Created licenses for approved applications');

    // 8. Create 50 mock external listings
    const mockListings = [];
    for (let i = 0; i < 50; i++) {
      const matched = i < 30; // 60% matched
      const listingCity = faker.helpers.arrayElement(GWINNETT_CITIES);
      const listing = await db
        .insert(schema.externalListings)
        .values({
          tenantId,
          source: faker.helpers.arrayElement(['airbnb', 'vrbo', 'booking']),
          sourceListingId: `mock-${i}`,
          sourceUrl: `https://example.com/listing/${i}`,
          title: `${faker.helpers.arrayElement(['Cozy', 'Modern', 'Luxury'])} ${faker.helpers.arrayElement(['Apartment', 'House', 'Condo'])} in ${listingCity.city}, GA`,
          description: faker.lorem.paragraphs(2),
          approximateLat: (gwinnettLat + (Math.random() - 0.5) * 0.5).toString(),
          approximateLng: (gwinnettLng + (Math.random() - 0.5) * 0.5).toString(),
          listingData: {
            bedrooms: faker.datatype.number({ min: 1, max: 4 }),
            bathrooms: faker.datatype.number({ min: 1, max: 2 }),
            reviews: faker.datatype.number({ min: 0, max: 100 }),
            price: faker.datatype.number({ min: 50, max: 300 }),
          },
          matchedPropertyId: matched ? properties[i % properties.length].id : null,
          matchConfidence: matched ? '0.85' : '0',
          matchStatus: matched ? 'confirmed' : 'unmatched',
          isMockData: true,
        })
        .returning();
      mockListings.push(listing[0]);
    }

    console.log('✓ Created 50 mock external listings');

    // 9. Create audit logs
    for (let i = 0; i < 20; i++) {
      await db
        .insert(schema.auditLogs)
        .values({
          tenantId,
          actorId: adminUsers[0][0].id,
          actorType: 'admin',
          action: faker.helpers.arrayElement([
            'application.submitted',
            'application.reviewed',
            'license.issued',
            'license.suspended',
            'property.updated',
          ]),
          resourceType: faker.helpers.arrayElement(['application', 'license', 'property']),
          resourceId: properties[i % properties.length].id,
          ipAddress: faker.internet.ipv4(),
          userAgent: faker.internet.userAgent(),
        })
        .returning();
    }

    console.log('✓ Created 20 audit log entries');

    console.log('\n✅ Seed completed successfully!');
    console.log('\nCreated:');
    console.log(`- 1 tenant: Gwinnett County`);
    console.log(`- 5 admin users`);
    console.log(`- 10 STR owner users`);
    console.log(`- 10 properties`);
    console.log(`- 5 local agents`);
    console.log(`- 10 applications (various statuses)`);
    console.log(`- 5 licenses`);
    console.log(`- 50 mock external listings`);
    console.log(`- 20 audit log entries`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await disconnectDb();
  }
}

seed();
