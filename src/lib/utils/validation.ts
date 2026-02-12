import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * Validates an Ethereum wallet address (0x + 40 hex characters).
 */
export const walletAddressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Invalid wallet address");

/**
 * Validates an email address.
 */
export const emailSchema = z.string().email("Invalid email address");

// ---------------------------------------------------------------------------
// Contribution
// ---------------------------------------------------------------------------

export const contributionSchema = z.object({
  amount: z
    .number()
    .positive("Contribution amount must be positive")
    .finite("Contribution amount must be a finite number"),
  currency: z
    .string()
    .min(1, "Currency is required")
    .max(10, "Currency symbol too long"),
  dealId: z.string().uuid("Invalid deal ID"),
});

export type ContributionInput = z.infer<typeof contributionSchema>;

// ---------------------------------------------------------------------------
// Deal Filters
// ---------------------------------------------------------------------------

export const dealFilterSchema = z.object({
  status: z
    .array(
      z.enum([
        "UPCOMING",
        "OPEN",
        "FILLED",
        "CLOSED",
        "CANCELLED",
        "DISTRIBUTING",
        "COMPLETED",
      ])
    )
    .optional(),
  category: z
    .array(
      z.enum([
        "DEFI",
        "INFRASTRUCTURE",
        "GAMING",
        "NFT",
        "DAO",
        "SOCIAL",
        "AI",
        "OTHER",
      ])
    )
    .optional(),
  accessType: z
    .array(z.enum(["PUBLIC", "TIERED", "LOTTERY", "FCFS"]))
    .optional(),
  minTier: z
    .enum(["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"])
    .optional(),
  chainId: z.number().int().positive().optional(),
  search: z.string().max(200).optional(),
  sortBy: z
    .enum(["newest", "endingSoon", "mostFunded", "alphabetical"])
    .optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});

export type DealFilterInput = z.infer<typeof dealFilterSchema>;

// ---------------------------------------------------------------------------
// Profile Update
// ---------------------------------------------------------------------------

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9_\-. ]+$/,
      "Display name can only contain letters, numbers, underscores, hyphens, dots, and spaces"
    )
    .optional(),
  email: emailSchema.optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ---------------------------------------------------------------------------
// Project Application
// ---------------------------------------------------------------------------

export const applicationSchema = z.object({
  projectName: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must be at most 100 characters"),
  projectUrl: z.string().url("Invalid project URL"),
  contactEmail: emailSchema,
  contactTelegram: z
    .string()
    .max(50, "Telegram handle too long")
    .nullable()
    .optional(),
  category: z.enum([
    "DEFI",
    "INFRASTRUCTURE",
    "GAMING",
    "NFT",
    "DAO",
    "SOCIAL",
    "AI",
    "OTHER",
  ]),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be at most 5,000 characters"),
  tokenSymbol: z
    .string()
    .min(1, "Token symbol is required")
    .max(10, "Token symbol too long")
    .regex(/^[A-Z0-9]+$/, "Token symbol must be uppercase alphanumeric"),
  raiseAmount: z
    .number()
    .positive("Raise amount must be positive")
    .max(100_000_000, "Raise amount exceeds maximum"),
  chainId: z.number().int().positive("Invalid chain ID"),
  teamInfo: z
    .string()
    .min(20, "Team info must be at least 20 characters")
    .max(3000, "Team info must be at most 3,000 characters"),
  pitchDeckUrl: z.string().url("Invalid pitch deck URL").nullable().optional(),
  tokenomicsUrl: z
    .string()
    .url("Invalid tokenomics URL")
    .nullable()
    .optional(),
  auditUrl: z.string().url("Invalid audit URL").nullable().optional(),
  previousRaises: z
    .string()
    .max(2000, "Previous raises section too long")
    .nullable()
    .optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
