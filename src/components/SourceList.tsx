"use client";

import { useState } from "react";
import type { CitedSource } from "@/lib/citations";
import { buildExcerpt, stripHeadings } from "@/lib/excerpt";
import type { Highlights } from "@/lib/highlight";

type Props = {
  messageId: string;
  sources: CitedSource[];
  highlights: Highlights;
  flash: number | null;
};

export const sourceDomId = (messageId: string, label: number) => `src-${messageId}-${label}`;

export function SourceList({ messageId, sources, highlights, flash }: Props) {
  return (
    <div className="mt-4 border-t border-line pt-3">
      <p className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
        Sources
      </p>
      <ol className="flex flex-col gap-1">
        {sources.map((source) => (
          <SourceRow
            key={source.id}
            id={sourceDomId(messageId, source.label)}
            source={source}
            ranges={highlights[source.id] ?? []}
            flash={flash === source.label}
          />
        ))}
      </ol>
    </div>
  );
}

function SourceRow({
  id,
  source,
  ranges,
  flash,
}: {
  id: string;
  source: CitedSource;
  ranges: Highlights[number];
  flash: boolean;
}) {
  const [full, setFull] = useState(false);

  const short = buildExcerpt(source.content, ranges);
  const view = full ? buildExcerpt(source.content, ranges, { full: true }) : short;
  const canExpand = short.leading || short.trailing;

  return (
    <li
      id={id}
      className={`grid grid-cols-[1.6rem_1fr] items-start gap-x-1 rounded-md px-1.5 py-1.5 transition-colors duration-500 ${
        flash ? "bg-ink/[0.06]" : ""
      }`}
    >
      <span className="cite mt-0.5 !mx-0">{source.label}</span>
      <div className="min-w-0">
        <p
          className="truncate font-mono text-xs"
          title={`${source.name} · similarity ${source.score.toFixed(2)}`}
        >
          {source.name}
        </p>
        <blockquote
          className={`mt-1 text-[13px] leading-relaxed text-muted ${
            full ? "whitespace-pre-line" : "whitespace-normal"
          }`}
        >
          {view.leading && "… "}
          {view.segments.map((segment, i) =>
            segment.marked ? (
              <mark key={i}>{segment.text}</mark>
            ) : (
              stripHeadings(segment.text)
            ),
          )}
          {view.trailing && " …"}
        </blockquote>
        {canExpand && (
          <button
            type="button"
            onClick={() => setFull((value) => !value)}
            aria-expanded={full}
            className="mt-1 font-mono text-[11px] text-muted underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink"
          >
            {full ? "Show less" : "Show full passage"}
          </button>
        )}
      </div>
    </li>
  );
}
