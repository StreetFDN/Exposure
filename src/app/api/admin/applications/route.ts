// =============================================================================
// /api/admin/applications — List applications (GET) and submit new (POST)
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  handleApiError,
  requireAdmin,
  validateBody,
  parsePagination,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// Public application submission schema
// ---------------------------------------------------------------------------

const submitApplicationSchema = z.object({
  projectName: z.string().min(2).max(100),
  contactEmail: z.string().email(),
  contactTelegram: z.string().max(100).optional(),
  applicantWallet: z.string().min(1, "Wallet address is required"),
  category: z.enum([
    "DEFI",
    "INFRASTRUCTURE",
    "GAMING",
    "AI",
    "NFT",
    "SOCIAL",
    "OTHER",
  ]),
  chain: z.enum(["ETHEREUM", "ARBITRUM", "BASE"]),
  description: z.string().min(50).max(5000),
  targetRaise: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
  valuation: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number").optional(),
  tokenName: z.string().min(1).max(50),
  tokenTicker: z.string().min(1).max(10),
  tokenSupply: z.string().regex(/^\d+\.?\d*$/, "Must be a valid number"),
  projectWebsite: z.string().url(),
  pitchDeckUrl: z.string().url().optional(),
  whitepaperUrl: z.string().url().optional(),
  auditReportUrl: z.string().url().optional(),
  teamInfo: z.any().default({}),
  tokenomics: z.any().default({}),
});

// ---------------------------------------------------------------------------
// GET handler — List applications (admin only)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    // Parse filters
    const status = searchParams.get("status");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) {
      const statuses = status.split(",");
      where.status = { in: statuses };
    }

    // Execute query and count in parallel
    const [applications, total] = await Promise.all([
      prisma.projectApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.projectApplication.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return apiResponse({
      applications,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ---------------------------------------------------------------------------
// POST handler — Submit new application (public — no auth required)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await validateBody(request, submitApplicationSchema);

    const application = await prisma.projectApplication.create({
      data: {
        projectName: body.projectName,
        projectWebsite: body.projectWebsite,
        contactEmail: body.contactEmail,
        contactTelegram: body.contactTelegram ?? null,
        applicantWallet: body.applicantWallet,
        status: "SUBMITTED",
        category: body.category,
        description: body.description,
        targetRaise: body.targetRaise,
        valuation: body.valuation ?? null,
        tokenName: body.tokenName,
        tokenTicker: body.tokenTicker,
        tokenSupply: body.tokenSupply,
        chain: body.chain,
        teamInfo: body.teamInfo,
        tokenomics: body.tokenomics,
        pitchDeckUrl: body.pitchDeckUrl ?? null,
        whitepaperUrl: body.whitepaperUrl ?? null,
        auditReportUrl: body.auditReportUrl ?? null,
      },
    });

    return apiResponse({ application }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
