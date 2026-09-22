import { neon } from "@neondatabase/serverless";
import { ConfigError } from "./http";

let client: ReturnType<typeof neon> | undefined;

/** Lazily created so `next build` works without DATABASE_URL. */
export function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new ConfigError("DATABASE_URL is not set.");
    client = neon(url);
  }
  return client;
}

/** pgvector accepts its text form: '[0.1,0.2,...]'. */
export const toVector = (values: number[]) => `[${values.join(",")}]`;
