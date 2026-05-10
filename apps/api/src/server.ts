// This is a placeholder server.ts file for local development
// In production, Lambda/Wrangler will invoke the Hono app directly

import app from './index';

const port = parseInt(process.env.API_PORT || '3004', 10);

console.log(`🚀 Starting API server on http://localhost:${port}`);
console.log(`📚 API docs: http://localhost:${port}/api/v1`);
console.log(`💚 Health check: http://localhost:${port}/health`);

const server = Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running on http://localhost:${port}`);
