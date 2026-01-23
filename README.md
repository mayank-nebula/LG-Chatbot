export async function query<T extends QueryResultRow = any>(
  sql: string,
  params?: any[],
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
