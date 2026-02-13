// =============================================================================
// Exposure -- Input Sanitization Helpers
// =============================================================================

// =============================================================================
// sanitizeString -- Trim, remove null bytes, limit length
// =============================================================================

export function sanitizeString(input: string, maxLength: number = 10000): string {
  return input
    .trim()
    .replace(/\0/g, "") // Remove null bytes
    .slice(0, maxLength);
}

// =============================================================================
// sanitizeHtml -- Strip HTML tags from input
// =============================================================================

export function sanitizeHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

// =============================================================================
// sanitizeWalletAddress -- Validate 0x format, lowercase
// =============================================================================

export function sanitizeWalletAddress(input: string): string {
  const trimmed = input.trim().toLowerCase();

  if (!/^0x[a-f0-9]{40}$/.test(trimmed)) {
    throw new Error("Invalid wallet address format. Expected 0x followed by 40 hex characters.");
  }

  return trimmed;
}

// =============================================================================
// sanitizeTxHash -- Validate 0x + 64 hex chars
// =============================================================================

export function sanitizeTxHash(input: string): string {
  const trimmed = input.trim().toLowerCase();

  if (!/^0x[a-f0-9]{64}$/.test(trimmed)) {
    throw new Error("Invalid transaction hash format. Expected 0x followed by 64 hex characters.");
  }

  return trimmed;
}
