import type { Highlights } from "./highlight";
import type { Source } from "./retrieval";
import type { ChatMessage } from "./types";

export const textOf = (message: ChatMessage): string =>
  message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("");

export const sourcesOf = (message: ChatMessage): Source[] =>
  message.parts.flatMap((part) => (part.type === "data-sources" ? [part.data] : []))[0] ?? [];

export const highlightsOf = (message: ChatMessage): Highlights =>
  message.parts.flatMap((part) => (part.type === "data-highlights" ? [part.data] : []))[0] ?? {};
