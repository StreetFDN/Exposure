"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Link2,
  DollarSign,
  Clock,
  Trophy,
  Gift,
  Crown,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import {
  formatCurrency,
  formatDate,
} from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types — matching API response from GET /api/referrals
// ---------------------------------------------------------------------------

interface ReferralStats {
  total: number;
  active: number;
  pending: number;
  totalEarned: string;
  pendingRewards: string;
  lifetimeVolume: string;
}

interface RewardStructure {
  registrationBonus: string;
  contributionPercent: number;
  stakingPercent: number;
  maxRewardPerReferral: string;
  vestingPeriod: string;
}

interface ApiReferral {
  id: string;
  userId: string;
  walletAddress: string;
  displayName: string | null;
  status: "ACTIVE" | "PENDING";
  joinedAt: string;
  firstContributionAt: string | null;
  totalContributed: string;
  rewardEarned: string;
  rewardStatus: string;
  tier: string;
}

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats;
  rewardStructure: RewardStructure;
  referrals: ApiReferral[];
}

// ---------------------------------------------------------------------------
// Referral Tier Config (static — commission tiers from the reward structure)
// ---------------------------------------------------------------------------

interface ReferralTier {
  name: string;
  range: string;
  minRefs: number;
  maxRefs: number;
  color: string;
  bgColor: string;
  borderColor: string;
  bonus: string;
}

const REFERRAL_TIERS: ReferralTier[] = [
  {
    name: "Bronze Referrer",
    range: "1-5 referrals",
    minRefs: 1,
    maxRefs: 5,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    bonus: "2.5% commission",
  },
  {
    name: "Silver Referrer",
    range: "6-15 referrals",
    minRefs: 6,
    maxRefs: 15,
    color: "text-zinc-300",
    bgColor: "bg-zinc-400/10",
    borderColor: "border-zinc-400/30",
    bonus: "3.5% commission",
  },
  {
    name: "Gold Referrer",
    range: "16-30 referrals",
    minRefs: 16,
    maxRefs: 30,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    bonus: "5% commission",
  },
  {
    name: "Platinum Referrer",
    range: "31+ referrals",
    minRefs: 31,
    maxRefs: Infinity,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    bonus: "7.5% commission",
  },
];

function getCurrentReferralTier(count: number): ReferralTier | null {
  for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
    if (count >= REFERRAL_TIERS[i].minRefs) return REFERRAL_TIERS[i];
  }
  return null;
}

function statusVariant(
  status: string
): "success" | "warning" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "PENDING":
      return "warning";
    default:
      return "outline";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "PENDING":
      return "Pending";
    default:
      return status;
  }
}

