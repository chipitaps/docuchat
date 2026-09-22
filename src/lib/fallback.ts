type Part = { type: string };

/**
 * Starts the attempts in order and returns the first stream that gets as far
 * as producing text. An attempt is abandoned when it errors or aborts before
 * emitting any text (quota, overload, timeout), and the next one takes over.
 * The last attempt is returned as-is, so its error still reaches the client.
 *
 * Nothing has been sent to the user when we switch, so the fallback is
 * invisible apart from a slightly later first word.
 */
export async function firstThatStreams<T extends Part>(
  attempts: Array<() => ReadableStream<T>>,
  onFallback?: (error: unknown, attemptIndex: number) => void,
): Promise<ReadableStream<T>> {
  for (let i = 0; i < attempts.length; i++) {
    const reader = attempts[i]().getReader();
    const buffered: T[] = [];
    let failure: { error: unknown } | undefined;
    let ended = false;

    // Read until the stream shows whether it works: first text, or a failure.
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        ended = true;
        break;
      }
      buffered.push(value);
      if (value.type === "text-delta") break;
      if (value.type === "error" || value.type === "abort") {
        failure = { error: (value as { error?: unknown }).error };
        break;
      }
    }

    if (failure && i < attempts.length - 1) {
      reader.cancel().catch(() => {});
      onFallback?.(failure.error, i);
      continue;
    }

    return new ReadableStream<T>({
      start(controller) {
        for (const part of buffered) controller.enqueue(part);
        if (ended) controller.close();
      },
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) controller.close();
        else controller.enqueue(value);
      },
      cancel: (reason) => reader.cancel(reason),
    });
  }
  throw new Error("firstThatStreams needs at least one attempt");
}
