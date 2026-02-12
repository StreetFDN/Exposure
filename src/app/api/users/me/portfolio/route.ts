// =============================================================================
// GET /api/users/me/portfolio — User's portfolio data
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  handleApiError,
  requireAuth,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Fetch all confirmed contributions with deal + allocation info
    const contributions = await prisma.contribution.findMany({
      where: { userId: user.id, status: "CONFIRMED" },
      include: {
        deal: {
          select: {
            id: true,
            title: true,
            slug: true,
            projectName: true,
            featuredImageUrl: true,
            status: true,
            category: true,
            chain: true,
            tokenPrice: true,
            distributionTokenSymbol: true,
            raiseTokenSymbol: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch allocations for user's deals
    const allocations = await prisma.allocation.findMany({
      where: { userId: user.id },
      select: {
        dealId: true,
        finalAmount: true,
        allocationMethod: true,
        isFinalized: true,
      },
    });
    const allocationsByDeal = new Map(
      allocations.map((a) => [a.dealId, a])
    );

    // Fetch vesting schedules
    const vestingSchedules = await prisma.vestingSchedule.findMany({
      where: { userId: user.id },
      include: {
        deal: {
          select: {
            id: true,
            tokenPrice: true,
          },
        },
      },
    });
    const vestingByDeal = new Map(
      vestingSchedules.map((v) => [v.dealId, v])
    );

    // Build portfolio items
    let totalInvestedUsd = 0;
    let currentValueUsd = 0;
    let activePositions = 0;
    let vestingPositions = 0;
    let completedPositions = 0;

    const items = contributions.map((contrib) => {
      const deal = contrib.deal;
      const allocation = allocationsByDeal.get(deal.id) || null;
      const vesting = vestingByDeal.get(deal.id) || null;

      const investedUsd = Number(contrib.amountUsd);
      totalInvestedUsd += investedUsd;

      // Determine token count from allocation or contribution
      const tokenPrice = Number(deal.tokenPrice);
      const allocatedUsd = allocation?.isFinalized
        ? Number(allocation.finalAmount)
        : investedUsd;

      const tokenCount = tokenPrice > 0 ? allocatedUsd / tokenPrice : 0;

      // For current value: use token price as baseline (no live feed yet)
      // In production, you would fetch live market price here
      const currentTokenPrice = tokenPrice;
      let itemValue = tokenCount * currentTokenPrice;

      // If vesting exists, use vesting total amount for token count
      let vestingData = null;
      if (vesting) {
        const totalVestingTokens = Number(vesting.totalAmount);
        const claimedTokens = Number(vesting.claimedAmount);
        const totalPercent =
          totalVestingTokens > 0
            ? (claimedTokens / totalVestingTokens) * 100
            : 0;

        // Calculate claimable: linear approximation based on time elapsed
        const now = new Date();
        const vestingStart = new Date(vesting.vestingStart);
        const vestingEnd = new Date(vesting.vestingEnd);
        const totalDuration = vestingEnd.getTime() - vestingStart.getTime();
        const elapsed = Math.max(0, now.getTime() - vestingStart.getTime());
        const vestedFraction = totalDuration > 0
          ? Math.min(1, elapsed / totalDuration)
          : 1;
        const vestedTokens = totalVestingTokens * vestedFraction;
        const claimableTokens = Math.max(0, vestedTokens - claimedTokens);

        vestingData = {
          totalAmount: vesting.totalAmount.toString(),
          claimedAmount: vesting.claimedAmount.toString(),
          claimableAmount: claimableTokens.toFixed(0),
          nextUnlockAt: vesting.nextUnlockAt,
          nextUnlockAmount: null as string | null,
          percentComplete: Math.round(totalPercent * 100) / 100,
        };

        itemValue = totalVestingTokens * currentTokenPrice;
        vestingPositions++;
      }

      currentValueUsd += itemValue;

      // Track position categories
      const dealStatus = deal.status;
      if (dealStatus === "COMPLETED") {
        completedPositions++;
      } else if (!vesting) {
        activePositions++;
      }

      const roi =
        investedUsd > 0 ? ((itemValue - investedUsd) / investedUsd) * 100 : 0;

      return {
        deal: {
          id: deal.id,
          title: deal.title,
          slug: deal.slug,
          projectName: deal.projectName,
          featuredImageUrl: deal.featuredImageUrl,
          status: deal.status,
          category: deal.category,
          chain: deal.chain,
          tokenPrice: deal.tokenPrice.toString(),
          distributionTokenSymbol: deal.distributionTokenSymbol,
          raiseTokenSymbol: deal.raiseTokenSymbol,
        },
        contribution: {
          id: contrib.id,
          amount: contrib.amount.toString(),
          amountUsd: contrib.amountUsd.toString(),
          currency: contrib.currency,
          status: contrib.status,
          createdAt: contrib.createdAt,
        },
        allocation: allocation
          ? {
              finalAmount: allocation.finalAmount.toString(),
              allocationMethod: allocation.allocationMethod,
              isFinalized: allocation.isFinalized,
            }
          : null,
        vesting: vestingData,
        currentTokenPrice: currentTokenPrice.toString(),
        currentValueUsd: itemValue.toFixed(2),
        roiPercent: Math.round(roi * 100) / 100,
      };
    });

    const totalPnlUsd = currentValueUsd - totalInvestedUsd;
    const totalPnlPercent =
      totalInvestedUsd > 0 ? (totalPnlUsd / totalInvestedUsd) * 100 : 0;

    const portfolio = {
      summary: {
        totalInvestedUsd: totalInvestedUsd.toFixed(2),
        currentValueUsd: currentValueUsd.toFixed(2),
        totalPnlUsd: totalPnlUsd.toFixed(2),
        totalPnlPercent: Math.round(totalPnlPercent * 100) / 100,
        activePositions,
        vestingPositions,
        completedPositions,
      },
      items,
    };

    return apiResponse({ portfolio });
  } catch (error) {
    return handleApiError(error);
  }
}
