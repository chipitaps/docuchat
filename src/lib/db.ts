import { neon } from "@neondatabase/serverless";
import { ConfigError } from "./http";

let client: ReturnType<typeof neon> | undefined;

export function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new ConfigError("DATABASE_URL is not set.");
    client = neon(url);
  }
  return client;
}

export const toVector = (values: number[]) => `[${values.join(",")}]`;
