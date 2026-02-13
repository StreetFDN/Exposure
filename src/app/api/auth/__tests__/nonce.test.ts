import { describe, it, expect } from "vitest";
import { GET } from "../nonce/route";
import { NextRequest } from "next/server";

function makeRequest() {
  return new NextRequest("http://localhost:3000/api/auth/nonce");
}

describe("GET /api/auth/nonce", () => {
  it("returns a success response with a nonce string", async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("nonce");
    expect(typeof body.data.nonce).toBe("string");
  });

  it("nonce is a 32-character hex string", async () => {
    const response = await GET(makeRequest());
    const body = await response.json();
    // 16 random bytes = 32 hex characters
    expect(body.data.nonce).toMatch(/^[0-9a-f]{32}$/);
  });

  it("each request produces a unique nonce", async () => {
    const res1 = await GET(makeRequest());
    const res2 = await GET(makeRequest());

    const body1 = await res1.json();
    const body2 = await res2.json();

    expect(body1.data.nonce).not.toBe(body2.data.nonce);
  });

  it("response has standard meta fields", async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(body.meta).toHaveProperty("requestId");
    expect(body.meta).toHaveProperty("timestamp");
    expect(body.error).toBeNull();
  });
});
