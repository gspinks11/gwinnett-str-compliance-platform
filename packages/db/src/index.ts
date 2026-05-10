import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { config as loadDotenv } from 'dotenv';
import path from 'path';
import * as schema from './schema';

export { schema };

// __dirname works in both tsx (CJS transform) and compiled JS.
// Walk up from packages/db/src → packages/db → packages → workspace root.
const workspaceRoot = path.resolve(__dirname, '../../..');

// Prefer local overrides first, then fallback to shared defaults.
loadDotenv({ path: path.join(workspaceRoot, '.env.local') });
loadDotenv({ path: path.join(workspaceRoot, '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const client = new Client({
  connectionString,
});

let isConnected = false;
let connectInFlight: Promise<void> | null = null;

export const db = drizzle(client, { schema });

export async function connectDb() {
  if (isConnected) return;
  if (connectInFlight) {
    await connectInFlight;
    return;
  }

  connectInFlight = client
    .connect()
    .then(() => {
      isConnected = true;
    })
    .catch((error) => {
      if (error instanceof Error && error.message.includes('already been connected')) {
        isConnected = true;
        return;
      }
      throw error;
    })
    .finally(() => {
      connectInFlight = null;
    });

  await connectInFlight;
}

export async function disconnectDb() {
  if (!isConnected) return;
  await client.end();
  isConnected = false;
}

export default db;
