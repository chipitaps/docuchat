type Part = { type: string };

export async function firstThatStreams<T extends Part>(
  attempts: Array<() => ReadableStream<T>>,
  onFallback?: (error: unknown, attemptIndex: number) => void,
): Promise<ReadableStream<T>> {
  for (let i = 0; i < attempts.length; i++) {
    const reader = attempts[i]().getReader();
    const buffered: T[] = [];
    let failure: { error: unknown } | undefined;
    let ended = false;

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
