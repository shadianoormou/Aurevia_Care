import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { connectDB } from "../config/db.js";

dotenv.config();
const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");

try {
  const pool = await connectDB();
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    await pool.request().batch(await fs.readFile(path.join(directory, file), "utf8"));
    console.log(`Applied ${file}`);
  }
  await pool.close();
  process.exit(0);
} catch (error) {
  console.error(`Migration failed: ${error.message}`);
  process.exit(1);
}
