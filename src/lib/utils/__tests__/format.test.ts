import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatAddress,
  formatPercent,
  formatDate,
  formatToken,
  formatLargeNumber,
  parseTokenAmount,
} from "../format";

// =============================================================================
// formatCurrency
// =============================================================================

describe("formatCurrency", () => {
  it("formats a standard USD amount", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-500)).toBe("-$500.00");
  });

  it("formats very large numbers", () => {
    const result = formatCurrency(1_000_000_000);
    expect(result).toBe("$1,000,000,000.00");
  });

  it("formats string amounts", () => {
    expect(formatCurrency("99.9")).toBe("$99.90");
  });

  it("returns $0.00 for NaN input", () => {
    expect(formatCurrency("not-a-number")).toBe("$0.00");
    expect(formatCurrency(NaN)).toBe("$0.00");
  });

  it("formats non-USD currency with prefix", () => {
    const result = formatCurrency(1234.5, "EUR");
    expect(result).toBe("EUR 1,234.50");
  });

  it("formats small decimals correctly", () => {
    expect(formatCurrency(0.01)).toBe("$0.01");
    expect(formatCurrency(0.1)).toBe("$0.10");
  });
});

// =============================================================================
// formatAddress
// =============================================================================

describe("formatAddress", () => {
  const fullAddr = "0x1234567890abcdef1234567890abcdef12345678";

  it("truncates a standard 42-char address", () => {
    expect(formatAddress(fullAddr)).toBe("0x1234...5678");
  });

  it("returns empty string for empty input", () => {
    expect(formatAddress("")).toBe("");
  });

  it("returns short addresses unchanged", () => {
    expect(formatAddress("0x1234")).toBe("0x1234");
  });

  it("respects custom startChars and endChars", () => {
    expect(formatAddress(fullAddr, 10, 6)).toBe("0x12345678...345678");
  });

  it("handles address exactly at the boundary", () => {
    // 6 + 4 = 10 chars boundary
    const shortAddr = "0x12345678"; // 10 chars
    expect(formatAddress(shortAddr)).toBe("0x12345678"); // not truncated
  });
});

// =============================================================================
// formatPercent
// =============================================================================

describe("formatPercent", () => {
  it("formats a standard percentage", () => {
    expect(formatPercent(12.34)).toBe("12.34%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });

  it("formats negative percentages", () => {
    expect(formatPercent(-5.5)).toBe("-5.50%");
  });

  it("formats string input", () => {
    expect(formatPercent("75.123")).toBe("75.12%");
  });

  it("returns 0% for NaN", () => {
    expect(formatPercent("abc")).toBe("0%");
    expect(formatPercent(NaN)).toBe("0%");
  });

  it("respects custom decimal places", () => {
    expect(formatPercent(12.3456, 0)).toBe("12%");
    expect(formatPercent(12.3456, 4)).toBe("12.3456%");
  });
});

// =============================================================================
// formatDate
// =============================================================================

describe("formatDate", () => {
  it("formats a Date object", () => {
    const date = new Date("2025-01-15T00:00:00Z");
    const result = formatDate(date);
    // date-fns format: "MMM d, yyyy"
    expect(result).toMatch(/Jan 1[45], 2025/);
  });

  it("formats a date string", () => {
    const result = formatDate("2025-06-01T12:00:00Z");
    expect(result).toMatch(/Jun 1, 2025|May 31, 2025/);
  });

  it("includes time when requested", () => {
    const date = new Date("2025-01-15T14:30:00Z");
    const result = formatDate(date, { includeTime: true });
    // Should contain the time portion
    expect(result).toMatch(/\d{1,2}:\d{2}\s[AP]M/);
  });
});

// =============================================================================
// formatToken
// =============================================================================

describe("formatToken", () => {
  it("formats a token amount with default decimals", () => {
    expect(formatToken(1234.567)).toBe("1,234.57");
  });

  it("formats with symbol", () => {
    expect(formatToken(1234.567, 2, "ETH")).toBe("1,234.57 ETH");
  });

  it("formats with custom decimals", () => {
    expect(formatToken(0.00001, 6)).toBe("0.000010");
  });

  it("returns 0 for NaN without symbol", () => {
    expect(formatToken("abc")).toBe("0");
  });

  it("returns 0 with symbol for NaN", () => {
    expect(formatToken("abc", 2, "ETH")).toBe("0 ETH");
  });

  it("formats zero correctly", () => {
    expect(formatToken(0, 2, "USDC")).toBe("0.00 USDC");
  });

  it("formats string amounts", () => {
    expect(formatToken("500.123", 2)).toBe("500.12");
  });
});

// =============================================================================
// formatLargeNumber
// =============================================================================

describe("formatLargeNumber", () => {
  it("formats thousands with K", () => {
    expect(formatLargeNumber(1_500)).toBe("1.5K");
  });

  it("formats millions with M", () => {
    expect(formatLargeNumber(1_200_000)).toBe("1.2M");
  });

  it("formats billions with B", () => {
    expect(formatLargeNumber(3_400_000_000)).toBe("3.4B");
  });

  it("formats trillions with T", () => {
    expect(formatLargeNumber(2_500_000_000_000)).toBe("2.5T");
  });

  it("does not suffix numbers below 1000", () => {
    expect(formatLargeNumber(500)).toBe("500");
  });

  it("handles negative numbers", () => {
    expect(formatLargeNumber(-1_500_000)).toBe("-1.5M");
  });

  it("returns 0 for NaN", () => {
    expect(formatLargeNumber("not-a-number")).toBe("0");
  });

  it("formats exact thresholds without trailing decimals", () => {
    expect(formatLargeNumber(1_000_000)).toBe("1M");
  });
});

// =============================================================================
// parseTokenAmount
// =============================================================================

describe("parseTokenAmount", () => {
  it("parses a whole number with 18 decimals", () => {
    expect(parseTokenAmount("1", 18)).toBe(1_000_000_000_000_000_000n);
  });

  it("parses a decimal amount", () => {
    expect(parseTokenAmount("1.5", 18)).toBe(1_500_000_000_000_000_000n);
  });

  it("parses 100 with 6 decimals", () => {
    expect(parseTokenAmount("100", 6)).toBe(100_000_000n);
  });

  it("handles numeric input", () => {
    expect(parseTokenAmount(1.5, 18)).toBe(1_500_000_000_000_000_000n);
  });

  it("truncates excess decimals", () => {
    // "1.123456789" with 6 decimals should truncate to 1.123456
    expect(parseTokenAmount("1.123456789", 6)).toBe(1_123_456n);
  });
});
