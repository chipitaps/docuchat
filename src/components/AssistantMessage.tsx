"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Markdown from "react-markdown";
import { prepareCitations } from "@/lib/citations";
import { highlightsOf, sourcesOf, textOf } from "@/lib/message";
import type { ChatMessage } from "@/lib/types";
import { SourceList, sourceDomId } from "./SourceList";

export function Pending({ label }: { label: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      {label}
    </span>
  );
}

/** The agent's turn: one bubble holding the answer and, under it, its sources. */
export function AssistantMessage({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming: boolean;
}) {
  const text = textOf(message);
  const sources = sourcesOf(message);
  const highlights = highlightsOf(message);

  const { text: linked, cited } = useMemo(
    () => prepareCitations(text, sources),
    [text, sources],
  );

  const [flash, setFlash] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function goToSource(label: number) {
    document
      .getElementById(sourceDomId(message.id, label))
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    setFlash(label);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(null), 1400);
  }

  // The turn failed before any text arrived (the error bubble explains why).
  if (!text && !streaming) return null;

  return (
    <div className="max-w-[94%] self-start rounded-lg border border-line bg-surface px-4 py-3.5 md:max-w-[90%]">
      {text ? (
        <div className="prose-chat">
          <Markdown
            // Model output is untrusted (documents can carry injected text):
            // no images that could leak data via URLs, and no outbound links.
            disallowedElements={["img"]}
            components={{
              a: ({ href, children }): ReactNode =>
                href?.startsWith("#cite-") ? (
                  <button
                    type="button"
                    className="cite"
                    aria-label={`Go to source ${children}`}
                    onClick={() => goToSource(Number(href.slice("#cite-".length)))}
                  >
                    {children}
                  </button>
                ) : (
                  <span>{children}</span>
                ),
            }}
          >
            {linked}
          </Markdown>
          {streaming && (
            <div className="mt-2">
              <Pending label="Writing" />
            </div>
          )}
        </div>
      ) : (
        <Pending label="Writing" />
      )}

      {cited.length > 0 && (
        <SourceList
          messageId={message.id}
          sources={cited}
          highlights={highlights}
          flash={flash}
        />
      )}
    </div>
  );
}
