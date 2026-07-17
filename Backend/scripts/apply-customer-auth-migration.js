import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const sqlPath = path.resolve("prisma/customer-auth-and-categories.sql");
const sql = await fs.readFile(sqlPath, "utf8");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

try {
  await pool.query(sql);
  console.log("Applied customer auth/category migration.");
} finally {
  await pool.end();
}
