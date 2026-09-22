"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentSummary } from "@/lib/types";
import { Chat } from "./Chat";
import { DocumentPanel } from "./DocumentPanel";

async function errorFrom(res: Response): Promise<string> {
  try {
    return (await res.json()).error ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export function DocuChat() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/documents")
      .then(async (res) => {
        if (!res.ok) throw new Error(await errorFrom(res));
        return res.json();
      })
      .then((data) => !cancelled && setDocuments(data.documents))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const upload = useCallback(async (files: File[]) => {
    setError(null);
    setUploading(true);
    for (const file of files) {
      const body = new FormData();
      body.set("file", file);
      try {
        const res = await fetch("/api/documents", { method: "POST", body });
        if (!res.ok) {
          setError(`${file.name}: ${await errorFrom(res)}`);
          break;
        }
        const { document } = await res.json();
        setDocuments((docs) => [document, ...docs]);
      } catch {
        setError(`${file.name}: network error.`);
        break;
      }
    }
    setUploading(false);
  }, []);

  const loadSample = useCallback(async () => {
    const res = await fetch("/sample.md");
    const blob = await res.blob();
    await upload([new File([blob], "how-docuchat-works.md", { type: "text/markdown" })]);
  }, [upload]);

  const remove = useCallback(async (id: string) => {
    setError(null);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) return setError(await errorFrom(res));
    setDocuments((docs) => docs.filter((d) => d.id !== id));
  }, []);

  const showPanel = panelOpen || (!loading && documents.length === 0);

  return (
    <div className="flex h-dvh flex-col md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3 md:hidden">
        <h1 className="font-serif text-xl leading-none">DocuChat</h1>
        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          aria-expanded={showPanel}
          className="font-mono text-xs underline decoration-line underline-offset-4"
        >
          Documents · {documents.length}
        </button>
      </header>

      <div
        className={`${showPanel ? "block" : "hidden"} max-h-[60dvh] shrink-0 overflow-y-auto border-b border-line md:block md:h-full md:max-h-none md:border-b-0 md:border-r`}
      >
        <DocumentPanel
          documents={documents}
          loading={loading}
          uploading={uploading}
          error={error}
          onUpload={upload}
          onDelete={remove}
          onLoadSample={loadSample}
        />
      </div>

      <main className="flex min-h-0 flex-1 flex-col">
        <Chat hasDocuments={documents.length > 0} />
      </main>
    </div>
  );
}
