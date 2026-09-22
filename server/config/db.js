import dotenv from "dotenv";
import tediousSql from "mssql";
import nativeSql from "mssql/msnodesqlv8.js";

// Load this once here because database driver selection happens while modules load.
dotenv.config({ quiet: true });

const sql = process.env.DB_DRIVER === "msnodesqlv8" ? nativeSql : tediousSql;

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
    poolPromise = new sql.ConnectionPool(getConfiguration())
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
  if (transaction) return new sql.Request(transaction);
  const pool = await getPool();
  return pool.request();
};

export const withTransaction = async (callback) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    try { await transaction.rollback(); } catch { /* preserve original error */ }
    throw error;
  }
};

export { sql };
