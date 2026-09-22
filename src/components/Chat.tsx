"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { LIMITS } from "@/lib/config";
import { textOf } from "@/lib/message";
import type { ChatMessage } from "@/lib/types";
import { AssistantMessage, Pending } from "./AssistantMessage";

const SUGGESTIONS = [
  "Summarize this document",
  "What are the key points?",
  "What is not covered here?",
];

function readableError(error: Error): string {
  try {
    const parsed = JSON.parse(error.message);
    if (typeof parsed?.error === "string") return parsed.error;
  } catch {}
  return error.message || "Something went wrong.";
}

export function Chat({ hasDocuments }: { hasDocuments: boolean }) {
  const { messages, sendMessage, regenerate, stop, status, error, clearError } =
    useChat<ChatMessage>();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const waiting = status === "submitted";
  const streaming = status === "streaming";
  const busy = waiting || streaming;
  const lastId = messages.at(-1)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  function submit(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    clearError();
    sendMessage({ text: question });
    setInput("");
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto" aria-live="polite">
        <div className="mx-auto flex w-full max-w-[46rem] flex-col gap-5 px-4 py-8 md:px-8 md:py-10">
          {messages.length === 0 && (
            <div>
              <h2 className="font-serif text-3xl leading-tight">
                {hasDocuments ? "Ask about your documents." : "No documents yet."}
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
                {hasDocuments
                  ? "Answers come only from your files, and the passage each one relies on is highlighted."
                  : "Add a PDF, text or Markdown file, or load the sample, then ask a question."}
              </p>
              {hasDocuments && (
                <ul className="mt-6 flex flex-col items-start gap-2 text-sm">
                  {SUGGESTIONS.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => submit(suggestion)}
                        className="underline decoration-line underline-offset-4 hover:decoration-ink"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {messages.map((message) =>
            message.role === "user" ? (
              <div
                key={message.id}
                className="max-w-[85%] self-end whitespace-pre-wrap rounded-lg bg-ink px-3.5 py-2.5 text-sm leading-relaxed text-paper"
              >
                {textOf(message)}
              </div>
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
                streaming={streaming && message.id === lastId}
              />
            ),
          )}

          {waiting && (
            <div className="self-start rounded-lg border border-line bg-surface px-4 py-3.5">
              <Pending label="Searching your documents" />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="self-start rounded-lg border border-danger/40 bg-surface px-4 py-3.5 text-sm"
            >
              <p className="text-danger">{readableError(error)}</p>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  regenerate();
                }}
                className="mt-2 font-mono text-[11px] underline decoration-line underline-offset-4 hover:decoration-ink"
              >
                Try again
              </button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
        className="shrink-0 border-t border-line px-4 py-3 md:px-8"
      >
        <div className="mx-auto flex max-w-[46rem] items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={LIMITS.maxQuestionChars}
            placeholder={hasDocuments ? "Ask about your documents" : "Add a document first"}
            aria-label="Your question"
            className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-ink"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              className="rounded-md border border-ink px-4 py-2.5 text-sm font-medium"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper disabled:opacity-30"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
