import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, connectDb, disconnectDb } from './index';
import { sql } from 'drizzle-orm';
import path from 'path';
import { readFile } from 'fs/promises';

async function applyBaselineMigrationIfMissing(migrationsFolder: string) {
  const regclassResult = (await db.execute(
    sql.raw("SELECT to_regclass('public.tenants') AS table_name")
  )) as { rows?: Array<{ table_name: string | null }> };

  const tenantsTableName = regclassResult.rows?.[0]?.table_name ?? null;
  if (tenantsTableName) {
    return;
  }

  const baselineSqlPath = path.join(migrationsFolder, '0000_tiresome_shinobi_shaw.sql');
  const baselineSql = await readFile(baselineSqlPath, 'utf8');
  const statements = baselineSql
    .split('--> statement-breakpoint')
    .map((stmt) => stmt.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await db.execute(sql.raw(statement));
    } catch (error) {
      const code = (error as { cause?: { code?: string } })?.cause?.code;
      const message = error instanceof Error ? error.message : '';
      const alreadyExists =
        code === '42710' || // duplicate_object (type, enum, etc.)
        code === '42P07' || // duplicate_table
        code === '42701' || // duplicate_column
        message.includes('already exists');

      if (!alreadyExists) {
        throw error;
      }
    }
  }
}

async function ensureStripePaymentIntakeTable() {
  // Keep this idempotent so deploys can run safely in all environments.
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS stripe_payment_intake (
      id BIGSERIAL PRIMARY KEY,
      application_number VARCHAR(50) NOT NULL UNIQUE,
      checkout_session_id VARCHAR(255) NOT NULL UNIQUE,
      payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
      amount_total INTEGER,
      currency VARCHAR(10),
      payment_intent_id VARCHAR(255),
      paid_at TIMESTAMP,
      submitted_at TIMESTAMP,
      last_event_type VARCHAR(100),
      last_event_id VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `));

  await db.execute(sql.raw(`
    CREATE INDEX IF NOT EXISTS idx_stripe_payment_intake_status
    ON stripe_payment_intake (payment_status);
  `));
}

async function runMigrations() {
  try {
    await connectDb();

    const migrationsFolder = path.resolve(__dirname, './migrations');

    await migrate(db, { migrationsFolder });
    await applyBaselineMigrationIfMissing(migrationsFolder);
    await ensureStripePaymentIntakeTable();

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await disconnectDb();
  }
}

runMigrations();
