import { formatDistanceToNow, format as dateFnsFormat } from "date-fns";

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

/**
 * Format a number as a currency string.
 * @example formatCurrency(1234.5)         // "$1,234.50"
 * @example formatCurrency(1234.5, "EUR")  // "EUR 1,234.50"
 */
export function formatCurrency(
  amount: number | string,
  currency: string = "USD"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "$0.00";

  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)}`;
}

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

/**
 * Format a token amount with optional symbol.
 * @example formatToken(1234.567, 2, "ETH") // "1,234.57 ETH"
 * @example formatToken(0.00001, 6)          // "0.000010"
 */
export function formatToken(
  amount: number | string,
  decimals: number = 2,
  symbol?: string
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return symbol ? `0 ${symbol}` : "0";

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

  return symbol ? `${formatted} ${symbol}` : formatted;
}

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

/**
 * Truncate an Ethereum address for display.
 * @example formatAddress("0x1234567890abcdef1234567890abcdef12345678") // "0x1234...5678"
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// ---------------------------------------------------------------------------
// Percent
// ---------------------------------------------------------------------------

/**
 * Format a number as a percentage string.
 * @example formatPercent(12.34) // "12.34%"
 */
export function formatPercent(
  value: number | string,
  decimals: number = 2
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0%";
  return `${num.toFixed(decimals)}%`;
}

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

/**
 * Format a date as "Jan 1, 2025" or "Jan 1, 2025, 2:30 PM" with time.
 */
export function formatDate(
  date: string | Date,
  opts?: { includeTime?: boolean }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (opts?.includeTime) {
    return dateFnsFormat(d, "MMM d, yyyy, h:mm a");
  }
  return dateFnsFormat(d, "MMM d, yyyy");
}

/**
 * Format a date relative to now.
 * @example formatRelativeTime(pastDate)   // "2 hours ago"
 * @example formatRelativeTime(futureDate) // "in 3 days"
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// ---------------------------------------------------------------------------
// Large Numbers
// ---------------------------------------------------------------------------

const SUFFIXES = [
  { threshold: 1_000_000_000_000, suffix: "T" },
  { threshold: 1_000_000_000, suffix: "B" },
  { threshold: 1_000_000, suffix: "M" },
  { threshold: 1_000, suffix: "K" },
] as const;

/**
 * Format large numbers with K/M/B/T suffixes.
 * @example formatLargeNumber(1_200_000)     // "1.2M"
 * @example formatLargeNumber(3_400_000_000) // "3.4B"
 * @example formatLargeNumber(500)           // "500"
 */
export function formatLargeNumber(
  num: number | string,
  decimals: number = 1
): string {
  const val = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(val)) return "0";

  const absNum = Math.abs(val);
  const sign = val < 0 ? "-" : "";

  for (const { threshold, suffix } of SUFFIXES) {
    if (absNum >= threshold) {
      const scaled = absNum / threshold;
      const formatted =
        scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(decimals);
      return `${sign}${formatted}${suffix}`;
    }
  }

  return `${sign}${absNum.toLocaleString("en-US")}`;
}

// ---------------------------------------------------------------------------
// Token Amount Parsing
// ---------------------------------------------------------------------------

/**
 * Convert a human-readable token amount to its smallest-unit bigint.
 *
 * @example parseTokenAmount("1.5", 18) // 1500000000000000000n
 * @example parseTokenAmount("100", 6)  // 100000000n
 */
export function parseTokenAmount(
  amount: string | number,
  decimals: number = 18
): bigint {
  const str = typeof amount === "number" ? amount.toString() : amount;
  const [whole = "0", fraction = ""] = str.split(".");

  const paddedFraction = fraction.slice(0, decimals).padEnd(decimals, "0");

  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedFraction);
}
