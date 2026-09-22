export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-3.1-flash-lite";

export const FALLBACK_CHAT_MODEL =
  process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.5-flash-lite";
export const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";

export const EMBEDDING_DIMENSIONS = 768;

export const CHUNK = { size: 1000, overlap: 150 } as const;

export const LIMITS = {
  maxFileBytes: 4 * 1024 * 1024,
  maxChunksPerDoc: 150,
  maxDocsPerSession: 5,
  maxQuestionChars: 1000,
  historyMessages: 10,
  topK: 5,
  retentionHours: 24,
} as const;

export const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".md"] as const;
