// =============================================================================
// Exposure -- TOTP (Time-based One-Time Password) Utilities
// RFC 6238 implementation using Node.js crypto. No external dependencies.
// =============================================================================

import crypto from "crypto";

// =============================================================================
// Base32 Encode / Decode
// =============================================================================

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encode a Buffer to a base32 string (RFC 4648).
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      bits -= 5;
      output += BASE32_ALPHABET[(value >>> bits) & 0x1f];
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }

  return output;
}

/**
 * Decode a base32 string back to a Buffer.
 */
export function base32Decode(encoded: string): Buffer {
  const stripped = encoded.replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < stripped.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(stripped[i]);
    if (idx === -1) continue; // skip invalid chars

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      output.push((value >>> bits) & 0xff);
    }
  }

  return Buffer.from(output);
}

// =============================================================================
// HOTP / TOTP Core (RFC 4226 / RFC 6238)
// =============================================================================

/**
 * Generate a 6-digit HOTP code for the given secret and counter.
 */
function generateHOTP(secret: Buffer, counter: bigint): string {
  // Convert counter to 8-byte big-endian buffer
  const counterBuf = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    counterBuf[i] = Number(counter & 0xffn);
    counter >>= 8n;
  }

  const hmac = crypto.createHmac("sha1", secret);
  hmac.update(counterBuf);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1_000_000;
  return otp.toString().padStart(6, "0");
}

/**
 * Generate the current TOTP code for a base32 secret.
 */
export function generateTOTP(base32Secret: string, timeStep = 30): string {
  const secret = base32Decode(base32Secret);
  const counter = BigInt(Math.floor(Date.now() / 1000 / timeStep));
  return generateHOTP(secret, counter);
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Generate a new TOTP secret and the corresponding otpauth:// URI.
 */
export function generateSecret(
  accountName?: string
): { secret: string; uri: string } {
  const raw = crypto.randomBytes(20);
  const secret = base32Encode(raw);

  const issuer = "Exposure";
  const account = accountName || "user";
  const uri =
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}` +
    `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

  return { secret, uri };
}

/**
 * Verify a 6-digit TOTP code against the given base32 secret.
 * Allows a window of +/- `window` time steps (default 1 = 30 seconds tolerance).
 */
export function verifyTOTP(
  base32Secret: string,
  code: string,
  window = 1,
  timeStep = 30
): boolean {
  const secret = base32Decode(base32Secret);
  const currentCounter = BigInt(Math.floor(Date.now() / 1000 / timeStep));

  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + BigInt(i);
    const expected = generateHOTP(secret, counter);
    if (timingSafeEqual(expected, code)) {
      return true;
    }
  }

  return false;
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generate random backup codes.
 * Returns an array of plaintext codes (8-char alphanumeric).
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)

  for (let i = 0; i < count; i++) {
    const bytes = crypto.randomBytes(8);
    let code = "";
    for (let j = 0; j < 8; j++) {
      code += chars[bytes[j] % chars.length];
    }
    codes.push(code);
  }

  return codes;
}

/**
 * Hash a backup code for storage (SHA-256).
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
}

// =============================================================================
// Secret Encryption at Rest (AES-256-GCM)
// =============================================================================

function getEncryptionKey(): Buffer {
  const keySource =
    process.env.ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "exposure-dev-encryption-key-change-in-production";

  // Derive a consistent 32-byte key from whatever source string we have
  return crypto.createHash("sha256").update(keySource).digest();
}

/**
 * Encrypt a plaintext TOTP secret for storage in the database.
 * Format: iv:authTag:ciphertext (all hex-encoded).
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an encrypted TOTP secret from the database.
 */
export function decryptSecret(encrypted: string): string {
  const [ivHex, authTagHex, ciphertext] = encrypted.split(":");

  if (!ivHex || !authTagHex || !ciphertext) {
    throw new Error("Invalid encrypted secret format");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generate a short-lived action token (HMAC-signed, 5-minute TTL).
 * Used to authorize sensitive actions after 2FA validation.
 */
export function generateActionToken(
  userId: string,
  action: string
): string {
  const payload = {
    userId,
    action,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes
    jti: crypto.randomUUID(),
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret =
    process.env.SESSION_SECRET ||
    "exposure-dev-secret-change-in-production";
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(encoded);
  const signature = hmac.digest("base64url");

  return `${encoded}.${signature}`;
}

/**
 * Verify a short-lived action token. Returns the decoded payload or null.
 */
export function verifyActionToken(
  token: string
): { userId: string; action: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const secret =
    process.env.SESSION_SECRET ||
    "exposure-dev-secret-change-in-production";
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(encoded);
  const expectedSig = hmac.digest("base64url");

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf-8")
    );

    if (!payload.exp || payload.exp < Date.now()) return null;

    return { userId: payload.userId, action: payload.action };
  } catch {
    return null;
  }
}
