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
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  pool.on("error", (err) => console.error("[pg] pool error", err));
  return pool;
}







