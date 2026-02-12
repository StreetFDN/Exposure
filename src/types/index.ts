// =============================================================================
// Exposure — Supplementary TypeScript Types
// Extends auto-generated Prisma types with application-specific shapes.
// =============================================================================

import type {
  Deal,
  User,
  Contribution,
  Allocation,
  DealPhase,
  LinkedWallet,
  StakingPosition,
  StakingReward,
  VestingSchedule,
  ClaimRecord,
  Notification,
  ComplianceFlag,
  AuditLog,
  Transaction,
  ReferralReward,
  ProjectApplication,
  DealStatus,
  DealCategory,
  Chain,
  TierLevel,
  AllocationMethod,
  StakingLockPeriod,
} from "@prisma/client";

import type { Address } from "viem";

// =============================================================================
// Re-exports — allow consumers to import everything from "@/types"
// =============================================================================

export type {
  Deal,
  User,
  Contribution,
  Allocation,
  DealPhase,
  LinkedWallet,
  StakingPosition,
  StakingReward,
  VestingSchedule,
  ClaimRecord,
  Notification,
  ComplianceFlag,
  AuditLog,
  Transaction,
  ReferralReward,
  ProjectApplication,
} from "@prisma/client";

export type {
  UserRole,
  KycStatus,
  KycTier,
  DealStatus,
  DealCategory,
  ContributionStatus,
  AllocationMethod,
  VestingType,
  ApplicationStatus,
  NotificationType,
  Chain,
  TransactionType,
  StakingLockPeriod,
  TierLevel,
  FlagReason,
} from "@prisma/client";

// =============================================================================
// Auth / Session
// =============================================================================

export interface Session {
  user: User;
  accessToken: string;
  expiresAt: number;
}

// =============================================================================
// Composite / Relation Types
// =============================================================================

/** Deal loaded with its child relations — used on deal detail pages & admin. */
export type DealWithRelations = Deal & {
  contributions: Contribution[];
  allocations: Allocation[];
  dealPhases: DealPhase[];
  vestingSchedules: VestingSchedule[];
  createdBy: Pick<User, "id" | "walletAddress" | "displayName">;
};

/** User loaded with commonly needed relations. */
export type UserWithRelations = User & {
  wallets: LinkedWallet[];
  contributions: ContributionWithDeal[];
  stakingPositions: (StakingPosition & { rewards: StakingReward[] })[];
  allocations: Allocation[];
  notifications: Notification[];
  referrals: Pick<User, "id" | "walletAddress" | "displayName" | "createdAt">[];
  vestingSchedules: VestingSchedule[];
};

/** Contribution joined with its parent deal — used in portfolio views. */
export type ContributionWithDeal = Contribution & {
  deal: Pick<
    Deal,
    | "id"
    | "title"
    | "slug"
    | "projectName"
    | "featuredImageUrl"
    | "status"
    | "category"
    | "chain"
    | "tokenPrice"
    | "distributionTokenSymbol"
    | "raiseTokenSymbol"
  >;
};

// =============================================================================
// UI / View-Model Types
// =============================================================================

/** Minimal deal shape rendered in listing cards on the explore page. */
export interface DealCardProps {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  projectName: string;
  category: DealCategory;
  status: DealStatus;
  chain: Chain;
  tokenPrice: string; // serialized Decimal
  totalRaise: string;
  totalRaised: string;
  hardCap: string;
  contributorCount: number;
  allocationMethod: AllocationMethod;
  minTierRequired: TierLevel | null;
  registrationOpenAt: string | null; // ISO date string
  contributionOpenAt: string | null;
  contributionCloseAt: string | null;
  featuredImageUrl: string | null;
  bannerImageUrl: string | null;
  isFeatured: boolean;
  requiresKyc: boolean;
  requiresAccreditation: boolean;
}

