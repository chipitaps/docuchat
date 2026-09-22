export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-3.1-flash-lite";

// Used automatically when CHAT_MODEL is out of quota, overloaded or too slow.
// Free-tier daily limits are small and differ per model (gemini-3.6-flash, for
// one, allows only 20 requests a day), so a public demo depends on this.
export const FALLBACK_CHAT_MODEL =
  process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.5-flash-lite";
export const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";

// Must match the vector(N) column created by scripts/setup-db.mjs.
export const EMBEDDING_DIMENSIONS = 768;

export const CHUNK = { size: 1000, overlap: 150 } as const;

// Keeps a public demo inside the free tiers of Gemini and Neon.
export const LIMITS = {
  // Vercel Functions reject request bodies over 4.5 MB (413), so stay below it.
  maxFileBytes: 4 * 1024 * 1024,
  maxChunksPerDoc: 150,
  maxDocsPerSession: 5,
  maxQuestionChars: 1000,
  historyMessages: 10,
  topK: 5,
  retentionHours: 24,
} as const;

export const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".md"] as const;
