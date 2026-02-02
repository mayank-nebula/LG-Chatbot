import { unstable_cache } from "next/cache";

import { Pool, QueryResultRow } from "pg";

import { env } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var _pgPoolPromise: Promise<Pool> | undefined;
}

// 1. Create Pool
async function createPool(): Promise<Pool> {
  const dbHost = env.DB_HOST || "127.0.0.1";
  const dbPort = Number(env.DB_PORT) || 5432;
  const dbUser = env.DB_USER;
  const dbPassword = env.DB_PASSWORD;
  const dbName = env.DB_NAME;

  if (!dbUser || !dbPassword || !dbName) {
    throw new Error("DB_USER, DB_PASSWORD, and DB_NAME env vars are required.");
  }

  const pool = new Pool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    max: 5,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 5000,
  });

  pool.on("error", (err) => console.error("[pg] pool error", err));
  return pool;
}

function getPoolPromise(): Promise<Pool> {
  if (!global._pgPoolPromise) {
    global._pgPoolPromise = createPool();
  }
  return global._pgPoolPromise;
}

/**
 * The core DB execution logic (Not exported, used internally by the cache)
 */
async function runQuery<T extends QueryResultRow = any>(
  sql: string,
  params: any[] = [],
): Promise<T[]> {
  const pool = await getPoolPromise();
  const client = await pool.connect();
  try {
    const result = await client.query<T>(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * The Cached Query function
 * @param sql - The SQL string
 * @param params - Array of parameters
 * @param revalidate - Time in seconds (default 3600 / 1 hour)
 */
export async function query<T extends QueryResultRow = any>(
  sql: string,
  params: any[] = [],
  revalidate: number = 3600,
): Promise<T[]> {
  // Create a unique cache key based on the SQL text and the parameters
  const cacheKey = [sql, JSON.stringify(params)];

  const cachedFetcher = unstable_cache(
    async (sql: string, params: any[]) => runQuery<T>(sql, params),
    cacheKey,
    {
      revalidate: revalidate,
    },
  );

  return cachedFetcher(sql, params);
}