// ---------------------------------------------------------------------------
// Loading Skeletons
// ---------------------------------------------------------------------------

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="card" className="h-24" />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="rect" className="h-12 w-full" />
      ))}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} variant="rect" className="h-14 w-full" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch referral data
  // -------------------------------------------------------------------------

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/referrals");
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load referrals");
      }

      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load referrals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const stats = data?.stats;
  const referralLink = data?.referralLink || "";
  const referrals = data?.referrals || [];
  const totalReferralCount = stats?.total ?? 0;
  const currentRefTier = getCurrentReferralTier(totalReferralCount);

  // -------------------------------------------------------------------------
  // Copy link handler
  // -------------------------------------------------------------------------

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // fail silently
    }
  };

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on Exposure -- the premier crypto capital raising platform! Use my referral link: ${referralLink}`)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join Exposure -- crypto capital raising made simple!")}`;

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (error && !loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Referrals</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Invite friends, earn rewards. Get commission on every contribution your
            referrals make.
          </p>
        </div>
        <Alert variant="error">{error}</Alert>
        <Button variant="secondary" size="sm" onClick={fetchReferrals}>
          <Loader2 className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Referrals</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Invite friends, earn rewards. Get commission on every contribution your
          referrals make.
        </p>
      </div>

      {/* Referral Link */}
      {loading ? (
        <Skeleton variant="card" className="h-20" />
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-300">
                  Your Referral Link
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5">
                  <Link2 className="h-4 w-4 shrink-0 text-violet-400" />
                  <code className="text-sm text-zinc-200">{referralLink}</code>
                  <button
                    onClick={handleCopyLink}
                    className="ml-2 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
                    aria-label="Copy referral link"
                  >
                    {linkCopied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="sm">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share on X
                  </Button>
                </a>
                <a
                  href={telegramShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="secondary" size="sm">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    Telegram
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Referrals"
            value={String(stats?.total ?? 0)}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Active Referrals"
            value={String(stats?.active ?? 0)}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Total Earned"
            value={formatCurrency(parseFloat(stats?.totalEarned ?? "0"))}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            label="Pending Rewards"
            value={formatCurrency(parseFloat(stats?.pendingRewards ?? "0"))}
            icon={<Clock className="h-5 w-5" />}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Referral List -- 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Referrals Table */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Your Referrals</CardTitle>
              <Badge variant="outline">
                {loading ? "..." : `${referrals.length} total`}
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton />
              ) : referrals.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500">
                  No referrals yet. Share your link to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Contributions</TableHead>
                      <TableHead className="text-right">
                        Your Earnings
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((ref) => {
                      const contributed = parseFloat(ref.totalContributed);
                      const earned = parseFloat(ref.rewardEarned);
                      return (
                        <TableRow key={ref.id}>
                          <TableCell className="font-mono text-zinc-300">
                            {ref.displayName || ref.walletAddress}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(ref.status)} size="sm">
                              {statusLabel(ref.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-400">
                            {formatDate(ref.joinedAt)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {contributed > 0
                              ? formatCurrency(contributed)
                              : "--"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-emerald-400">
                            {earned > 0
                              ? formatCurrency(earned)
                              : "--"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Rewards Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Claimable Rewards</p>
                  <p className="text-2xl font-bold text-zinc-50">
                    {loading
                      ? "--"
                      : formatCurrency(parseFloat(stats?.pendingRewards ?? "0"))}
                  </p>
                </div>
                <Button
                  leftIcon={<Gift className="h-4 w-4" />}
                  disabled
                  title="Coming soon"
                >
                  Claim Rewards
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column -- 1/3 */}
        <div className="space-y-6">
          {/* Reward Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Reward Structure
              </CardTitle>
              <CardDescription>How you earn from referrals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {loading ? (
                <LeaderboardSkeleton />
              ) : data?.rewardStructure ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-zinc-800/40">
                    <span className="text-sm text-zinc-400">Contribution Commission</span>
                    <span className="text-sm font-medium tabular-nums text-zinc-200">
                      {data.rewardStructure.contributionPercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-zinc-800/40">
                    <span className="text-sm text-zinc-400">Staking Commission</span>
                    <span className="text-sm font-medium tabular-nums text-zinc-200">
                      {data.rewardStructure.stakingPercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-zinc-800/40">
                    <span className="text-sm text-zinc-400">Max per Referral</span>
                    <span className="text-sm font-medium tabular-nums text-zinc-200">
                      {formatCurrency(parseFloat(data.rewardStructure.maxRewardPerReferral))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-zinc-800/40">
                    <span className="text-sm text-zinc-400">Vesting Period</span>
                    <span className="text-sm font-medium text-zinc-200">
                      {data.rewardStructure.vestingPeriod}
                    </span>
                  </div>
                  <div className="mt-2 border-t border-zinc-800 pt-3">
                    <div className="flex items-center justify-between rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-zinc-300">Lifetime Volume</span>
                      <span className="text-sm font-medium tabular-nums text-zinc-200">
                        {formatCurrency(parseFloat(stats?.lifetimeVolume ?? "0"))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Referral Tiers */}
          <Card>
            <CardHeader>
              <CardTitle>Referral Tiers</CardTitle>
              <CardDescription>
                Earn higher commissions with more referrals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {REFERRAL_TIERS.map((tier) => {
                const isCurrent = currentRefTier?.name === tier.name;

                return (
                  <div
                    key={tier.name}
                    className={cn(
                      "rounded-lg border p-3 transition-all",
                      isCurrent
                        ? `${tier.borderColor} ${tier.bgColor}`
                        : "border-zinc-800"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown
                          className={cn(
                            "h-4 w-4",
                            isCurrent ? tier.color : "text-zinc-600"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isCurrent ? tier.color : "text-zinc-400"
                          )}
                        >
                          {tier.name}
                        </span>
                      </div>
                      {isCurrent && (
                        <Badge variant="success" size="sm">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">{tier.range}</span>
                      <span
                        className={cn(
                          "font-medium",
                          isCurrent ? tier.color : "text-zinc-500"
                        )}
                      >
                        {tier.bonus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
