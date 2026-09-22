import { APICallError, RetryError } from "ai";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export class ConfigError extends Error {}

function providerStatus(error: unknown): number | undefined {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  return APICallError.isInstance(cause) ? cause.statusCode : undefined;
}

export function errorSummary(error: unknown): string {
  if (isTimeout(error)) return "timed out";
  const status = providerStatus(error);
  if (status) return `HTTP ${status}`;
  return error instanceof Error ? error.message.slice(0, 160) : String(error).slice(0, 160);
}

function isTimeout(error: unknown): boolean {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  return (
    cause instanceof Error &&
    (cause.name === "TimeoutError" || cause.name === "AbortError")
  );
}

export function friendlyMessage(error: unknown): string {
  if (isTimeout(error)) {
    return "Gemini took too long to answer, usually because of a usage limit. Try again in a minute.";
  }
  const status = providerStatus(error);
  if (status === 429) {
    return "The free Gemini quota is exhausted for now. Try again in a minute.";
  }
  if (status === 503) {
    return "Gemini is under heavy demand right now. Try again in a moment.";
  }
  console.error(error);
  return "The model failed to answer. Try again in a moment.";
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ConfigError) {
    console.error(error.message);
    const message =
      process.env.NODE_ENV === "production"
        ? "The demo isn't configured correctly."
        : error.message;
    return Response.json({ error: message }, { status: 500 });
  }
  const status = providerStatus(error);
  if (status === 429 || status === 503) {
    return Response.json({ error: friendlyMessage(error) }, { status });
  }
  if (isTimeout(error)) {
    return Response.json({ error: friendlyMessage(error) }, { status: 504 });
  }
  console.error(error);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}
