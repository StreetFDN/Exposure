import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    // Use unique keys per test to avoid state leakage between tests
    vi.restoreAllMocks();
  });

  it("allows requests within the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result = rateLimit(key, 5, 60_000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("tracks remaining count correctly", () => {
    const key = `test-remaining-${Date.now()}`;
    rateLimit(key, 5, 60_000); // remaining: 4
    rateLimit(key, 5, 60_000); // remaining: 3
    const result = rateLimit(key, 5, 60_000); // remaining: 2
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks requests that exceed the limit", () => {
    const key = `test-block-${Date.now()}`;
    // Use up all 3 allowed requests
    rateLimit(key, 3, 60_000);
    rateLimit(key, 3, 60_000);
    rateLimit(key, 3, 60_000);

    // 4th request should be blocked
    const result = rateLimit(key, 3, 60_000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.reset).toBeGreaterThan(0);
  });

  it("resets after the window expires", () => {
    const key = `test-reset-${Date.now()}`;
    const windowMs = 100; // 100ms window for fast test

    // Use the real Date.now but manipulate via a very short window
    rateLimit(key, 1, windowMs);

    // Immediately should be blocked
    const blockedResult = rateLimit(key, 1, windowMs);
    expect(blockedResult.success).toBe(false);

    // Wait for window to expire, then try again
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const afterResult = rateLimit(key, 1, windowMs);
        expect(afterResult.success).toBe(true);
        resolve();
      }, windowMs + 50);
    });
  });

  it("returns positive reset time when blocked", () => {
    const key = `test-reset-time-${Date.now()}`;
    rateLimit(key, 1, 60_000);
    const result = rateLimit(key, 1, 60_000);
    expect(result.success).toBe(false);
    expect(result.reset).toBeGreaterThan(0);
    expect(result.reset).toBeLessThanOrEqual(60_000);
  });

  it("different keys are independent", () => {
    const keyA = `test-independent-a-${Date.now()}`;
    const keyB = `test-independent-b-${Date.now()}`;

    // Exhaust limit on keyA
    rateLimit(keyA, 1, 60_000);
    const blockedA = rateLimit(keyA, 1, 60_000);
    expect(blockedA.success).toBe(false);

    // keyB should still be available
    const allowedB = rateLimit(keyB, 1, 60_000);
    expect(allowedB.success).toBe(true);
  });
});