/** A single row in the user's portfolio view. */
export interface PortfolioItem {
  deal: Pick<
    Deal,
    | "id"
    | "title"
    | "slug"
    | "projectName"
    | "featuredImageUrl"
    | "status"
    | "category"
    | "chain"
    | "tokenPrice"
    | "distributionTokenSymbol"
    | "raiseTokenSymbol"
  >;
  contribution: Pick<
    Contribution,
    "id" | "amount" | "amountUsd" | "currency" | "status" | "createdAt"
  >;
  allocation: Pick<
    Allocation,
    "finalAmount" | "allocationMethod" | "isFinalized"
  > | null;
  vesting: VestingProgress | null;
  currentTokenPrice: string | null; // live market price, serialized Decimal
  currentValueUsd: string | null;
  roiPercent: number | null;
}

// =============================================================================
// Staking & Tier Types
// =============================================================================

/** Configuration for a single tier level. */
export interface TierConfig {
  tierLevel: TierLevel;
  stakedAmount: string; // minimum staked amount (serialized Decimal)
  lockPeriod: StakingLockPeriod;
  allocationMultiplier: number;
  lotteryWeight: number;
  benefits: string[];
}

/** Full tier configuration map keyed by tier level. */
export type TierConfigMap = Record<TierLevel, TierConfig>;

// =============================================================================
// Chain Config
// =============================================================================

export interface ChainConfig {
  chain: Chain;
  chainId: number;
  name: string;
  icon: string;
  explorerUrl: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// =============================================================================
// Allocation Types
// =============================================================================

/** Result returned after the allocation engine processes a deal round. */
export interface AllocationResult {
  dealId: string;
  allocationMethod: AllocationMethod;
  totalAllocated: string; // serialized Decimal
  totalRequested: string;
  oversubscriptionRatio: number;
  allocations: {
    userId: string;
    walletAddress: string;
    tierLevel: TierLevel;
    requestedAmount: string;
    guaranteedAmount: string;
    finalAmount: string;
    lotteryTickets: number;
    lotteryWon: boolean | null;
  }[];
  processedAt: string; // ISO date string
}

// =============================================================================
// Vesting Types
// =============================================================================

/** Client-facing vesting progress summary for a single position. */
export interface VestingProgress {
  totalAmount: string; // serialized Decimal
  claimedAmount: string;
  claimableAmount: string;
  nextUnlockAt: string | null; // ISO date string
  nextUnlockAmount: string | null;
  percentComplete: number; // 0-100
}

// =============================================================================
// Platform / Admin Types
// =============================================================================

/** High-level platform statistics shown on marketing pages. */
export interface PlatformStats {
  totalRaised: string; // serialized Decimal
  totalDeals: number;
  totalUsers: number;
  activeDeals: number;
}

/** Extended stats shown on the admin dashboard. */
export interface AdminDashboardStats extends PlatformStats {
  totalContributions: number;
  totalContributionsUsd: string;
  pendingApplications: number;
  unresolvedFlags: number;
  activeStakers: number;
  totalStaked: string;
  usersByTier: Record<TierLevel, number>;
  recentDeals: DealCardProps[];
  recentContributions: (Contribution & {
    user: Pick<User, "id" | "walletAddress" | "displayName">;
    deal: Pick<Deal, "id" | "title" | "slug">;
  })[];
  recentFlags: (ComplianceFlag & {
    user: Pick<User, "id" | "walletAddress">;
  })[];
  dailyVolumeUsd: { date: string; volume: string }[];
}

// =============================================================================
// Filter / Query Types
// =============================================================================

export type SortOrder = "asc" | "desc";

export type DealSortBy =
  | "createdAt"
  | "totalRaised"
  | "contributorCount"
  | "tokenPrice"
  | "contributionOpenAt"
  | "hardCap";

/** Filters for the deal listing / explore page. */
export interface DealFilters {
  status?: DealStatus | DealStatus[];
  category?: DealCategory | DealCategory[];
  chain?: Chain | Chain[];
  search?: string;
  minTierRequired?: TierLevel;
  isFeatured?: boolean;
  requiresKyc?: boolean;
  sortBy?: DealSortBy;
  sortOrder?: SortOrder;
}

// =============================================================================
// Generic API Response Wrappers
// =============================================================================

/** Paginated list response returned by all list endpoints. */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/** Standard API envelope for all endpoints. */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } | null;
  meta?: {
    requestId: string;
    timestamp: string;
  };
}
