import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import { ConfigError } from "./http";

type Row = Record<string, unknown>;

export interface Db {
  query(text: string, params?: unknown[]): Promise<Row[]>;
}

const globalForDb = globalThis as typeof globalThis & { __docuchatDb?: Db };

export const isNeonUrl = (url: string) => {
  try {
    return new URL(url).hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
};

function connect(url: string): Db {
  if (isNeonUrl(url)) {
    const client = neon(url);
    return { query: async (text, params) => (await client.query(text, params)) as Row[] };
  }
  const pool = new Pool({ connectionString: url, max: 5 });
  return { query: async (text, params) => (await pool.query(text, params)).rows };
}

export function sql(): Db {
  if (!globalForDb.__docuchatDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new ConfigError("DATABASE_URL is not set.");
    globalForDb.__docuchatDb = connect(url);
  }
  return globalForDb.__docuchatDb;
}

export const toVector = (values: number[]) => `[${values.join(",")}]`;
