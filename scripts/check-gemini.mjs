import { createGoogle } from "@ai-sdk/google";
import { embed, generateText } from "ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set. Add it to .env.local first.");
  process.exit(1);
}

const primary = process.env.GEMINI_CHAT_MODEL ?? "gemini-3.1-flash-lite";
const fallback = process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.5-flash-lite";
const embedId = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
const google = createGoogle({ apiKey });

const describeError = (error) => `${error.statusCode ?? error.name}: ${String(error.message).slice(0, 110)}`;

let chatOk = 0;
for (const id of new Set([primary, fallback])) {
  const role = id === primary ? "primary " : "fallback";
  try {
    const { text } = await generateText({
      model: google.languageModel(id),
      prompt: "Reply with the single word: ok",
      maxRetries: 0,
      timeout: 20_000,
    });
    console.log(`chat      ${role} ${id}: ${text.trim()}`);
    chatOk++;
  } catch (error) {
    console.log(`chat      ${role} ${id}: FAILED (${describeError(error)})`);
  }
}

let embeddingOk = true;
try {
  const { embedding } = await embed({
    model: google.embedding(embedId),
    value: "hello world",
    providerOptions: { google: { outputDimensionality: 768 } },
  });
  console.log(`embedding ${embedId}: ${embedding.length} dimensions`);
} catch (error) {
  embeddingOk = false;
  console.log(`embedding ${embedId}: FAILED (${describeError(error)})`);
}

if (chatOk === 0 || !embeddingOk) {
  console.error("\nThe app cannot work: it needs at least one chat model and the embedding model.");
  process.exit(1);
}
