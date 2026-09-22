import { APICallError, RetryError } from "ai";
import { describe, expect, it, vi } from "vitest";
import { errorResponse, friendlyMessage, HttpError } from "./http";

function retried(statusCode: number) {
  const cause = new APICallError({
    message: "provider failure",
    url: "https://example.test",
    requestBodyValues: {},
    statusCode,
  });
  return new RetryError({
    message: "Failed after 3 attempts",
    reason: "maxRetriesExceeded",
    errors: [cause, cause, cause],
  });
}

describe("friendlyMessage", () => {
  it("explains quota exhaustion, even when wrapped in a RetryError", () => {
    expect(friendlyMessage(retried(429))).toMatch(/quota/i);
  });

  it("explains provider overload (503)", () => {
    expect(friendlyMessage(retried(503))).toMatch(/heavy demand/i);
  });

  it("explains timeouts, also when they come out of a retry", () => {
    const timeout = new DOMException("The operation timed out", "TimeoutError");
    expect(friendlyMessage(timeout)).toMatch(/too long/i);

    const wrapped = new RetryError({
      message: "Failed after 2 attempts",
      reason: "maxRetriesExceeded",
      errors: [timeout],
    });
    expect(friendlyMessage(wrapped)).toMatch(/too long/i);
  });

  it("never leaks raw error text for unknown failures", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const message = friendlyMessage(new Error("secret internal detail"));
    expect(message).not.toMatch(/secret/);
  });
});

describe("errorResponse", () => {
  it("passes HttpError status and message through", async () => {
    const res = errorResponse(new HttpError(413, "too big"));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "too big" });
  });

  it("keeps the upstream status for retried 429 and 503 errors", () => {
    expect(errorResponse(retried(429)).status).toBe(429);
    expect(errorResponse(retried(503)).status).toBe(503);
  });

  it("answers 504 when we gave up waiting for the provider", () => {
    const timeout = new DOMException("The operation timed out", "TimeoutError");
    expect(errorResponse(timeout).status).toBe(504);
  });

  it("hides unexpected errors behind a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = errorResponse(new Error("db password is hunter2"));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toMatch(/hunter2/);
  });
});
