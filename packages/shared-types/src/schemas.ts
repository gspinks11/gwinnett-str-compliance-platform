import { z } from 'zod';

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const TokenPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  tenantId: z.string().uuid(),
  userType: z.enum(['owner', 'admin']),
  role: z.enum(['admin', 'reviewer', 'director', 'readonly']).optional(),
  iat: z.number(),
  exp: z.number(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

// ============================================================================
// PROPERTY SCHEMAS
// ============================================================================

export const PropertySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  ownerUserId: z.string().uuid(),
  streetAddress: z.string(),
  unit: z.string().optional().nullable(),
  city: z.string(),
  state: z.string().length(2),
  zip: z.string(),
  parcelId: z.string().optional().nullable(),
  latitude: z.string(),
  longitude: z.string(),
  commissionDistrict: z.string().optional().nullable(),
  inJurisdiction: z.boolean(),
  createdAt: z.date(),
});

export const CreatePropertySchema = z.object({
  streetAddress: z.string().min(1),
  unit: z.string().optional(),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}$/),
  parcelId: z.string().optional(),
  latitude: z.string().regex(/^-?[0-9]+\.?[0-9]*$/),
  longitude: z.string().regex(/^-?[0-9]+\.?[0-9]*$/),
  commissionDistrict: z.string().optional(),
  inJurisdiction: z.boolean().default(false),
});

export type Property = z.infer<typeof PropertySchema>;
export type CreateProperty = z.infer<typeof CreatePropertySchema>;

// ============================================================================
// APPLICATION SCHEMAS
// ============================================================================

export const ApplicationStatusEnum = z.enum([
  'draft',
  'submitted',
  'under_review',
  'info_requested',
  'approved',
  'denied',
  'withdrawn',
]);

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  propertyId: z.string().uuid(),
  userId: z.string().uuid(),
  localAgentId: z.string().uuid().nullable(),
  applicationNumber: z.string(),
  type: z.enum(['new', 'renewal']),
  status: ApplicationStatusEnum,
  submittedAt: z.date().nullable(),
  decidedAt: z.date().nullable(),
  decidedBy: z.string().uuid().nullable(),
  decisionNotes: z.string().nullable(),
  inspectionDate: z.date().nullable(),
  attestations: z.record(z.boolean()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateApplicationSchema = z.object({
  propertyId: z.string().uuid(),
  type: z.enum(['new', 'renewal']),
  localAgentId: z.string().uuid().optional(),
  attestations: z.record(z.boolean()).optional(),
});

export const SubmitApplicationSchema = z.object({
  attestations: z.record(z.boolean()),
});

export type Application = z.infer<typeof ApplicationSchema>;
export type CreateApplication = z.infer<typeof CreateApplicationSchema>;

// ============================================================================
// LICENSE SCHEMAS
// ============================================================================

export const LicenseStatusEnum = z.enum(['active', 'expired', 'suspended', 'revoked']);

export const LicenseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  applicationId: z.string().uuid(),
  propertyId: z.string().uuid(),
  licenseNumber: z.string(),
  issuedDate: z.date(),
  expirationDate: z.date(),
  status: LicenseStatusEnum,
  suspendedAt: z.date().nullable(),
  suspendedReason: z.string().nullable(),
  createdAt: z.date(),
});

export type License = z.infer<typeof LicenseSchema>;

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

export const PaymentStatusEnum = z.enum(['pending', 'succeeded', 'failed', 'refunded']);

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  applicationId: z.string().uuid(),
  userId: z.string().uuid(),
  stripePaymentIntentId: z.string().nullable(),
  amountCents: z.number().int(),
  feeType: z.enum(['new_license', 'renewal', 'late_fee']),
  status: PaymentStatusEnum,
  paidAt: z.date().nullable(),
  createdAt: z.date(),
});

export const CreatePaymentIntentSchema = z.object({
  applicationId: z.string().uuid(),
  amount: z.number().positive(),
  feeType: z.enum(['new_license', 'renewal', 'late_fee']),
});

export type Payment = z.infer<typeof PaymentSchema>;

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

export const DocumentTypeEnum = z.enum([
  'inspection_report',
  'proof_of_ownership',
  'insurance',
  'attestation',
  'other',
]);

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  applicationId: z.string().uuid().nullable(),
  uploadedBy: z.string().uuid(),
  s3Key: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  documentType: DocumentTypeEnum,
  virusScanStatus: z.enum(['pending', 'clean', 'infected']),
  uploadedAt: z.date(),
});

export const RequestUploadUrlSchema = z.object({
  filename: z.string(),
  mimeType: z.string(),
  documentType: DocumentTypeEnum,
});

export type Document = z.infer<typeof DocumentSchema>;

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const ApiSuccessResponseSchema = z.object({
  data: z.unknown(),
  meta: z.object({}).optional(),
});

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string(),
  }),
});

export type ApiSuccessResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
};
