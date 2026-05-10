import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';

// Import routes (will create these next)
import { authRouter } from './routes/auth';
// import { applicationsRouter } from './routes/applications';

const app = new Hono();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3003')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) {
        return allowedOrigins[0] || 'http://localhost:3000';
      }

      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || 'http://localhost:3000';
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use('*', logger());

// Error handling
app.onError((error, context) => {
  console.error('API Error:', error);

  if (error instanceof HTTPException) {
    return error.getResponse();
  }

  const requestId = `req_${Date.now()}`;

  return context.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
        requestId,
      },
    },
    { status: 500 }
  );
});

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/api/v1', (c) => {
  return c.json({
    version: 'v1',
    environment: process.env.NODE_ENV || 'development',
    message: 'Sentinel STR API',
  });
});

// Register routers (routes will be added in Phase 1)
app.route('/api/v1/public/auth', authRouter);
// app.route('/api/v1/public/applications', applicationsRouter);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        requestId: `req_${Date.now()}`,
      },
    },
    { status: 404 }
  );
});

export default app;
