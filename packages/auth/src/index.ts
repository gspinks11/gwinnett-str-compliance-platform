import { sign, verify } from 'jsonwebtoken';
import { TokenPayload, TokenPayloadSchema } from '@repo/shared-types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export function createToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = verify(token, JWT_SECRET) as unknown;
    const payload = TokenPayloadSchema.parse(decoded);
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export function createMockJWT(
  sub: string,
  email: string,
  tenantId: string,
  userType: 'owner' | 'admin',
  role?: 'admin' | 'reviewer' | 'director' | 'readonly'
): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    sub,
    email,
    tenantId,
    userType,
    ...(role && { role }),
  };
  return createToken(payload);
}

export { TokenPayload };
