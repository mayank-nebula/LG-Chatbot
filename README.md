Here is the complete, production-ready solution.

This setup handles 1,000 concurrent users safely on Cloud Run using AlloyDB. It includes:

Auto-Initialization: Tables are created automatically when the app starts.

Concurrency Locking: Uses SELECT FOR UPDATE to prevent race conditions.

Double Caching: Caches the Token (to save logins) and the Posts (to save API quota).

1. Install Dependencies
code
Bash
download
content_copy
expand_less
npm install pg axios
npm install --save-dev @types/pg
2. The Database Layer (lib/db.ts)

This file manages the connection pool and ensures tables exist before any query is run.

code
TypeScript
download
content_copy
expand_less
// lib/db.ts
import { Pool, QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPoolPromise: Promise<Pool> | undefined;
}

// 1. Create Pool
async function createPool(): Promise<Pool> {
  const dbHost = process.env.DB_HOST || "127.0.0.1";
  const dbPort = Number(process.env.DB_PORT) || 5432;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  if (!dbUser || !dbPassword || !dbName) {
    throw new Error("DB_USER, DB_PASSWORD, and DB_NAME env vars are required.");
  }

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
 * 2. AUTOMATIC INITIALIZATION (The "Migration" Logic)
 * Runs once on server start. Ensures tables exist.
 */
const dbInitPromise = (async () => {
  const pool = await getPoolPromise();
  const client = await pool.connect();
  try {
    console.log("🔄 Initializing AlloyDB Tables...");

    // A. Table for Auth Token (Single Row)
    await client.query(`
      CREATE TABLE IF NOT EXISTS linkedin_auth (
        id INT PRIMARY KEY DEFAULT 1,
        access_token TEXT,
        refresh_token TEXT,
        expires_at BIGINT,
        refresh_expires_at BIGINT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // B. Table for API Response Caching
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_cache (
        key TEXT PRIMARY KEY,
        data JSONB,
        expires_at BIGINT
      );
    `);

    // C. Seed Initial Refresh Token (Only if row is missing)
    if (process.env.LINKEDIN_REFRESH_TOKEN) {
      await client.query(`
        INSERT INTO linkedin_auth (id, access_token, refresh_token, expires_at, refresh_expires_at)
        VALUES (1, '', $1, 0, 0)
        ON CONFLICT (id) DO NOTHING;
      `, [process.env.LINKEDIN_REFRESH_TOKEN]);
    }

    console.log("✅ DB Tables Initialized.");
  } catch (err) {
    console.error("❌ DB Init Failed:", err);
  } finally {
    client.release();
  }
})();

// 3. Query Wrapper (Waits for Init)
export async function query<T extends QueryResultRow = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  await dbInitPromise; // Wait for tables to exist

  const pool = await getPoolPromise();
  const client = await pool.connect();
  try {
    const result = await client.query<T>(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// 4. Transaction Wrapper (Waits for Init)
export async function transaction<T>(
  fn: (client: {
    query: <R = any>(sql: string, params?: any[]) => Promise<{ rows: R[] }>;
  }) => Promise<T>
): Promise<T> {
  await dbInitPromise; // Wait for tables to exist

  const pool = await getPoolPromise();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Pass the transactional client to the callback
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
3. The Token Manager (lib/linkedin.ts)

This handles the heavy lifting: Locking, Expiry Checks, and Refreshing.

code
TypeScript
download
content_copy
expand_less
// lib/linkedin.ts
import { transaction } from "./db";
import axios from "axios";

export async function getAccessToken(): Promise<string> {
  // Use transaction to ensure ATOMIC operations (Locking)
  return await transaction(async (tx) => {
    
    // 1. LOCK ROW: "FOR UPDATE" makes all other concurrent users WAIT here
    const res = await tx.query(
      `SELECT * FROM linkedin_auth WHERE id = 1 FOR UPDATE`
    );

    if (res.rows.length === 0) throw new Error("DB Init failed: No auth row found.");

    const data = res.rows[0];
    const now = Date.now();
    
    // Convert BigInt strings to Numbers for comparison
    const expiresAt = Number(data.expires_at);
    const refreshExpiresAt = Number(data.refresh_expires_at);

    // 2. CHECK EXPIRY
    // Access Token Buffer: 5 minutes
    // Refresh Token Buffer: 30 days
    const isAccessExpired = !data.access_token || expiresAt < now + (5 * 60 * 1000);
    const isRefreshNearExpiry = refreshExpiresAt > 0 && refreshExpiresAt < now + (30 * 24 * 60 * 60 * 1000);

    // If everything is valid, return token immediately
    if (!isAccessExpired && !isRefreshNearExpiry) {
      return data.access_token;
    }

    // 3. REFRESH LOGIC (Only runs for 1 user, others wait)
    console.log("🔄 Refreshing LinkedIn Token...");

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', data.refresh_token);
    params.append('client_id', process.env.LINKEDIN_CLIENT_ID!);
    params.append('client_secret', process.env.LINKEDIN_CLIENT_SECRET!);

    const apiRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', params);
    
    const { 
      access_token, 
      expires_in, 
      refresh_token, 
      refresh_token_expires_in 
    } = apiRes.data;

    // Calculate new timestamps (expires_in is in seconds)
    const newExpiresAt = now + (expires_in * 1000);
    
    // Use new refresh token if provided, otherwise keep old one
    const newRefreshToken = refresh_token || data.refresh_token;
    
    // Calculate refresh expiry
    let newRefreshExpiresAt = refreshExpiresAt;
    if (refresh_token_expires_in) {
      newRefreshExpiresAt = now + (refresh_token_expires_in * 1000);
    } else if (refresh_token) {
      // Default to 1 year if new token given without explicit expiry
      newRefreshExpiresAt = now + (365 * 24 * 60 * 60 * 1000);
    }

    // 4. UPDATE DB
    await tx.query(
      `UPDATE linkedin_auth 
       SET access_token = $1, 
           expires_at = $2, 
           refresh_token = $3, 
           refresh_expires_at = $4,
           updated_at = NOW()
       WHERE id = 1`,
      [access_token, newExpiresAt, newRefreshToken, newRefreshExpiresAt]
    );

    return access_token;
  });
}
4. The API Endpoint (pages/api/posts.ts)

This checks the api_cache table first. If missing, it uses the Token Manager to fetch fresh data.

code
TypeScript
download
content_copy
expand_less
// pages/api/posts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db'; 
import { getAccessToken } from '../../lib/linkedin';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const page = Number(req.query.page) || 1;
  const orgId = process.env.LINKEDIN_ORG_ID;
  const pageSize = 10;
  
  // Cache Key & Duration (10 Minutes)
  const CACHE_KEY = `linkedin:posts:page:${page}`;
  const CACHE_TTL = 10 * 60 * 1000; 

  try {
    const now = Date.now();

    // 1. CHECK DB CACHE (Fast)
    // We select data where key matches AND it hasn't expired yet
    const cacheRes = await query(
      `SELECT data FROM api_cache WHERE key = $1 AND expires_at > $2`,
      [CACHE_KEY, now]
    );

    if (cacheRes.length > 0) {
      // Hit! Return cached JSON
      return res.status(200).json(cacheRes[0].data);
    }

    // 2. FETCH FROM LINKEDIN (Slow - Cache Miss)
    // getAccessToken handles all the auth locking automatically
    const token = await getAccessToken(); 
    
    const start = (Math.max(1, page) - 1) * pageSize;

    const response = await axios.get('https://api.linkedin.com/rest/posts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'LinkedIn-Version': '202306',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      params: {
        q: 'author',
        author: `urn:li:organization:${orgId}`,
        count: pageSize,
        start: start,
        sortBy: 'PUBLISHED'
      }
    });

    const resultData = {
      page: page,
      cached: false,
      posts: response.data.elements
    };

    // 3. SAVE TO DB CACHE (Upsert)
    // "ON CONFLICT" updates the row if it already exists
    await query(
      `INSERT INTO api_cache (key, data, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (key) 
       DO UPDATE SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`,
      [CACHE_KEY, JSON.stringify(resultData), now + CACHE_TTL]
    );

    return res.status(200).json(resultData);

  } catch (error: any) {
    console.error("API Error:", error.message);
    if (error.response?.status === 401) {
       return res.status(401).json({ error: "Token expired or invalid." });
    }
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
}
5. Environment Variables (.env.local)

Make sure these are set in your Google Cloud Run environment variables:

code
Ini
download
content_copy
expand_less
# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# LinkedIn
LINKEDIN_CLIENT_ID=your_id
LINKEDIN_CLIENT_SECRET=your_secret
LINKEDIN_ORG_ID=your_org_id
# Your 1-year refresh token (Used only once to seed the DB)
LINKEDIN_REFRESH_TOKEN=your_initial_refresh_token
