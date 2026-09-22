import { describe, expect, it, vi } from "vitest";
import { firstThatStreams } from "./fallback";

type Part = { type: string; text?: string; error?: unknown };

const streamOf = (parts: Part[]) =>
  new ReadableStream<Part>({
    start(controller) {
      for (const part of parts) controller.enqueue(part);
      controller.close();
    },
  });

async function collect(stream: ReadableStream<Part>) {
  const out: Part[] = [];
  for (const reader = stream.getReader(); ; ) {
    const { done, value } = await reader.read();
    if (done) return out;
    out.push(value);
  }
}

const ok: Part[] = [
  { type: "start" },
  { type: "text-delta", text: "Hello" },
  { type: "text-delta", text: " world" },
  { type: "finish" },
];

describe("firstThatStreams", () => {
  it("uses the first attempt when it produces text, without starting the rest", async () => {
    const fallback = vi.fn(() => streamOf(ok));
    const stream = await firstThatStreams([() => streamOf(ok), fallback]);

    expect(await collect(stream)).toEqual(ok);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("falls back when the first attempt errors before any text", async () => {
    const quota = new Error("quota");
    const onFallback = vi.fn();
    const stream = await firstThatStreams(
      [() => streamOf([{ type: "start" }, { type: "error", error: quota }]), () => streamOf(ok)],
      onFallback,
    );

    expect(await collect(stream)).toEqual(ok);
    expect(onFallback).toHaveBeenCalledWith(quota, 0);
  });

  it("falls back when the first attempt aborts (timeout)", async () => {
    const stream = await firstThatStreams([
      () => streamOf([{ type: "abort" }]),
      () => streamOf(ok),
    ]);
    expect(await collect(stream)).toEqual(ok);
  });

  it("can chain through several failing attempts", async () => {
    const fail = () => streamOf([{ type: "error", error: "x" }]);
    const stream = await firstThatStreams([fail, fail, () => streamOf(ok)]);
    expect(await collect(stream)).toEqual(ok);
  });

  it("returns the last attempt unchanged when every attempt fails, so the error reaches the client", async () => {
    const parts: Part[] = [{ type: "start" }, { type: "error", error: "still down" }, { type: "finish" }];
    const stream = await firstThatStreams([
      () => streamOf([{ type: "error", error: "down" }]),
      () => streamOf(parts),
    ]);
    expect(await collect(stream)).toEqual(parts);
  });

  it("keeps an attempt that fails AFTER it started streaming text", async () => {
    // The user already saw words, so switching models would duplicate the answer.
    const parts: Part[] = [
      { type: "text-delta", text: "Par" },
      { type: "error", error: "connection lost" },
    ];
    const fallback = vi.fn(() => streamOf(ok));
    const stream = await firstThatStreams([() => streamOf(parts), fallback]);

    expect(await collect(stream)).toEqual(parts);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("does not treat an empty but successful stream as a failure", async () => {
    const empty: Part[] = [{ type: "start" }, { type: "finish" }];
    const fallback = vi.fn(() => streamOf(ok));
    const stream = await firstThatStreams([() => streamOf(empty), fallback]);

    expect(await collect(stream)).toEqual(empty);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("rejects an empty list of attempts", async () => {
    await expect(firstThatStreams([])).rejects.toThrow();
  });
});
