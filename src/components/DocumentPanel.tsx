"use client";

import { useRef, useState } from "react";
import { ACCEPTED_EXTENSIONS, LIMITS } from "@/lib/config";
import type { DocumentSummary } from "@/lib/types";

type Props = {
  documents: DocumentSummary[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  onUpload: (files: File[]) => void;
  onDelete: (id: string) => void;
  onLoadSample: () => void;
};

const label = "font-mono text-[11px] uppercase tracking-wider text-muted";

export function DocumentPanel({
  documents,
  loading,
  uploading,
  error,
  onUpload,
  onDelete,
  onLoadSample,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const full = documents.length >= LIMITS.maxDocsPerSession;

  return (
    <aside className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      <div className="hidden md:block">
        <h1 className="font-serif text-2xl leading-none">DocuChat</h1>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Answers from your own documents, with the supporting passage highlighted.
        </p>
      </div>

      <section>
        <div className={`mb-2 flex items-baseline justify-between ${label}`}>
          <h2>Documents</h2>
          <span>
            {documents.length}/{LIMITS.maxDocsPerSession}
          </span>
        </div>

        <ul className="border-t border-line">
          {loading && (
            <li className="border-b border-line py-2.5 font-mono text-xs text-muted">Loading…</li>
          )}
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 border-b border-line py-2.5"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm" title={doc.name}>
                  {doc.name}
                </span>
                <span className="font-mono text-[11px] text-muted">{doc.chunkCount} chunks</span>
              </span>
              <button
                type="button"
                onClick={() => onDelete(doc.id)}
                aria-label={`Remove ${doc.name}`}
                className="font-mono text-[11px] text-muted underline decoration-line underline-offset-4 hover:text-danger hover:decoration-danger"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={uploading || full}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!uploading && !full) onUpload(Array.from(event.dataTransfer.files));
          }}
          className={`rounded-md border border-dashed px-3 py-4 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            dragging ? "border-ink bg-ink/[0.04]" : "border-line hover:border-ink"
          }`}
        >
          {uploading ? (
            <span className="text-muted">Reading and indexing…</span>
          ) : (
            <>
              <span className="block font-medium">Add a document</span>
              <span className="mt-0.5 block font-mono text-[11px] text-muted">
                {ACCEPTED_EXTENSIONS.join(" ")} · up to {LIMITS.maxFileBytes / 1024 / 1024} MB
              </span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={(event) => {
            onUpload(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />

        {error && (
          <p role="alert" className="text-xs leading-relaxed text-danger">
            {error}
          </p>
        )}

        {!loading && documents.length === 0 && (
          <button
            type="button"
            disabled={uploading}
            onClick={onLoadSample}
            className="self-start text-sm underline decoration-line underline-offset-4 hover:decoration-ink disabled:opacity-40"
          >
            Try the sample document
          </button>
        )}
      </div>

      <p className="mt-auto font-mono text-[11px] leading-relaxed text-muted">
        Next.js · Gemini · pgvector
        <br />
        Files are deleted after {LIMITS.retentionHours}h.
      </p>
    </aside>
  );
}
