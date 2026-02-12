"use client";

import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";
import {
  formatCurrency,
  formatAddress,
  formatDate,
  formatToken,
} from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Placeholder Data
// ---------------------------------------------------------------------------

const REFERRAL_LINK = "https://exposure.fi/ref/7a3B1c2D";

const STATS = {
  totalReferrals: 18,
  activeReferrals: 14,
  totalEarned: 2847.5,
  pendingRewards: 425.0,
};

interface Referral {
  id: string;
  wallet: string;
  status: "Active" | "Pending" | "Inactive";
  joinedDate: string;
  contributions: number;
  yourEarnings: number;
}

const REFERRALS: Referral[] = [
  {
    id: "1",
    wallet: "0x8b3C...4d2E",
    status: "Active",
    joinedDate: "2025-12-01",
    contributions: 12500,
    yourEarnings: 312.5,
  },
  {
    id: "2",
    wallet: "0xa1D2...9f3B",
    status: "Active",
    joinedDate: "2025-11-15",
    contributions: 8000,
    yourEarnings: 200.0,
  },
  {
    id: "3",
    wallet: "0x5e7F...1a2C",
    status: "Active",
    joinedDate: "2025-11-01",
    contributions: 25000,
    yourEarnings: 625.0,
  },
  {
    id: "4",
    wallet: "0x3c4D...8b9E",
    status: "Pending",
    joinedDate: "2026-01-20",
    contributions: 0,
    yourEarnings: 0,
  },
  {
    id: "5",
    wallet: "0x9f0A...2c3D",
    status: "Active",
    joinedDate: "2025-10-10",
    contributions: 5000,
    yourEarnings: 125.0,
  },
  {
    id: "6",
    wallet: "0x6b7C...0d1E",
    status: "Inactive",
    joinedDate: "2025-09-05",
    contributions: 1000,
    yourEarnings: 25.0,
  },
  {
    id: "7",
    wallet: "0x2d3E...7f8A",
    status: "Active",
    joinedDate: "2025-12-20",
    contributions: 15000,
    yourEarnings: 375.0,
  },
  {
    id: "8",
    wallet: "0x4e5F...6a7B",
    status: "Active",
    joinedDate: "2026-01-05",
    contributions: 3500,
    yourEarnings: 87.5,
  },
];

interface LeaderboardEntry {
  rank: number;
  address: string;
  referralCount: number;
  totalEarned: number;
  isYou: boolean;
}

const LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    address: "0x1a2B...3c4D",
    referralCount: 87,
    totalEarned: 15420,
    isYou: false,
  },
  {
    rank: 2,
    address: "0x5e6F...7a8B",
    referralCount: 63,
    totalEarned: 11250,
    isYou: false,
  },
  {
    rank: 3,
    address: "0x9c0D...1e2F",
    referralCount: 51,
    totalEarned: 8730,
    isYou: false,
  },
  {
    rank: 4,
    address: "0x3a4B...5c6D",
    referralCount: 42,
    totalEarned: 6890,
    isYou: false,
  },
  {
    rank: 5,
    address: "0x7e8F...9a0B",
    referralCount: 35,
    totalEarned: 5410,
    isYou: false,
  },
  {
    rank: 6,
    address: "0x1c2D...3e4F",
    referralCount: 29,
    totalEarned: 4120,
    isYou: false,
  },
  {
    rank: 7,
    address: "0x7a3B...9f4E",
    referralCount: 18,
    totalEarned: 2847,
    isYou: true,
  },
  {
    rank: 8,
    address: "0x5a6B...7c8D",
    referralCount: 15,
    totalEarned: 2210,
    isYou: false,
  },
  {
    rank: 9,
    address: "0x9e0F...1a2B",
    referralCount: 12,
    totalEarned: 1850,
    isYou: false,
  },
  {
    rank: 10,
    address: "0x3c4D...5e6F",
    referralCount: 9,
    totalEarned: 1340,
    isYou: false,
  },
];

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
    case "Active":
      return "success";
    case "Pending":
      return "warning";
    default:
      return "outline";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReferralsPage() {
  const [linkCopied, setLinkCopied] = useState(false);
  const currentRefTier = getCurrentReferralTier(STATS.totalReferrals);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_LINK);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // fail silently
    }
  };

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on Exposure -- the premier crypto capital raising platform! Use my referral link: ${REFERRAL_LINK}`)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(REFERRAL_LINK)}&text=${encodeURIComponent("Join Exposure -- crypto capital raising made simple!")}`;

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
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-300">
                Your Referral Link
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5">
                <Link2 className="h-4 w-4 shrink-0 text-violet-400" />
                <code className="text-sm text-zinc-200">{REFERRAL_LINK}</code>
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Referrals"
          value={String(STATS.totalReferrals)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Active Referrals"
          value={String(STATS.activeReferrals)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Total Earned"
          value={formatCurrency(STATS.totalEarned)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Rewards"
          value={formatCurrency(STATS.pendingRewards)}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Referral List — 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Referrals Table */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Your Referrals</CardTitle>
              <Badge variant="outline">{REFERRALS.length} total</Badge>
            </CardHeader>
            <CardContent>
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
                  {REFERRALS.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell className="font-mono text-zinc-300">
                        {ref.wallet}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(ref.status)} size="sm">
                          {ref.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {formatDate(ref.joinedDate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {ref.contributions > 0
                          ? formatCurrency(ref.contributions)
                          : "--"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-emerald-400">
                        {ref.yourEarnings > 0
                          ? formatCurrency(ref.yourEarnings)
                          : "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Rewards Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Claimable Rewards</p>
                  <p className="text-2xl font-bold text-zinc-50">
                    {formatCurrency(STATS.pendingRewards)}
                  </p>
                </div>
                <Button leftIcon={<Gift className="h-4 w-4" />}>
                  Claim Rewards
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — 1/3 */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                Leaderboard
              </CardTitle>
              <CardDescription>Top 10 referrers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {LEADERBOARD.map((entry) => (
                <div
                  key={entry.rank}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                    entry.isYou
                      ? "border border-violet-500/30 bg-violet-500/5"
                      : "hover:bg-zinc-800/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      entry.rank === 1
                        ? "bg-amber-500/20 text-amber-400"
                        : entry.rank === 2
                        ? "bg-zinc-400/20 text-zinc-300"
                        : entry.rank === 3
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {entry.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate font-mono text-sm",
                        entry.isYou
                          ? "font-semibold text-violet-400"
                          : "text-zinc-300"
                      )}
                    >
                      {entry.address}
                      {entry.isYou && (
                        <span className="ml-2 font-sans text-xs text-violet-400">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {entry.referralCount} referrals
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums text-zinc-200">
                    {formatCurrency(entry.totalEarned)}
                  </span>
                </div>
              ))}
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
                const isBelow =
                  currentRefTier &&
                  STATS.totalReferrals >= tier.minRefs &&
                  !isCurrent &&
                  REFERRAL_TIERS.indexOf(tier) <
                    REFERRAL_TIERS.indexOf(currentRefTier);

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
