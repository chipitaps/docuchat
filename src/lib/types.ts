import type { UIMessage } from "ai";
import type { Highlights } from "./highlight";
import type { Source } from "./retrieval";

/**
 * Assistant turns carry two data parts: the retrieved `sources` (sent before
 * the answer starts, so citations resolve while it streams) and, a moment
 * later, the `highlights` marking the supporting sentence inside each one.
 */
export type ChatMessage = UIMessage<never, { sources: Source[]; highlights: Highlights }>;

export type DocumentSummary = {
  id: string;
  name: string;
  chunkCount: number;
  createdAt: string;
};
