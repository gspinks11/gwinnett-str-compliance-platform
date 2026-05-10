import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  bigint,
  boolean,
  date,
  numeric,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ============================================================================
// MULTI-TENANCY & ADMIN
// ============================================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  state: varchar('state', { length: 2 }).notNull(),
  branding: jsonb('branding'), // logo URLs, colors
  settings: jsonb('settings'), // ordinance config
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  cognitoSub: varchar('cognito_sub', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  mailingAddress: jsonb('mailing_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adminRole = pgEnum('admin_role', ['admin', 'reviewer', 'director', 'readonly']);

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  cognitoSub: varchar('cognito_sub', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  role: adminRole('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// PROPERTIES & LICENSING
// ============================================================================

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  ownerUserId: uuid('owner_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  streetAddress: varchar('street_address', { length: 255 }).notNull(),
  unit: varchar('unit', { length: 50 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  zip: varchar('zip', { length: 10 }).notNull(),
  parcelId: varchar('parcel_id', { length: 50 }),
  latitude: numeric('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: numeric('longitude', { precision: 11, scale: 8 }).notNull(),
  commissionDistrict: varchar('commission_district', { length: 50 }),
  inJurisdiction: boolean('in_jurisdiction').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const localAgents = pgTable('local_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: jsonb('address').notNull(),
  countyOfResidence: varchar('county_of_residence', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// APPLICATION LIFECYCLE
// ============================================================================

export const applicationStatus = pgEnum('application_status', [
  'draft',
  'submitted',
  'under_review',
  'info_requested',
  'approved',
  'denied',
  'withdrawn',
]);

export const applicationType = pgEnum('application_type', ['new', 'renewal']);

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    localAgentId: uuid('local_agent_id').references(() => localAgents.id),
    applicationNumber: varchar('application_number', { length: 50 }).notNull().unique(),
    type: applicationType('type').notNull(),
    status: applicationStatus('status').notNull().default('draft'),
    submittedAt: timestamp('submitted_at'),
    decidedAt: timestamp('decided_at'),
    decidedBy: uuid('decided_by').references(() => adminUsers.id),
    decisionNotes: text('decision_notes'),
    inspectionDate: date('inspection_date'),
    inspectionDocId: uuid('inspection_doc_id'),
    attestations: jsonb('attestations'),
    paymentId: uuid('payment_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    idxApplicationsTenantStatus: index('idx_applications_tenant_status').on(
      table.tenantId,
      table.status
    ),
    idxApplicationsProperty: index('idx_applications_property').on(table.propertyId),
    idxApplicationsUser: index('idx_applications_user').on(table.userId),
  })
);

// ============================================================================
// LICENSES
// ============================================================================

export const licenseStatus = pgEnum('license_status', ['active', 'expired', 'suspended', 'revoked']);

export const licenses = pgTable(
  'licenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id')
      .notNull()
      .unique()
      .references(() => applications.id, { onDelete: 'cascade' }),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    licenseNumber: varchar('license_number', { length: 50 }).notNull().unique(),
    issuedDate: date('issued_date').notNull(),
    expirationDate: date('expiration_date').notNull(),
    status: licenseStatus('status').notNull().default('active'),
    suspendedAt: timestamp('suspended_at'),
    suspendedReason: text('suspended_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    idxLicensesTenantExpiration: index('idx_licenses_tenant_expiration').on(
      table.tenantId,
      table.expirationDate
    ),
    idxLicensesStatus: index('idx_licenses_status').on(table.status),
  })
);

// ============================================================================
// DOCUMENTS
// ============================================================================

export const documentType = pgEnum('document_type', [
  'inspection_report',
  'proof_of_ownership',
  'insurance',
  'attestation',
  'other',
]);

export const virusScanStatus = pgEnum('virus_scan_status', ['pending', 'clean', 'infected']);

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  s3Key: varchar('s3_key', { length: 500 }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  documentType: documentType('document_type').notNull(),
  virusScanStatus: virusScanStatus('virus_scan_status').notNull().default('pending'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// ============================================================================
// PAYMENTS
// ============================================================================

export const paymentStatus = pgEnum('payment_status', ['pending', 'succeeded', 'failed', 'refunded']);

export const feeType = pgEnum('fee_type', ['new_license', 'renewal', 'late_fee']);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  amountCents: integer('amount_cents').notNull(),
  feeType: feeType('fee_type').notNull(),
  status: paymentStatus('status').notNull().default('pending'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stripeIntakePaymentStatus = pgEnum('stripe_intake_payment_status', [
  'pending',
  'paid',
  'failed',
]);

export const stripePaymentIntake = pgTable(
  'stripe_payment_intake',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationNumber: varchar('application_number', { length: 50 }).notNull(),
    checkoutSessionId: varchar('checkout_session_id', { length: 255 }).notNull(),
    paymentStatus: stripeIntakePaymentStatus('payment_status').notNull().default('pending'),
    amountTotal: integer('amount_total'),
    currency: varchar('currency', { length: 10 }),
    paymentIntentId: varchar('payment_intent_id', { length: 255 }),
    paidAt: timestamp('paid_at'),
    submittedAt: timestamp('submitted_at'),
    lastEventType: varchar('last_event_type', { length: 100 }),
    lastEventId: varchar('last_event_id', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    applicationNumberUnique: uniqueIndex('idx_stripe_payment_intake_application_number').on(
      table.applicationNumber
    ),
    checkoutSessionUnique: uniqueIndex('idx_stripe_payment_intake_checkout_session_id').on(
      table.checkoutSessionId
    ),
    statusIndex: index('idx_stripe_payment_intake_status').on(table.paymentStatus),
  })
);

// ============================================================================
// VIOLATIONS
// ============================================================================

export const violationStatus = pgEnum('violation_status', ['open', 'resolved', 'escalated']);

export const reportedBy = pgEnum('reported_by_enum', ['county', 'complaint', 'monitoring']);

export const violations = pgTable('violations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  licenseId: uuid('license_id').references(() => licenses.id),
  violationType: varchar('violation_type', { length: 255 }).notNull(),
  description: text('description').notNull(),
  reportedBy: reportedBy('reported_by').notNull(),
  reportedDate: date('reported_date').notNull(),
  resolvedDate: date('resolved_date'),
  status: violationStatus('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// COMMUNICATIONS
// ============================================================================

export const communicationChannel = pgEnum('communication_channel', [
  'email',
  'sms',
  'phone',
  'mail',
]);

export const direction = pgEnum('direction', ['inbound', 'outbound']);

export const communications = pgTable('communications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').references(() => applications.id),
  propertyId: uuid('property_id').references(() => properties.id),
  userId: uuid('user_id').references(() => users.id),
  channel: communicationChannel('channel').notNull(),
  direction: direction('direction').notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  body: text('body').notNull(),
  sentBy: uuid('sent_by').references(() => adminUsers.id),
  templateId: varchar('template_id', { length: 255 }),
  metadata: jsonb('metadata'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notificationType = pgEnum('notification_type', [
  'application_received',
  'info_requested',
  'approved',
  'denied',
  'renewal_60day',
  'renewal_30day',
  'past_due',
]);

export const notificationStatus = pgEnum('notification_status', [
  'scheduled',
  'sent',
  'failed',
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: notificationType('type').notNull(),
  scheduledFor: timestamp('scheduled_for').notNull(),
  sentAt: timestamp('sent_at'),
  status: notificationStatus('status').notNull().default('scheduled'),
});

// ============================================================================
// MONITORING: EXTERNAL LISTINGS (MOCK DATA)
// ============================================================================

export const listingSource = pgEnum('listing_source', [
  'airbnb',
  'vrbo',
  'booking',
  'furnished_finder',
  'mock',
]);

export const matchStatus = pgEnum('match_status', [
  'unmatched',
  'probable',
  'confirmed',
  'dismissed',
]);

export const externalListings = pgTable(
  'external_listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    source: listingSource('source').notNull(),
    sourceListingId: varchar('source_listing_id', { length: 255 }).notNull(),
    sourceUrl: varchar('source_url', { length: 1000 }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    approximateLat: numeric('approximate_lat', { precision: 10, scale: 8 }),
    approximateLng: numeric('approximate_lng', { precision: 11, scale: 8 }),
    listingData: jsonb('listing_data'),
    matchedPropertyId: uuid('matched_property_id').references(() => properties.id),
    matchConfidence: numeric('match_confidence', { precision: 3, scale: 2 }).default('0'),
    matchStatus: matchStatus('match_status').notNull().default('unmatched'),
    isMockData: boolean('is_mock_data').notNull().default(true),
    firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  },
  (table) => ({
    idxExternalListingsTenantMatch: index('idx_external_listings_tenant_match').on(
      table.tenantId,
      table.matchStatus
    ),
    idxExternalListingsMatchedProperty: index('idx_external_listings_matched_property').on(
      table.matchedPropertyId
    ),
  })
);

// ============================================================================
// OUTREACH
// ============================================================================

export const outreachMethod = pgEnum('outreach_method', ['letter', 'phone', 'email']);

export const outreachAttempts = pgTable('outreach_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  externalListingId: uuid('external_listing_id')
    .notNull()
    .references(() => externalListings.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id),
  attemptNumber: integer('attempt_number').notNull(),
  method: outreachMethod('method').notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  responseReceived: boolean('response_received').default(false),
  responseDate: date('response_date'),
  escalatedToEnforcement: boolean('escalated_to_enforcement').default(false),
  escalatedAt: timestamp('escalated_at'),
});

// ============================================================================
// AUDIT LOG (IMMUTABLE)
// ============================================================================

export const actorType = pgEnum('actor_type', ['user', 'admin', 'system']);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id'),
    actorType: actorType('actor_type').notNull(),
    action: varchar('action', { length: 255 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    resourceId: uuid('resource_id').notNull(),
    before: jsonb('before'),
    after: jsonb('after'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    idxAuditTenantCreated: index('idx_audit_tenant_created').on(table.tenantId),
    idxAuditCreatedAt: index('idx_audit_created_at').on(table.createdAt),
  })
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type LocalAgent = typeof localAgents.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type License = typeof licenses.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type StripePaymentIntake = typeof stripePaymentIntake.$inferSelect;
export type Violation = typeof violations.$inferSelect;
export type Communication = typeof communications.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ExternalListing = typeof externalListings.$inferSelect;
export type OutreachAttempt = typeof outreachAttempts.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
