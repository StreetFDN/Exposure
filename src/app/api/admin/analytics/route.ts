// =============================================================================
// GET /api/admin/analytics — Analytics dashboard data (admin only)
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  handleApiError,
  requireAdmin,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDateRangeStart(range: string): Date {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "ytd": {
      return new Date(now.getFullYear(), 0, 1);
    }
    case "all":
      return new Date(0); // beginning of time
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const rangeStart = getDateRangeStart(range);

    const [
      // KPI data
      totalRaisedAgg,
      newUsersCount,
      totalUsersCount,
      usersWithContributions,
      avgContributionAgg,
      allTimeRaisedAgg,

      // Top deals
      topDeals,

      // Tier distribution
      tierDistribution,

      // Geographic distribution
      geoDistribution,

      // Contributions by chain
      contributionsByChain,

      // Monthly raise volume (last 12 months)
      monthlyContributions,

      // User signups by month
      monthlySignups,
    ] = await Promise.all([
      // Total raised in period
      prisma.contribution.aggregate({
        _sum: { amountUsd: true },
        where: {
          status: "CONFIRMED",
          createdAt: { gte: rangeStart },
        },
      }),

      // New users in period
      prisma.user.count({
        where: { createdAt: { gte: rangeStart } },
      }),

      // Total users
      prisma.user.count(),

      // Users who have at least one confirmed contribution
      prisma.contribution.findMany({
        where: { status: "CONFIRMED" },
        select: { userId: true },
        distinct: ["userId"],
      }),

      // Average contribution in period
      prisma.contribution.aggregate({
        _avg: { amountUsd: true },
        where: {
          status: "CONFIRMED",
          createdAt: { gte: rangeStart },
        },
      }),

      // All-time raised (for revenue estimate)
      prisma.contribution.aggregate({
        _sum: { amountUsd: true },
        where: { status: "CONFIRMED" },
      }),

      // Top deals by totalRaised
      prisma.deal.findMany({
        orderBy: { totalRaised: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          totalRaised: true,
          totalRaise: true,
          hardCap: true,
          contributorCount: true,
          status: true,
          contributionOpenAt: true,
          contributionCloseAt: true,
          chain: true,
          _count: {
            select: { contributions: true },
          },
        },
      }),

      // Tier distribution
      prisma.user.groupBy({
        by: ["tierLevel"],
        _count: true,
      }),

      // Geographic distribution (users by country)
      prisma.user.groupBy({
        by: ["country"],
        _count: true,
        where: { country: { not: null } },
        orderBy: { _count: { country: "desc" } },
        take: 15,
      }),

      // Contributions by chain
      prisma.contribution.groupBy({
        by: ["chain"],
        _sum: { amountUsd: true },
        _count: true,
        where: { status: "CONFIRMED" },
      }),

      // Monthly contributions for bar chart (last 12 months)
      prisma.contribution.groupBy({
        by: ["createdAt"],
        _sum: { amountUsd: true },
        where: {
          status: "CONFIRMED",
          createdAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: "asc" },
      }),

      // Monthly user signups for line chart
      prisma.user.groupBy({
        by: ["createdAt"],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Calculate KPIs
    const totalRaised = Number(totalRaisedAgg._sum.amountUsd || 0);
    const avgContribution = Number(avgContributionAgg._avg.amountUsd || 0);
    const conversionRate =
      totalUsersCount > 0
        ? (usersWithContributions.length / totalUsersCount) * 100
        : 0;
    const allTimeRaised = Number(allTimeRaisedAgg._sum.amountUsd || 0);
    // Estimate revenue as platform fee (2.5%) of confirmed contributions in range
    const revenue = totalRaised * 0.025;

    // Build monthly raise volume chart data
    const monthlyRaiseMap = new Map<string, number>();
    for (const entry of monthlyContributions) {
      const monthKey = new Date(entry.createdAt).toISOString().slice(0, 7);
      const existing = monthlyRaiseMap.get(monthKey) || 0;
      monthlyRaiseMap.set(
        monthKey,
        existing + Number(entry._sum.amountUsd || 0)
      );
    }
    const raiseVolumeChart = Array.from(monthlyRaiseMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month,
        amount,
      }));

    // Build monthly signups chart data
    const signupMap = new Map<string, number>();
    for (const entry of monthlySignups) {
      const monthKey = new Date(entry.createdAt).toISOString().slice(0, 7);
      const existing = signupMap.get(monthKey) || 0;
      signupMap.set(monthKey, existing + entry._count);
    }
    const signupsChart = Array.from(signupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month,
        count,
      }));

    // Format top deals
    const formattedTopDeals = topDeals.map((deal) => {
      const raised = Number(deal.totalRaised);
      const hardCap = Number(deal.hardCap);
      const oversubscription = hardCap > 0 ? raised / hardCap : 0;
      const avgDealContribution =
        deal.contributorCount > 0 ? raised / deal.contributorCount : 0;

      return {
        id: deal.id,
        title: deal.title,
        raised,
        contributorCount: deal.contributorCount,
        avgContribution: avgDealContribution,
        oversubscription: Math.round(oversubscription * 10) / 10,
        status: deal.status,
        chain: deal.chain,
      };
    });

    // Format tier distribution
    const totalTierUsers = tierDistribution.reduce(
      (acc, t) => acc + t._count,
      0
    );
    const formattedTierDistribution = tierDistribution.map((t) => ({
      tier: t.tierLevel,
      count: t._count,
      pct:
        totalTierUsers > 0
          ? Math.round((t._count / totalTierUsers) * 1000) / 10
          : 0,
    }));

    // Format geographic distribution + get contribution sums per country
    // We need a separate query for contribution sums by country
    const countryContributions = await prisma.$queryRawUnsafe<
      Array<{ country: string; total_usd: number; user_count: number }>
    >(
      `SELECT u.country, COALESCE(SUM(c."amountUsd"), 0) as total_usd, COUNT(DISTINCT u.id) as user_count
       FROM "User" u
       LEFT JOIN "Contribution" c ON c."userId" = u.id AND c.status = 'CONFIRMED'
       WHERE u.country IS NOT NULL
       GROUP BY u.country
       ORDER BY total_usd DESC
       LIMIT 15`
    );

    const formattedGeoDistribution = countryContributions.map((row) => ({
      country: row.country,
      users: Number(row.user_count),
      contributions: Number(row.total_usd),
    }));

    // Format chain distribution for pie chart
    const formattedChainDistribution = contributionsByChain.map((c) => ({
      chain: c.chain,
      amount: Number(c._sum.amountUsd || 0),
      count: c._count,
    }));

    const analytics = {
      kpis: {
        totalRaised,
        newUsers: newUsersCount,
        totalUsers: totalUsersCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgContribution: Math.round(avgContribution * 100) / 100,
        revenue: Math.round(revenue * 100) / 100,
        allTimeRaised,
      },
      raiseVolumeChart,
      signupsChart,
      topDeals: formattedTopDeals,
      tierDistribution: formattedTierDistribution,
      geoDistribution: formattedGeoDistribution,
      chainDistribution: formattedChainDistribution,
      range,
    };

    return apiResponse({ analytics });
  } catch (error) {
    return handleApiError(error);
  }
}
