import { Pool, QueryResultRow } from "pg";

// Global cache (for dev hot reload + serverless reuse)
declare global {
  // eslint-disable-next-line no-var
  var _pool: Pool | undefined;
}

function createPool() {
  return new Pool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export const db: Pool = global._pool || (global._pool = createPool());

export async function query<T extends QueryResultRow>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const client = await db.connect();
  try {
    const result = await client.query<T>(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}
