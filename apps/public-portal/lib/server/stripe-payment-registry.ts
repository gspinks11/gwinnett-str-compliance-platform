export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface PaymentRecord {
  applicationNumber: string;
  checkoutSessionId: string;
  paymentStatus: PaymentStatus;
  amountTotal: number | null;
  currency: string | null;
  paymentIntentId: string | null;
  paidAt: string | null;
  submittedAt: string | null;
  lastEventType: string | null;
  lastEventId: string | null;
  updatedAt: string;
}

import fs from 'fs';
import path from 'path';

interface DbRecordRow {
  application_number: string;
  checkout_session_id: string;
  payment_status: PaymentStatus;
  amount_total: number | null;
  currency: string | null;
  payment_intent_id: string | null;
  paid_at: string | null;
  submitted_at: string | null;
  last_event_type: string | null;
  last_event_id: string | null;
  updated_at: string;
}

interface RegistryFile {
  records: PaymentRecord[];
}

const DEFAULT_REGISTRY_RELATIVE_PATH = path.join('.data', 'stripe-payment-registry.json');

const getRegistryFilePath = () => {
  if (process.env.STRIPE_PAYMENT_REGISTRY_FILE?.trim()) {
    return process.env.STRIPE_PAYMENT_REGISTRY_FILE.trim();
  }

  return path.resolve(process.cwd(), DEFAULT_REGISTRY_RELATIVE_PATH);
};

const getPool = async (): Promise<any | null> => {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const globalCache = globalThis as typeof globalThis & {
    __sentinelStripePaymentPool?: any;
  };

  if (globalCache.__sentinelStripePaymentPool) {
    return globalCache.__sentinelStripePaymentPool;
  }

  try {
    const pgModule = await import('pg');
    const pool = new pgModule.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    globalCache.__sentinelStripePaymentPool = pool;
    return pool;
  } catch (error) {
    console.warn('Stripe payment registry DB backend unavailable, using file fallback.', error);
    return null;
  }
};

const ensureDbTable = async (pool: any): Promise<boolean> => {
  const globalCache = globalThis as typeof globalThis & {
    __sentinelStripePaymentTableReady?: boolean;
  };

  if (globalCache.__sentinelStripePaymentTableReady) {
    return true;
  }

  try {
    await pool.query(`
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
    `);
    globalCache.__sentinelStripePaymentTableReady = true;
    return true;
  } catch (error) {
    console.warn('Failed ensuring stripe_payment_intake table, using file fallback.', error);
    return false;
  }
};

const readRegistry = (): RegistryFile => {
  const filePath = getRegistryFilePath();

  if (!fs.existsSync(filePath)) {
    return { records: [] };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content) as RegistryFile;

    if (!Array.isArray(parsed.records)) {
      return { records: [] };
    }

    return parsed;
  } catch (error) {
    console.error('Failed to read Stripe payment registry file:', error);
    return { records: [] };
  }
};

const writeRegistry = (data: RegistryFile) => {
  const filePath = getRegistryFilePath();
  const directory = path.dirname(filePath);
  const tempFilePath = `${filePath}.tmp`;

  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(tempFilePath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFilePath, filePath);
};

const saveRecord = (record: PaymentRecord) => {
  const registry = readRegistry();
  const byApplication = registry.records.findIndex(
    (item) => item.applicationNumber === record.applicationNumber
  );
  const bySession = registry.records.findIndex(
    (item) => item.checkoutSessionId === record.checkoutSessionId
  );

  if (byApplication >= 0) {
    registry.records[byApplication] = record;
  } else if (bySession >= 0) {
    registry.records[bySession] = record;
  } else {
    registry.records.push(record);
  }

  writeRegistry(registry);
};

const mapDbRowToRecord = (row: DbRecordRow): PaymentRecord => ({
  applicationNumber: row.application_number,
  checkoutSessionId: row.checkout_session_id,
  paymentStatus: row.payment_status,
  amountTotal: row.amount_total,
  currency: row.currency,
  paymentIntentId: row.payment_intent_id,
  paidAt: row.paid_at,
  submittedAt: row.submitted_at,
  lastEventType: row.last_event_type,
  lastEventId: row.last_event_id,
  updatedAt: row.updated_at,
});

