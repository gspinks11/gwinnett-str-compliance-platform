import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { LoginRequestSchema, RegisterRequestSchema } from '@repo/shared-types';

type OwnerUser = {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  passwordHash: string;
  createdAt: string;
};

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sentinel_str_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_TENANT_ID = '11111111-1111-4111-8111-111111111111';

const usersByEmail = new Map<string, OwnerUser>();
const sessions = new Map<string, { email: string; expiresAt: number }>();
let initPromise: Promise<void> | null = null;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getTenantId(): string {
  const configured = process.env.DEMO_TENANT_ID || '';
  return isUuid(configured) ? configured : DEFAULT_TENANT_ID;
}

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let output = '';

  for (const byte of bytes) {
    output += byte.toString(16).padStart(2, '0');
  }

  return output;
}

async function hashPassword(password: string, salt?: string): Promise<string> {
  const chosenSalt = salt || crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: enc.encode(chosenSalt),
      iterations: 210000,
    },
    key,
    256
  );

  return `${chosenSalt}.${toHex(derived)}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split('.');

  if (!salt || !hash) {
    return false;
  }

  const candidate = await hashPassword(password, salt);
  return candidate === storedHash;
}

function sanitizeUser(user: OwnerUser) {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

async function ensureSeededUsers() {
  if (!initPromise) {
    initPromise = (async () => {
      const email = 'owner.demo@example.com';
      const userExists = usersByEmail.has(email);

      if (userExists) {
        return;
      }

      const passwordHash = await hashPassword('DemoOwner123!');

      usersByEmail.set(email, {
        id: '0e8ca2b8-87ce-45cf-9564-f6f66328cb0f',
        tenantId: getTenantId(),
        email,
        firstName: 'Demo',
        lastName: 'Owner',
        phone: '(555) 555-0198',
        passwordHash,
        createdAt: new Date().toISOString(),
      });
    })();
  }

  await initPromise;
}

function createSession(email: string): string {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  sessions.set(token, { email, expiresAt });
  return token;
}

function setSessionCookie(context: Parameters<typeof setCookie>[0], token: string) {
  const secure = process.env.NODE_ENV === 'production';

  setCookie(context, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export const authRouter = new Hono();

authRouter.post('/register', async (c) => {
  await ensureSeededUsers();

  const body = await c.req.json();
  const parsed = RegisterRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration payload',
          details: parsed.error.flatten(),
          requestId: `req_${Date.now()}`,
        },
      },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  if (usersByEmail.has(email)) {
    return c.json(
      {
        error: {
          code: 'EMAIL_IN_USE',
          message: 'An account with this email already exists',
          requestId: `req_${Date.now()}`,
        },
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const user: OwnerUser = {
    id: crypto.randomUUID(),
    tenantId: getTenantId(),
    email,
    firstName: parsed.data.firstName.trim(),
    lastName: parsed.data.lastName.trim(),
    phone: parsed.data.phone?.trim() || undefined,
    passwordHash: await hashPassword(parsed.data.password),
    createdAt: now,
  };

  usersByEmail.set(email, user);

  const sessionToken = createSession(user.email);

  setSessionCookie(c, sessionToken);

  return c.json({
    data: {
      user: sanitizeUser(user),
      session: 'created',
    },
  });
});

authRouter.post('/login', async (c) => {
  await ensureSeededUsers();

  const body = await c.req.json();
  const parsed = LoginRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login payload',
          details: parsed.error.flatten(),
          requestId: `req_${Date.now()}`,
        },
      },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = usersByEmail.get(email);

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return c.json(
      {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect',
          requestId: `req_${Date.now()}`,
        },
      },
      { status: 401 }
    );
  }

  const sessionToken = createSession(user.email);

  setSessionCookie(c, sessionToken);

  return c.json({
    data: {
      user: sanitizeUser(user),
      session: 'active',
    },
  });
});

authRouter.get('/me', async (c) => {
  await ensureSeededUsers();

  const token = getCookie(c, SESSION_COOKIE_NAME);

  if (!token) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'No active session',
          requestId: `req_${Date.now()}`,
        },
      },
      { status: 401 }
    );
  }

  const session = sessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      sessions.delete(token);
    }

    deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });

    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session is invalid or expired',
          requestId: `req_${Date.now()}`,
        },
      },
      { status: 401 }
    );
  }

  const user = usersByEmail.get(session.email.toLowerCase());

  if (!user) {
    return c.json(
      {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Session user no longer exists',
          requestId: `req_${Date.now()}`,
        },
      },
      { status: 404 }
    );
  }

  return c.json({
    data: {
      user: sanitizeUser(user),
      session: 'active',
    },
  });
});

authRouter.post('/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE_NAME);

  if (token) {
    sessions.delete(token);
  }

  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });

  return c.json({
    data: {
      session: 'cleared',
    },
  });
});
