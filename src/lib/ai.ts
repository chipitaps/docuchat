import { createGoogle } from "@ai-sdk/google";
import { embed, embedMany } from "ai";
import {
  CHAT_MODEL,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
} from "./config";
import { ConfigError } from "./http";

function provider() {
  const apiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new ConfigError("GEMINI_API_KEY is not set.");
  return createGoogle({ apiKey });
}

export const chatModel = (id: string = CHAT_MODEL) => provider().languageModel(id);

const embeddingModel = () => provider().embedding(EMBEDDING_MODEL);

export async function embedDocuments(
  values: string[],
  abortSignal?: AbortSignal,
): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: embeddingModel(),
    values,
    abortSignal,
    maxRetries: 1,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: "RETRIEVAL_DOCUMENT",
      },
    },
  });
  return embeddings;
}

export async function embedQuery(value: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel(),
    value,
    maxRetries: 1,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
        taskType: "RETRIEVAL_QUERY",
      },
    },
  });
  return embedding;
}
