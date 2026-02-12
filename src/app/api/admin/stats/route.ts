// =============================================================================
// GET /api/admin/stats — Admin dashboard statistics
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  handleApiError,
  requireAdmin,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Run all aggregation queries in parallel
    const [
      totalRaisedAgg,
      activeRaises,
      completedRaises,
      totalDeals,
      totalUsers,
      kycApprovedCount,
      tierDistribution,
      unresolvedFlags,
      highSeverityFlags,
      activeStakers,
      totalStakedAgg,
      pendingApplications,
      recentDeals,
      recentActivity,
      dailyVolume,
    ] = await Promise.all([
      // Total raised across all confirmed contributions
      prisma.contribution.aggregate({
        _sum: { amountUsd: true },
        where: { status: "CONFIRMED" },
      }),

      // Active raises count
      prisma.deal.count({
        where: {
          status: {
            in: ["REGISTRATION_OPEN", "GUARANTEED_ALLOCATION", "FCFS"],
          },
        },
      }),

      // Completed raises
      prisma.deal.count({ where: { status: "COMPLETED" } }),

      // Total deals
      prisma.deal.count(),

      // Total users
      prisma.user.count(),

      // KYC approved users
      prisma.user.count({ where: { kycStatus: "APPROVED" } }),

      // Tier distribution
      prisma.user.groupBy({
        by: ["tierLevel"],
        _count: true,
      }),

      // Unresolved compliance flags
      prisma.complianceFlag.count({ where: { isResolved: false } }),

      // High severity unresolved flags
      prisma.complianceFlag.count({
        where: { isResolved: false, severity: { in: ["HIGH", "CRITICAL"] } },
      }),

      // Active stakers
      prisma.stakingPosition.count({ where: { isActive: true } }),

      // Total staked
      prisma.stakingPosition.aggregate({
        _sum: { amount: true },
        where: { isActive: true },
      }),

      // Pending project applications
      prisma.projectApplication.count({
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      }),

      // Recent deals (last 5)
      prisma.deal.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          totalRaised: true,
          hardCap: true,
          contributorCount: true,
          createdAt: true,
        },
      }),

      // Recent audit log entries for activity feed
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          metadata: true,
          createdAt: true,
        },
      }),

      // Daily contribution volume (last 14 days)
      prisma.contribution.groupBy({
        by: ["createdAt"],
        _sum: { amountUsd: true },
        where: {
          status: "CONFIRMED",
          createdAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Build tier distribution map
    const usersByTier: Record<string, number> = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
      DIAMOND: 0,
    };
    for (const group of tierDistribution) {
      usersByTier[group.tierLevel] = group._count;
    }

    // Build KYC status counts
    const kycStatusCounts = await prisma.user.groupBy({
      by: ["kycStatus"],
      _count: true,
    });
    const usersByKycStatus: Record<string, number> = {
      NONE: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      EXPIRED: 0,
    };
    for (const group of kycStatusCounts) {
      usersByKycStatus[group.kycStatus] = group._count;
    }

    // Format recent deals with percent raised
    const formattedRecentDeals = recentDeals.map((deal) => {
      const raised = Number(deal.totalRaised);
      const cap = Number(deal.hardCap);
      return {
        id: deal.id,
        title: deal.title,
        status: deal.status,
        totalRaised: deal.totalRaised.toString(),
        hardCap: deal.hardCap.toString(),
        contributorCount: deal.contributorCount,
        percentRaised: cap > 0 ? Math.round((raised / cap) * 1000) / 10 : 0,
      };
    });

    // Format daily volume
    const dailyVolumeMap = new Map<string, number>();
    for (const entry of dailyVolume) {
      const dateKey = new Date(entry.createdAt).toISOString().split("T")[0];
      const existing = dailyVolumeMap.get(dateKey) || 0;
      dailyVolumeMap.set(dateKey, existing + Number(entry._sum.amountUsd || 0));
    }
    const dailyVolumeUsd = Array.from(dailyVolumeMap.entries()).map(
      ([date, volume]) => ({ date, volume: volume.toString() })
    );

    // Format activity feed from audit logs
    const recentActivityFeed = recentActivity.map((log) => ({
      type: log.action,
      message: `${log.action} on ${log.resourceType}${log.resourceId ? ` (${log.resourceId})` : ""}`,
      timestamp: log.createdAt.toISOString(),
    }));

    const totalRaised = Number(totalRaisedAgg._sum.amountUsd || 0);
    const totalStaked = Number(totalStakedAgg._sum.amount || 0);
    const kycCompletionRate =
      totalUsers > 0 ? Math.round((kycApprovedCount / totalUsers) * 1000) / 10 : 0;

    const stats = {
      totalRaised: totalRaised.toString(),
      totalRaisedFormatted: `$${(totalRaised / 1_000_000).toFixed(1)}M`,
      activeRaises,
      completedRaises,
      totalDeals,
      totalUsers,
      totalContributors: await prisma.contribution.groupBy({ by: ["userId"], where: { status: "CONFIRMED" } }).then((g) => g.length),
      kycCompletionRate,
      pendingApplications,

      usersByTier,
      usersByKycStatus,

      activeStakers,
      totalStaked: totalStaked.toString(),
      totalStakedFormatted: `$${(totalStaked / 1_000_000).toFixed(1)}M`,

      unresolvedFlags,
      highSeverityFlags,

      recentDeals: formattedRecentDeals,
      dailyVolumeUsd,
      recentActivity: recentActivityFeed,
    };

    return apiResponse({ stats });
  } catch (error) {
    return handleApiError(error);
  }
}
