import { unstable_cache } from "next/cache";
import { QueryResultRow } from "pg";

/**
 * The core DB execution logic (Not exported, used internally by the cache)
 */
async function runQuery<T extends QueryResultRow = any>(
  sql: string,
  params: any[] = []
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
  revalidate: number = 3600
): Promise<T[]> {
  // Create a unique cache key based on the SQL text and the parameters
  const cacheKey = [sql, JSON.stringify(params)];

  const cachedFetcher = unstable_cache(
    async (sql: string, params: any[]) => runQuery<T>(sql, params),
    cacheKey,
    {
      revalidate: revalidate,
      tags: ["db-results"], // Allows manual revalidation via revalidateTag("db-results")
    }
  );

  return cachedFetcher(sql, params);
}
