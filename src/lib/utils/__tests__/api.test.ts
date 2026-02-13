import { describe, it, expect } from "vitest";
import { parsePagination, ApiError, apiResponse, apiError } from "../api";

// =============================================================================
// parsePagination
// =============================================================================

describe("parsePagination", () => {
  it("returns defaults when no params are provided", () => {
    const params = new URLSearchParams();
    const result = parsePagination(params);
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it("parses page and limit", () => {
    const params = new URLSearchParams({ page: "3", limit: "50" });
    const result = parsePagination(params);
    expect(result).toEqual({ page: 3, limit: 50, offset: 100 });
  });

  it("clamps page to minimum of 1", () => {
    const params = new URLSearchParams({ page: "0" });
    const result = parsePagination(params);
    expect(result.page).toBe(1);
  });

  it("clamps negative page to 1", () => {
    const params = new URLSearchParams({ page: "-5" });
    const result = parsePagination(params);
    expect(result.page).toBe(1);
  });

  it("clamps limit to maximum of 100", () => {
    const params = new URLSearchParams({ limit: "500" });
    const result = parsePagination(params);
    expect(result.limit).toBe(100);
  });

  it("falls back to default limit of 20 when limit is 0 (falsy)", () => {
    const params = new URLSearchParams({ limit: "0" });
    const result = parsePagination(params);
    // parseInt("0") = 0, which is falsy, so the || 20 fallback triggers
    expect(result.limit).toBe(20);
  });

  it("clamps limit to minimum of 1 for small positive values", () => {
    const params = new URLSearchParams({ limit: "1" });
    const result = parsePagination(params);
    expect(result.limit).toBe(1);
  });

  it("handles non-numeric page gracefully", () => {
    const params = new URLSearchParams({ page: "abc" });
    const result = parsePagination(params);
    expect(result.page).toBe(1);
  });

  it("handles non-numeric limit gracefully", () => {
    const params = new URLSearchParams({ limit: "xyz" });
    const result = parsePagination(params);
    expect(result.limit).toBe(20);
  });

  it("calculates correct offset", () => {
    const params = new URLSearchParams({ page: "5", limit: "10" });
    const result = parsePagination(params);
    expect(result.offset).toBe(40); // (5-1) * 10
  });
});

// =============================================================================
// ApiError
// =============================================================================

describe("ApiError", () => {
  it("creates an error with default status 400", () => {
    const err = new ApiError("Bad request");
    expect(err.message).toBe("Bad request");
    expect(err.status).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.name).toBe("ApiError");
  });

  it("creates an error with custom status", () => {
    const err = new ApiError("Not found", 404);
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("allows custom code override", () => {
    const err = new ApiError("Custom error", 400, "CUSTOM_CODE");
    expect(err.code).toBe("CUSTOM_CODE");
  });

  it("includes details when provided", () => {
    const details = { field: "email", reason: "invalid" };
    const err = new ApiError("Validation error", 422, undefined, details);
    expect(err.details).toEqual(details);
  });

  it("derives correct codes for common statuses", () => {
    expect(new ApiError("", 401).code).toBe("UNAUTHORIZED");
    expect(new ApiError("", 403).code).toBe("FORBIDDEN");
    expect(new ApiError("", 409).code).toBe("CONFLICT");
    expect(new ApiError("", 422).code).toBe("VALIDATION_ERROR");
    expect(new ApiError("", 429).code).toBe("RATE_LIMITED");
    expect(new ApiError("", 500).code).toBe("INTERNAL_ERROR");
  });

  it("is an instance of Error", () => {
    const err = new ApiError("test");
    expect(err).toBeInstanceOf(Error);
  });
});

// =============================================================================
// apiResponse
// =============================================================================

describe("apiResponse", () => {
  it("returns a NextResponse with success format", async () => {
    const response = apiResponse({ items: [1, 2, 3] });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ items: [1, 2, 3] });
    expect(body.error).toBeNull();
    expect(body.meta).toHaveProperty("requestId");
    expect(body.meta).toHaveProperty("timestamp");
  });

  it("supports custom status codes", async () => {
    const response = apiResponse({ id: "123" }, 201);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: "123" });
  });

  it("meta.timestamp is a valid ISO string", async () => {
    const response = apiResponse(null);
    const body = await response.json();
    const ts = new Date(body.meta.timestamp);
    expect(ts.toISOString()).toBe(body.meta.timestamp);
  });
});

// =============================================================================
// apiError
// =============================================================================

describe("apiError", () => {
  it("returns a NextResponse with error format", async () => {
    const response = apiError("Something went wrong", 400);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("message", "Something went wrong");
    expect(body.meta).toHaveProperty("requestId");
    expect(body.meta).toHaveProperty("timestamp");
  });

  it("uses the provided error code", async () => {
    const response = apiError("Rate limited", 429, "RATE_LIMITED");
    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMITED");
  });

  it("includes details when provided", async () => {
    const response = apiError("Validation failed", 422, "VALIDATION_ERROR", {
      fields: { email: ["required"] },
    });
    const body = await response.json();
    expect(body.error.details).toEqual({
      fields: { email: ["required"] },
    });
  });

  it("derives code from status when not provided", async () => {
    const response = apiError("Forbidden", 403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
