// =============================================================================
// Exposure -- Frontend API Types
// Plain TypeScript interfaces matching API response shapes.
// These are decoupled from Prisma so the frontend never imports @prisma/client
// at runtime (important for bundle size and client components).
// =============================================================================

// =============================================================================
// Enums (mirrored from Prisma schema as string unions)
// =============================================================================

export type UserRole =
  | "INVESTOR"
  | "PROJECT_ADMIN"
  | "PLATFORM_ADMIN"
  | "SUPER_ADMIN"
  | "COMPLIANCE_OFFICER"
  | "SUPPORT_AGENT";

export type KycStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export type KycTier = "BASIC" | "STANDARD" | "ACCREDITED";

export type DealStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REGISTRATION_OPEN"
  | "GUARANTEED_ALLOCATION"
  | "FCFS"
  | "SETTLEMENT"
  | "DISTRIBUTING"
  | "COMPLETED"
  | "CANCELLED";

export type DealCategory =
  | "DEFI"
  | "GAMING"
  | "AI"
  | "INFRASTRUCTURE"
  | "NFT"
  | "SOCIAL"
  | "OTHER";

export type ContributionStatus = "PENDING" | "CONFIRMED" | "REFUNDED" | "FAILED";

export type AllocationMethod =
  | "GUARANTEED"
  | "PRO_RATA"
  | "LOTTERY"
  | "FCFS"
  | "HYBRID";

export type VestingType = "LINEAR" | "MONTHLY_CLIFF" | "CUSTOM" | "TGE_PLUS_LINEAR";

export type NotificationType =
  | "DEAL_ALERT"
  | "VESTING"
  | "ACCOUNT"
  | "COMPLIANCE"
  | "MARKETING";

export type Chain = "ETHEREUM" | "BASE" | "ARBITRUM";

export type StakingLockPeriod =
  | "NONE"
  | "THIRTY_DAYS"
  | "NINETY_DAYS"
  | "ONE_EIGHTY_DAYS"
  | "THREE_SIXTY_FIVE_DAYS";

export type TierLevel = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

export type GroupStatus = "PENDING_APPROVAL" | "ACTIVE" | "SUSPENDED" | "CLOSED";

export type GroupMemberRole = "LEAD" | "CO_LEAD" | "MEMBER";

export type GroupMemberStatus = "PENDING" | "APPROVED" | "REJECTED" | "LEFT";

// =============================================================================
// User
// =============================================================================