const saveRecordToDb = async (record: PaymentRecord): Promise<boolean> => {
  const pool = await getPool();
  if (!pool) {
    return false;
  }

  try {
    const tableReady = await ensureDbTable(pool);
    if (!tableReady) {
      return false;
    }

    await pool.query(
      `
      INSERT INTO stripe_payment_intake (
        application_number,
        checkout_session_id,
        payment_status,
        amount_total,
        currency,
        payment_intent_id,
        paid_at,
        submitted_at,
        last_event_type,
        last_event_id,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (application_number)
      DO UPDATE SET
        checkout_session_id = EXCLUDED.checkout_session_id,
        payment_status = EXCLUDED.payment_status,
        amount_total = EXCLUDED.amount_total,
        currency = EXCLUDED.currency,
        payment_intent_id = EXCLUDED.payment_intent_id,
        paid_at = EXCLUDED.paid_at,
        submitted_at = EXCLUDED.submitted_at,
        last_event_type = EXCLUDED.last_event_type,
        last_event_id = EXCLUDED.last_event_id,
        updated_at = EXCLUDED.updated_at
      `,
      [
        record.applicationNumber,
        record.checkoutSessionId,
        record.paymentStatus,
        record.amountTotal,
        record.currency,
        record.paymentIntentId,
        record.paidAt,
        record.submittedAt,
        record.lastEventType,
        record.lastEventId,
        record.updatedAt,
      ]
    );

    return true;
  } catch (error) {
    console.warn('Stripe payment registry DB write failed, using file fallback.', error);
    return false;
  }
};

const findRecordInDb = async (lookup: {
  checkoutSessionId?: string | null;
  applicationNumber?: string | null;
}): Promise<PaymentRecord | null> => {
  const pool = await getPool();
  if (!pool) {
    return null;
  }

  try {
    const tableReady = await ensureDbTable(pool);
    if (!tableReady) {
      return null;
    }

    if (lookup.checkoutSessionId || lookup.applicationNumber) {
      const conditions: string[] = [];
      const values: string[] = [];

      if (lookup.checkoutSessionId) {
        values.push(lookup.checkoutSessionId);
        conditions.push(`checkout_session_id = $${values.length}`);
      }

      if (lookup.applicationNumber) {
        values.push(lookup.applicationNumber);
        conditions.push(`application_number = $${values.length}`);
      }

      const result = await pool.query(
        `
        SELECT
          application_number,
          checkout_session_id,
          payment_status,
          amount_total,
          currency,
          payment_intent_id,
          paid_at,
          submitted_at,
          last_event_type,
          last_event_id,
          updated_at
        FROM stripe_payment_intake
        WHERE ${conditions.join(' OR ')}
        ORDER BY updated_at DESC
        LIMIT 1
        `,
        values
      );

      const rows = result.rows as DbRecordRow[];
      return rows[0] ? mapDbRowToRecord(rows[0]) : null;
    }

    return null;
  } catch (error) {
    console.warn('Stripe payment registry DB read failed, using file fallback.', error);
    return null;
  }
};

const buildUpdatedRecord = (
  existing: PaymentRecord | undefined,
  payload: Partial<PaymentRecord> & Pick<PaymentRecord, 'applicationNumber' | 'checkoutSessionId'>
): PaymentRecord => {
  const nowIso = new Date().toISOString();

  return {
    applicationNumber: payload.applicationNumber,
    checkoutSessionId: payload.checkoutSessionId,
    paymentStatus: payload.paymentStatus ?? existing?.paymentStatus ?? 'pending',
    amountTotal: payload.amountTotal ?? existing?.amountTotal ?? null,
    currency: payload.currency ?? existing?.currency ?? null,
    paymentIntentId: payload.paymentIntentId ?? existing?.paymentIntentId ?? null,
    paidAt: payload.paidAt ?? existing?.paidAt ?? null,
    submittedAt: payload.submittedAt ?? existing?.submittedAt ?? null,
    lastEventType: payload.lastEventType ?? existing?.lastEventType ?? null,
    lastEventId: payload.lastEventId ?? existing?.lastEventId ?? null,
    updatedAt: nowIso,
  };
};

