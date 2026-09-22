import type { UIMessage } from "ai";
import type { Highlights } from "./highlight";
import type { Source } from "./retrieval";

export type ChatMessage = UIMessage<never, { sources: Source[]; highlights: Highlights }>;

export type DocumentSummary = {
  id: string;
  name: string;
  chunkCount: number;
  createdAt: string;
};
