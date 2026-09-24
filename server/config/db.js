import dotenv from "dotenv";
import tediousSql from "mssql";
import { readFile } from "node:fs/promises";
import { PostgresPool, postgresSql } from "./postgres.js";

// Load this once here because database driver selection happens while modules load.
dotenv.config({ quiet: true });

let driverSql = tediousSql;
const isPostgres = Boolean(process.env.DATABASE_URL) || process.env.DB_DRIVER === "postgres";

let poolPromise;

const requiredSettings = ["DB_SERVER", "DB_NAME", "DB_USER", "DB_PASSWORD"];

const getConfiguration = () => {
  if (process.env.DB_CONNECTION_STRING) {
    return { connectionString: process.env.DB_CONNECTION_STRING };
  }
  const missing = requiredSettings.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`SQL Server is not configured. Add ${missing.join(", ")} to server/.env.`);
  }

  return {
    server: process.env.DB_SERVER,
    port: Number(process.env.DB_PORT || 1433),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    pool: { max: Number(process.env.DB_POOL_MAX || 10), min: 0, idleTimeoutMillis: 30000 },
    options: {
      encrypt: process.env.DB_ENCRYPT !== "false",
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
      enableArithAbort: true,
    },
  };
};

export const connectDB = async () => {
  if (!poolPromise) {
    if (isPostgres) {
      if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be set when DB_DRIVER=postgres");
      poolPromise = Promise.resolve(new PostgresPool(process.env.DATABASE_URL))
        .then(async (pool) => {
          try {
            const schema = await readFile(new URL("../migrations-postgres/001_schema.sql", import.meta.url), "utf8");
            await pool.query(schema);
          } catch (error) {
            if (error.code !== "ENOENT") throw error;
            console.warn("PostgreSQL migration file is not bundled; using the schema created during deployment.");
          }
          console.log("PostgreSQL connected");
          return pool;
        })
        .catch((error) => {
          poolPromise = undefined;
          throw error;
        });
      return poolPromise;
    }
    if (process.env.DB_DRIVER === "msnodesqlv8") {
      const nativeSql = await import("mssql/msnodesqlv8.js");
      driverSql = nativeSql.default || nativeSql;
    }
    poolPromise = new driverSql.ConnectionPool(getConfiguration())
      .connect()
      .then((pool) => {
        pool.on("error", (error) => console.error("SQL Server pool error:", error.message));
        const configuredDatabase = process.env.DB_NAME || process.env.DB_CONNECTION_STRING?.match(/(?:^|;)Database=([^;]+)/i)?.[1] || "configured database";
        console.log(`SQL Server connected: ${configuredDatabase}`);
        return pool;
      })
      .catch((error) => {
        poolPromise = undefined;
        throw error;
      });
  }
  return poolPromise;
};

export const getPool = connectDB;

export const createRequest = async (transaction) => {
  if (isPostgres) {
    if (transaction) return transaction.request();
    const pool = await getPool();
    return pool.request();
  }
  if (transaction) return new driverSql.Request(transaction);
  const pool = await getPool();
  return pool.request();
};

export const withTransaction = async (callback) => {
  if (isPostgres) {
    const pool = await getPool();
    const client = await pool.connect();
    await client.query("BEGIN");
    try {
      const result = await callback(client);
      await client.query("COMMIT");
      client.release();
      return result;
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* preserve original error */ }
      client.release();
      throw error;
    }
  }
  const pool = await getPool();
  const transaction = new driverSql.Transaction(pool);
  await transaction.begin(driverSql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    try { await transaction.rollback(); } catch { /* preserve original error */ }
    throw error;
  }
};

export { isPostgres };
export const sql = isPostgres ? postgresSql : driverSql;