export const upsertCheckoutSessionRecord = async (payload: {
  applicationNumber: string;
  checkoutSessionId: string;
  amountTotal: number | null;
  currency: string | null;
  paymentIntentId: string | null;
}) => {
  const existing = await findRecordInDb(payload);
  const fallbackRegistry = existing ? null : readRegistry();
  const fallbackExisting = fallbackRegistry?.records.find(
    (item) => item.checkoutSessionId === payload.checkoutSessionId || item.applicationNumber === payload.applicationNumber
  );
  const updated = buildUpdatedRecord(existing ?? undefined, {
    ...payload,
    paymentStatus: existing?.paymentStatus ?? fallbackExisting?.paymentStatus ?? 'pending',
  });

  const savedToDb = await saveRecordToDb(updated);
  if (!savedToDb) {
    saveRecord(updated);
  }
  return updated;
};

export const markPaymentSucceeded = async (payload: {
  applicationNumber: string;
  checkoutSessionId: string;
  amountTotal: number | null;
  currency: string | null;
  paymentIntentId: string | null;
  eventType: string;
  eventId: string;
  paidAt?: string;
}) => {
  const existing = await findRecordInDb(payload);
  const fallbackRegistry = existing ? null : readRegistry();
  const fallbackExisting = fallbackRegistry?.records.find(
    (item) => item.checkoutSessionId === payload.checkoutSessionId || item.applicationNumber === payload.applicationNumber
  );
  const updated = buildUpdatedRecord(existing ?? undefined, {
    ...payload,
    paymentStatus: 'paid',
    submittedAt: existing?.submittedAt ?? fallbackExisting?.submittedAt ?? new Date().toISOString(),
    paidAt: payload.paidAt ?? new Date().toISOString(),
    lastEventType: payload.eventType,
    lastEventId: payload.eventId,
  });

  const savedToDb = await saveRecordToDb(updated);
  if (!savedToDb) {
    saveRecord(updated);
  }
  return updated;
};

export const markPaymentFailed = async (payload: {
  applicationNumber: string;
  checkoutSessionId: string;
  amountTotal: number | null;
  currency: string | null;
  paymentIntentId: string | null;
  eventType: string;
  eventId: string;
}) => {
  const existing = await findRecordInDb(payload);
  const fallbackRegistry = existing ? null : readRegistry();
  const fallbackExisting = fallbackRegistry?.records.find(
    (item) => item.checkoutSessionId === payload.checkoutSessionId || item.applicationNumber === payload.applicationNumber
  );
  const updated = buildUpdatedRecord(existing ?? undefined, {
    ...payload,
    paymentStatus: 'failed',
    submittedAt: existing?.submittedAt ?? fallbackExisting?.submittedAt ?? null,
    lastEventType: payload.eventType,
    lastEventId: payload.eventId,
  });

  const savedToDb = await saveRecordToDb(updated);
  if (!savedToDb) {
    saveRecord(updated);
  }
  return updated;
};

export const findPaymentRecord = async (lookup: {
  checkoutSessionId?: string | null;
  applicationNumber?: string | null;
}) => {
  const dbRecord = await findRecordInDb(lookup);
  if (dbRecord) {
    return dbRecord;
  }

  const registry = readRegistry();

  if (lookup.checkoutSessionId) {
    const bySession = registry.records.find(
      (item) => item.checkoutSessionId === lookup.checkoutSessionId
    );
    if (bySession) {
      return bySession;
    }
  }

  if (lookup.applicationNumber) {
    return (
      registry.records.find((item) => item.applicationNumber === lookup.applicationNumber) ??
      null
    );
  }

  return null;
};