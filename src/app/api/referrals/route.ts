// =============================================================================
// GET /api/referrals — User's referral stats and referral list
// =============================================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiResponse,
  apiError,
  handleApiError,
  requireAuth,
} from "@/lib/utils/api";

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Fetch user's referral code
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCode: true },
    });

    if (!currentUser) {
      return apiError("User not found", 404, "NOT_FOUND");
    }

    // Fetch all users referred by this user, with their contribution and staking data
    const referrals = await prisma.user.findMany({
      where: { referredById: user.id },
      select: {
        id: true,
        walletAddress: true,
        displayName: true,
        tierLevel: true,
        createdAt: true,
        contributions: {
          where: { status: "CONFIRMED" },
          select: {
            amountUsd: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch referral rewards given by this user (as referrer)
    const referralRewards = await prisma.referralReward.findMany({
      where: { referrerId: user.id },
      select: {
        id: true,
        refereeId: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    // Aggregate total earnings
    const earningsAggregate = await prisma.referralReward.aggregate({
      where: { referrerId: user.id },
      _sum: { amount: true },
    });

    const pendingEarnings = await prisma.referralReward.aggregate({
      where: { referrerId: user.id, status: "PENDING" },
      _sum: { amount: true },
    });

    // Build a map of rewards by referee
    const rewardsByReferee = new Map<
      string,
      { totalEarned: number; status: string }
    >();
    for (const reward of referralRewards) {
      const existing = rewardsByReferee.get(reward.refereeId) || {
        totalEarned: 0,
        status: "NONE",
      };
      existing.totalEarned += Number(reward.amount);
      // Use the most recent reward status
      existing.status = reward.status;
      rewardsByReferee.set(reward.refereeId, existing);
    }

    // Format referral list
    const formattedReferrals = referrals.map((ref) => {
      const totalContributed = ref.contributions.reduce(
        (sum, c) => sum + Number(c.amountUsd),
        0
      );
      const firstContribution =
        ref.contributions.length > 0 ? ref.contributions[0].createdAt : null;
      const hasActivity = ref.contributions.length > 0;
      const rewards = rewardsByReferee.get(ref.id) || {
        totalEarned: 0,
        status: "NONE",
      };

      // Mask wallet address for privacy
      const maskedWallet =
        ref.walletAddress.length > 10
          ? `${ref.walletAddress.slice(0, 6)}...${ref.walletAddress.slice(-4)}`
          : ref.walletAddress;

      return {
        id: ref.id,
        userId: ref.id,
        walletAddress: maskedWallet,
        displayName: ref.displayName,
        status: hasActivity ? ("ACTIVE" as const) : ("PENDING" as const),
        joinedAt: ref.createdAt,
        firstContributionAt: firstContribution,
        totalContributed: totalContributed.toFixed(2),
        rewardEarned: rewards.totalEarned.toFixed(2),
        rewardStatus: rewards.status,
        tier: ref.tierLevel,
      };
    });

    // Calculate stats
    const totalReferrals = referrals.length;
    const activeReferrals = formattedReferrals.filter(
      (r) => r.status === "ACTIVE"
    ).length;
    const pendingReferrals = formattedReferrals.filter(
      (r) => r.status === "PENDING"
    ).length;
    const totalEarned = earningsAggregate._sum.amount
      ? Number(earningsAggregate._sum.amount)
      : 0;
    const pendingRewards = pendingEarnings._sum.amount
      ? Number(pendingEarnings._sum.amount)
      : 0;
    const lifetimeVolume = formattedReferrals.reduce(
      (sum, r) => sum + Number(r.totalContributed),
      0
    );

    const referralCode = currentUser.referralCode;

    return apiResponse({
      referralCode,
      referralLink: `https://exposure.fi/ref/${referralCode}`,
      stats: {
        total: totalReferrals,
        active: activeReferrals,
        pending: pendingReferrals,
        totalEarned: totalEarned.toFixed(2),
        pendingRewards: pendingRewards.toFixed(2),
        lifetimeVolume: lifetimeVolume.toFixed(2),
      },
      rewardStructure: {
        registrationBonus: "0",
        contributionPercent: 2.5,
        stakingPercent: 1.0,
        maxRewardPerReferral: "1000",
        vestingPeriod: "30 days",
      },
      referrals: formattedReferrals,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
