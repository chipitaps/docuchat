import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}

const sql = neon(url);
const DIMENSIONS = 768;

const statements = [
  `create extension if not exists vector`,
  `create table if not exists documents (
     id          uuid primary key default gen_random_uuid(),
     session_id  text not null,
     name        text not null,
     chunk_count int  not null default 0,
     created_at  timestamptz not null default now()
   )`,
  `create index if not exists documents_session_idx on documents (session_id)`,
  `create table if not exists chunks (
     id          bigserial primary key,
     document_id uuid not null references documents (id) on delete cascade,
     session_id  text not null,
     chunk_index int  not null,
     content     text not null,
     embedding   vector(${DIMENSIONS}) not null
   )`,
  `create index if not exists chunks_session_idx on chunks (session_id)`,
  `create index if not exists chunks_document_idx on chunks (document_id)`,
];

for (const statement of statements) {
  await sql.query(statement);
}
console.log("Database ready.");
