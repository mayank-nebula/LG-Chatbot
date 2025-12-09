// /lib/db.ts
import { Pool, QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPoolPromise: Promise<Pool> | undefined;
}

async function createPool(): Promise<Pool> {
  // When running locally with the Auth Proxy, the host is localhost
  const dbHost = process.env.DB_HOST || "127.0.0.1";
  const dbPort = Number(process.env.DB_PORT) || 5432;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  if (!dbUser || !dbPassword || !dbName) {
    throw new Error("DB_USER, DB_PASSWORD, and DB_NAME env vars are required.");
  }

  // Create standard PG Pool
  const pool = new Pool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    max: Number(process.env.DB_MAX_CLIENTS || 5),
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS || 5000),
  });

  pool.on("connect", () => {
    console.log("[pg] new client connected");
  });

  pool.on("error", (err) => {
    console.error("[pg] pool error", err);
  });

  return pool;
}

function getPoolPromise(): Promise<Pool> {
  if (!global._pgPoolPromise) {
    global._pgPoolPromise = createPool();
  }
  return global._pgPoolPromise;
}

// Warm up the pool
// export const dbReady = (async () => {
//   try {
//     const pool = await getPoolPromise();
//     const client = await pool.connect();
//     client.release();
//     console.log("DB pool warmed and ready.");
//   } catch (err) {
//     console.error("Failed to warm DB pool:", err);
//   }
// })();

export async function query<T extends QueryResultRow = any>(
  sql: string,
  params?: any[]
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

export async function transaction<T>(
  fn: (client: {
    query: <R = any>(sql: string, params?: any[]) => Promise<{ rows: R[] }>;
  }) => Promise<T>
): Promise<T> {
  const pool = await getPoolPromise();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn({
      query: async (sql: string, params?: any[]) => {
        const r = await client.query(sql, params);
        return { rows: r.rows };
      },
    });
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rbErr) {
      console.error("rollback failed", rbErr);
    }
    throw err;
  } finally {
    client.release();
  }
}
