import { db, connectDb, disconnectDb } from './index';
import { sql } from 'drizzle-orm';

async function dropAllTables() {
  try {
    await connectDb();

    // Drop in reverse order of dependencies
    const tables = [
      '__drizzle_migrations',
      'audit_logs',
      'notifications',
      'outreach_attempts',
      'external_listings',
      'communications',
      'violations',
      'documents',
      'payments',
      'licenses',
      'applications',
      'local_agents',
      'properties',
      'admin_users',
      'users',
      'tenants',
    ];

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`DROP TABLE IF EXISTS ${table} CASCADE`));
        console.log(`✓ Dropped ${table}`);
      } catch (error) {
        console.log(`⚠ Could not drop ${table}:`, error);
      }
    }

    // Drop enums
    const enums = [
      'application_status',
      'application_type',
      'license_status',
      'document_type',
      'virus_scan_status',
      'payment_status',
      'fee_type',
      'violation_status',
      'reported_by_enum',
      'communication_channel',
      'direction',
      'notification_type',
      'notification_status',
      'listing_source',
      'match_status',
      'outreach_method',
      'actor_type',
      'admin_role',
    ];

    for (const enumType of enums) {
      try {
        await db.execute(sql.raw(`DROP TYPE IF EXISTS ${enumType} CASCADE`));
        console.log(`✓ Dropped enum ${enumType}`);
      } catch (error) {
        console.log(`⚠ Could not drop enum ${enumType}:`, error);
      }
    }

    console.log('✅ All tables and enums dropped');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await disconnectDb();
  }
}

dropAllTables();