export interface User {
  id: string;
  walletAddress: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  kycStatus: KycStatus;
  kycTier: KycTier | null;
  tierLevel: TierLevel;
  totalPoints: number;
  totalContributed: string;
  referralCode: string;
  country: string | null;
  isBanned: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight user returned by session endpoint. */
export interface SessionUser {
  id: string;
  walletAddress: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  kycStatus: string;
  tierLevel: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  referralCode: string;
  createdAt: string;
}

export interface UserProfile extends User {
  wallets: LinkedWallet[];
}

export interface LinkedWallet {
  id: string;
  address: string;
  chain: Chain;
  isPrimary: boolean;
  linkedAt: string;
}

// =============================================================================
// Deal
// =============================================================================

export interface Deal {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  projectName: string;
  projectWebsite: string | null;
  projectTwitter: string | null;
  projectDiscord: string | null;
  projectTelegram: string | null;
  projectGithub: string | null;
  category: DealCategory;
  status: DealStatus;
  chain: Chain;
  raiseTokenAddress: string | null;
  raiseTokenSymbol: string | null;
  distributionTokenAddress: string | null;
  distributionTokenSymbol: string | null;
  tokenPrice: string;
  totalRaise: string;
  softCap: string | null;
  hardCap: string;
  minContribution: string;
  maxContribution: string;
  totalRaised: string;
  contributorCount: number;
  allocationMethod: AllocationMethod;
  vestingType: VestingType;
  tgeUnlockPercent: string;
  vestingCliffDays: number;
  vestingDurationDays: number;
  fdv: string | null;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  contributionOpenAt: string | null;
  contributionCloseAt: string | null;
  distributionAt: string | null;
  vestingStartAt: string | null;
  minTierRequired: TierLevel | null;
  requiresKyc: boolean;
  requiresAccreditation: boolean;
  isWhitelistOnly: boolean;
  allowedCountries: string[];
  blockedCountries: string[];
  pitchDeckUrl: string | null;
  whitepaperUrl: string | null;
  auditReportUrl: string | null;
  tokenomicsImageUrl: string | null;
  teamMembers: unknown;
  featuredImageUrl: string | null;
  bannerImageUrl: string | null;
  isFeatured: boolean;
  spvName: string | null;
  spvJurisdiction: string | null;
  platformFeePercent: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

/** Deal with child relations -- used on detail pages. */
export interface DealDetail extends Deal {
  contributions: Contribution[];
  allocations: Allocation[];
  dealPhases: DealPhase[];
  createdBy: Pick<User, "id" | "walletAddress" | "displayName">;
}

export interface DealPhase {
  id: string;
  dealId: string;
  phaseName: string;
  phaseOrder: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
}

// =============================================================================
// Contribution
// =============================================================================

export interface Contribution {
  id: string;
  userId: string;
  dealId: string;
  amount: string;
  currency: string;
  amountUsd: string;
  txHash: string | null;
  chain: Chain;
  status: ContributionStatus;
  refundAmount: string | null;
  refundTxHash: string | null;
  refundedAt: string | null;
  confirmedAt: string | null;
  blockNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Contribution joined with its parent deal -- used in portfolio views. */
export interface ContributionWithDeal extends Contribution {
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
}

// =============================================================================
// Allocation
// =============================================================================

export interface Allocation {
  id: string;
  userId: string;
  dealId: string;
  guaranteedAmount: string;
  requestedAmount: string;
  finalAmount: string;
  allocationMethod: AllocationMethod;
  lotteryTickets: number;
  lotteryWon: boolean | null;
  merkleProof: string | null;
  isFinalized: boolean;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Staking
// =============================================================================

export interface StakingPosition {
  id: string;
  userId: string;
  amount: string;
  lockPeriod: StakingLockPeriod;
  apy: string;
  stakedAt: string;
  unlockAt: string | null;
  isActive: boolean;
  txHash: string | null;
  chain: Chain;
  rewards: StakingReward[];
  createdAt: string;
}

export interface StakingReward {
  id: string;
  amount: string;
  rewardType: string;
  claimedAt: string | null;
  txHash: string | null;
  createdAt: string;
}

/** Aggregated staking data returned by GET /api/staking. */
export interface StakingData {
  currentTier: TierLevel;
  totalStaked: string;
  totalRewardsEarned: string;
  pendingRewards: string;
  nextTierRequirement: {
    tier: TierLevel;
    amountRequired: string;
    amountNeeded: string;
  } | null;
  positions: StakingPosition[];
}

/** Tier configuration returned by GET /api/staking/tiers. */
export interface StakingTier {
  tierLevel: string;
  displayName: string;
  stakedAmount: string;
  lockPeriod: string | null;
  allocationMultiplier: number;
  lotteryWeight: number;
  color: string;
  benefits: string[];
  memberCount: number;
}

export interface StakingTiersData {
  tiers: StakingTier[];
  stakingToken: string;
  stakingContractAddress: string;
  stakingChain: string;
  apyRanges: Record<string, string>;
}

// =============================================================================
// Investment Group
// =============================================================================

export interface InvestmentGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  leadId: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isPublic: boolean;
  status: GroupStatus;
  maxMembers: number;
  minTierRequired: TierLevel | null;
  requiresApplication: boolean;
  carryPercent: string;
  totalRaised: string;
  dealCount: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  lead?: Pick<User, "id" | "walletAddress" | "displayName" | "avatarUrl">;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: string | null;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "walletAddress" | "displayName" | "avatarUrl">;
}

export interface GroupDeal {
  id: string;
  groupId: string;
  dealId: string;
  allocatedAmount: string;
  filledAmount: string;
  isActive: boolean;
  presentedAt: string;
  deal?: Pick<
    Deal,
    "id" | "title" | "slug" | "status" | "category" | "tokenPrice"
  >;
}

/** Detailed group view returned by GET /api/groups/[slug]. */
export interface GroupDetail extends InvestmentGroup {
  lead: Pick<User, "id" | "walletAddress" | "displayName" | "avatarUrl">;
  members: GroupMembership[];
  dealAllocations: GroupDeal[];
}

// =============================================================================
// Notification
// =============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: unknown;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// =============================================================================
// Portfolio
// =============================================================================

export interface VestingProgress {
  totalAmount: string;
  claimedAmount: string;
  claimableAmount: string;
  nextUnlockAt: string | null;
  nextUnlockAmount: string | null;
  percentComplete: number;
}

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
  currentTokenPrice: string | null;
  currentValueUsd: string | null;
  roiPercent: number | null;
}

export interface PortfolioSummary {
  totalInvestedUsd: string;
  currentValueUsd: string;
  totalPnlUsd: string;
  totalPnlPercent: number;
  activePositions: number;
  vestingPositions: number;
  completedPositions: number;
}

export interface PortfolioData {
  summary: PortfolioSummary;
  items: PortfolioItem[];
}
