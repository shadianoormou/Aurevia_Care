import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB } from "../config/db.js";

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations-postgres");
const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
const pool = await connectDB();

try {
  for (const file of files) {
    const text = await fs.readFile(path.join(directory, file), "utf8");
    await pool.query(text);
    console.log(`Applied PostgreSQL migration: ${file}`);
  }
} finally {
  await pool.close();
}

