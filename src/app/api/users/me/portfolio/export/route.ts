// =============================================================================
// /api/users/me/portfolio/export — Export portfolio as CSV (GET)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, requireAuth } from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// CSV Helpers
// ---------------------------------------------------------------------------

/**
 * Escape a value for safe inclusion in a CSV cell.
 * Wraps values containing commas, quotes, or newlines in double-quotes,
 * and doubles any existing double-quote characters.
 */
function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of row objects to a CSV string.
 */
function toCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvValue).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

// ---------------------------------------------------------------------------
// GET handler — Generate and return portfolio CSV
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    // Fetch all contributions with deal details for this user
    const contributions = await prisma.contribution.findMany({
      where: { userId: session.id },
      include: {
        deal: {
          select: {
            title: true,
            distributionTokenSymbol: true,
            raiseTokenSymbol: true,
            tokenPrice: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch allocations for matching deals
    const allocations = await prisma.allocation.findMany({
      where: { userId: session.id },
      select: {
        dealId: true,
        finalAmount: true,
        isFinalized: true,
      },
    });

    // Build a map of dealId -> allocation for quick lookup
    const allocationMap = new Map(
      allocations.map((a) => [a.dealId, a])
    );

    // Fetch vesting data for claimed amounts / current value estimation
    const vestingSchedules = await prisma.vestingSchedule.findMany({
      where: { userId: session.id },
      select: {
        dealId: true,
        totalAmount: true,
        claimedAmount: true,
      },
    });

    const vestingMap = new Map(
      vestingSchedules.map((v) => [v.dealId, v])
    );

    // Build CSV rows
    const CSV_HEADERS = [
      "Deal Name",
      "Token",
      "Contributed Amount",
      "Contributed Currency",
      "Allocation Amount",
      "Current Value",
      "PnL",
      "Status",
      "Date",
      "Transaction Hash",
    ];

    const rows: string[][] = contributions.map((contribution) => {
      const deal = contribution.deal;
      const allocation = allocationMap.get(contribution.dealId);
      const vesting = vestingMap.get(contribution.dealId);

      const contributedAmount = Number(contribution.amount);
      const contributedUsd = Number(contribution.amountUsd);
      const allocationAmount = allocation
        ? Number(allocation.finalAmount)
        : 0;

      // Estimate current value: for completed deals with token distribution,
      // use allocation * token price. For simplicity, we use the USD contribution
      // value as a baseline (a real implementation would integrate live price feeds).
      const tokenPrice = deal.tokenPrice ? Number(deal.tokenPrice) : 0;
      const currentValue =
        allocationAmount > 0 && tokenPrice > 0
          ? allocationAmount * tokenPrice
          : contributedUsd;

      const pnl = currentValue - contributedUsd;

      const dateStr = contribution.createdAt.toISOString().split("T")[0];

      return [
        deal.title,
        deal.distributionTokenSymbol || deal.raiseTokenSymbol || "N/A",
        contributedAmount.toFixed(6),
        contribution.currency,
        allocationAmount.toFixed(6),
        currentValue.toFixed(2),
        pnl.toFixed(2),
        contribution.status,
        dateStr,
        contribution.txHash || "",
      ];
    });

    const csvContent = toCsv(CSV_HEADERS, rows);

    // Generate filename with current date
    const today = new Date().toISOString().split("T")[0];
    const filename = `portfolio-export-${today}.csv`;

    // Log the export event
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "PORTFOLIO_EXPORTED",
        resourceType: "Portfolio",
        resourceId: session.id,
        metadata: {
          format: "csv",
          rowCount: rows.length,
          exportDate: today,
        },
      },
    });

    // Return CSV response with proper headers
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
