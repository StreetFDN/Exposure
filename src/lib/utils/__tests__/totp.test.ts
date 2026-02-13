import { describe, it, expect } from "vitest";
import {
  generateSecret,
  base32Encode,
  base32Decode,
  verifyTOTP,
  generateTOTP,
  generateBackupCodes,
  hashBackupCode,
  encryptSecret,
  decryptSecret,
} from "../totp";

// =============================================================================
// generateSecret
// =============================================================================

describe("generateSecret", () => {
  it("returns an object with secret and uri", () => {
    const result = generateSecret();
    expect(result).toHaveProperty("secret");
    expect(result).toHaveProperty("uri");
  });

  it("secret is a valid base32 string", () => {
    const { secret } = generateSecret();
    // base32 only uses A-Z and 2-7
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it("uri follows the otpauth format", () => {
    const { uri } = generateSecret("test@example.com");
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain("secret=");
    expect(uri).toContain("issuer=Exposure");
    expect(uri).toContain("algorithm=SHA1");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });

  it("includes the account name in the URI", () => {
    const { uri } = generateSecret("alice@wallet.eth");
    expect(uri).toContain(encodeURIComponent("alice@wallet.eth"));
  });

  it("uses default account name when none provided", () => {
    const { uri } = generateSecret();
    expect(uri).toContain("user");
  });

  it("generates unique secrets", () => {
    const s1 = generateSecret().secret;
    const s2 = generateSecret().secret;
    expect(s1).not.toBe(s2);
  });
});

// =============================================================================
// base32 encode / decode roundtrip
// =============================================================================

describe("base32 encode/decode", () => {
  it("roundtrips a known buffer", () => {
    const original = Buffer.from("Hello, World!");
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);
    expect(decoded.toString()).toBe("Hello, World!");
  });

  it("roundtrips random bytes", () => {
    const original = Buffer.from([0, 1, 2, 255, 128, 64]);
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);
    expect(Buffer.compare(original, decoded)).toBe(0);
  });

  it("roundtrips an empty buffer", () => {
    const original = Buffer.from([]);
    const encoded = base32Encode(original);
    const decoded = base32Decode(encoded);
    expect(decoded.length).toBe(0);
  });

  it("decode is case-insensitive", () => {
    const original = Buffer.from("Test");
    const encoded = base32Encode(original);
    const decodedUpper = base32Decode(encoded.toUpperCase());
    const decodedLower = base32Decode(encoded.toLowerCase());
    expect(Buffer.compare(decodedUpper, decodedLower)).toBe(0);
  });
});

// =============================================================================
// TOTP generation and verification
// =============================================================================

describe("generateTOTP / verifyTOTP", () => {
  it("generates a 6-digit code", () => {
    const { secret } = generateSecret();
    const code = generateTOTP(secret);
    expect(code).toMatch(/^\d{6}$/);
  });

  it("verifyTOTP accepts the current code", () => {
    const { secret } = generateSecret();
    const code = generateTOTP(secret);
    expect(verifyTOTP(secret, code)).toBe(true);
  });

  it("verifyTOTP rejects an incorrect code", () => {
    const { secret } = generateSecret();
    expect(verifyTOTP(secret, "000000")).toBe(false);
  });

  it("verifyTOTP rejects a code from a different secret", () => {
    const s1 = generateSecret().secret;
    const s2 = generateSecret().secret;
    const code = generateTOTP(s1);
    // Very unlikely to match, but technically possible; test intent is statistical
    expect(verifyTOTP(s2, code)).toBe(false);
  });
});

// =============================================================================
// generateBackupCodes
// =============================================================================

describe("generateBackupCodes", () => {
  it("returns the default count of 8", () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(8);
  });

  it("returns a custom count", () => {
    const codes = generateBackupCodes(5);
    expect(codes).toHaveLength(5);
  });

  it("each code is 8 characters long", () => {
    const codes = generateBackupCodes();
    for (const code of codes) {
      expect(code).toHaveLength(8);
    }
  });

  it("codes use only allowed characters (no ambiguous 0/O/1/I)", () => {
    const codes = generateBackupCodes(20);
    const allowed = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
    for (const code of codes) {
      expect(code).toMatch(allowed);
    }
  });

  it("codes are unique", () => {
    const codes = generateBackupCodes(20);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });
});

// =============================================================================
// hashBackupCode
// =============================================================================

describe("hashBackupCode", () => {
  it("returns a hex string", () => {
    const hash = hashBackupCode("ABCD1234");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is case-insensitive (uppercases before hashing)", () => {
    expect(hashBackupCode("abcd1234")).toBe(hashBackupCode("ABCD1234"));
  });

  it("different codes produce different hashes", () => {
    expect(hashBackupCode("CODE1111")).not.toBe(hashBackupCode("CODE2222"));
  });
});

// =============================================================================
// encrypt / decrypt roundtrip
// =============================================================================

describe("encryptSecret / decryptSecret", () => {
  it("roundtrips a TOTP secret", () => {
    const { secret } = generateSecret();
    const encrypted = encryptSecret(secret);
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(secret);
  });

  it("encrypted format is iv:authTag:ciphertext", () => {
    const encrypted = encryptSecret("TEST_SECRET");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    // iv = 12 bytes = 24 hex chars
    expect(parts[0]).toMatch(/^[0-9a-f]{24}$/);
    // authTag = 16 bytes = 32 hex chars
    expect(parts[1]).toMatch(/^[0-9a-f]{32}$/);
    // ciphertext is hex
    expect(parts[2]).toMatch(/^[0-9a-f]+$/);
  });

  it("different encryptions of the same plaintext differ (random IV)", () => {
    const secret = "SAME_SECRET";
    const e1 = encryptSecret(secret);
    const e2 = encryptSecret(secret);
    expect(e1).not.toBe(e2);
    // But both decrypt to the same value
    expect(decryptSecret(e1)).toBe(secret);
    expect(decryptSecret(e2)).toBe(secret);
  });

  it("throws on invalid encrypted format", () => {
    expect(() => decryptSecret("invalid")).toThrow(
      "Invalid encrypted secret format"
    );
  });
});
