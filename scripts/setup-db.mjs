import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}

const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const statements = schema
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

if (new URL(url).hostname.endsWith(".neon.tech")) {
  const sql = neon(url);
  for (const statement of statements) await sql.query(statement);
} else {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  for (const statement of statements) await client.query(statement);
  await client.end();
}

console.log("Database ready.");
