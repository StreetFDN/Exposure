// =============================================================================
// Exposure — Database Seed Script
// Run: npx tsx prisma/seed.ts
// =============================================================================

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helper: Generate a fake encrypted TOTP secret (mimics AES-256-GCM format)
// ---------------------------------------------------------------------------
function fakeEncryptedSecret(): string {
  const iv = crypto.randomBytes(12).toString("hex");
  const authTag = crypto.randomBytes(16).toString("hex");
  const ciphertext = crypto.randomBytes(20).toString("hex");
  return `${iv}:${authTag}:${ciphertext}`;
}

// ---------------------------------------------------------------------------
// Helper: Generate a fake attestation hash (0x-prefixed 32-byte hex)
// ---------------------------------------------------------------------------
function randomAttestationHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

// ---------------------------------------------------------------------------
// Helper: Generate a realistic Ethereum address
// ---------------------------------------------------------------------------
function randomAddress(): string {
  return "0x" + crypto.randomBytes(20).toString("hex");
}

// ---------------------------------------------------------------------------
// Helper: Generate a realistic tx hash
// ---------------------------------------------------------------------------
function randomTxHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

// ---------------------------------------------------------------------------
// Helper: Date helpers relative to "now"
// ---------------------------------------------------------------------------
const NOW = new Date();

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000);
}

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

async function main() {
  console.log("Cleaning existing data...");

  // Delete in reverse dependency order to respect foreign keys
  await prisma.groupDeal.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.investmentGroup.deleteMany();
  await prisma.claimRecord.deleteMany();
  await prisma.vestingSchedule.deleteMany();
  await prisma.stakingReward.deleteMany();
  await prisma.stakingPosition.deleteMany();
  await prisma.referralReward.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.complianceFlag.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.dealPhase.deleteMany();
  await prisma.projectApplication.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.linkedWallet.deleteMany();
  await prisma.platformConfig.deleteMany();
  await prisma.user.deleteMany();

  console.log("Database cleaned. Seeding...");

  // ===========================================================================
  // USERS (10)
  // ===========================================================================

  const superAdmin = await prisma.user.create({
    data: {
      walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      email: "superadmin@exposure.fi",
      displayName: "Exposure SuperAdmin",
      role: "SUPER_ADMIN",
      kycStatus: "APPROVED",
      kycTier: "ACCREDITED",
      kycApprovedAt: daysAgo(180),
      kycExpiresAt: daysFromNow(185),
      tierLevel: "DIAMOND",
      totalPoints: 50000,
      totalContributed: 0,
      country: "US",
      lastLoginAt: hoursAgo(1),
      investorClassification: "sophisticated",
      isAccreditedUS: true,
      accreditationMethod: "qualified_purchaser",
      attestationHash: randomAttestationHash(),
      attestationExpiresAt: daysFromNow(365),
      twoFactorEnabled: true,
      twoFactorSecret: fakeEncryptedSecret(),
    },
  });

  const platformAdmin = await prisma.user.create({
    data: {
      walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      email: "admin@exposure.fi",
      displayName: "Platform Admin",
      role: "PLATFORM_ADMIN",
      kycStatus: "APPROVED",
      kycTier: "ACCREDITED",
      kycApprovedAt: daysAgo(150),
      kycExpiresAt: daysFromNow(215),
      tierLevel: "PLATINUM",
      totalPoints: 35000,
      totalContributed: 0,
      country: "SG",
      lastLoginAt: hoursAgo(3),
      investorClassification: "sophisticated",
      attestationHash: randomAttestationHash(),
      attestationExpiresAt: daysFromNow(330),
      twoFactorEnabled: true,
      twoFactorSecret: fakeEncryptedSecret(),
    },
  });

  const complianceOfficer = await prisma.user.create({
    data: {
      walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      email: "compliance@exposure.fi",
      displayName: "Compliance Officer",
      role: "COMPLIANCE_OFFICER",
      kycStatus: "APPROVED",
      kycTier: "STANDARD",
      kycApprovedAt: daysAgo(120),
      kycExpiresAt: daysFromNow(245),
      tierLevel: "GOLD",
      totalPoints: 20000,
      totalContributed: 0,
      country: "CH",
      lastLoginAt: hoursAgo(2),
      investorClassification: "experienced",
      attestationHash: randomAttestationHash(),
      attestationExpiresAt: daysFromNow(300),
    },
  });

  // 7 INVESTOR users
  const investor1 = await prisma.user.create({
    data: {
      walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      email: "whale@protonmail.com",
      displayName: "CryptoWhale.eth",
      role: "INVESTOR",
      kycStatus: "APPROVED",
      kycTier: "ACCREDITED",
      kycApprovedAt: daysAgo(90),
      kycExpiresAt: daysFromNow(275),
      tierLevel: "GOLD",
      totalPoints: 15000,
      totalContributed: 125000,
      country: "US",
      lastLoginAt: hoursAgo(5),
      investorClassification: "experienced",
      isAccreditedUS: true,
      accreditationMethod: "net_worth",
      attestationHash: randomAttestationHash(),
      attestationExpiresAt: daysFromNow(275),
    },
  });

  const investor2 = await prisma.user.create({
    data: {
      walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      email: "defi_maxi@gmail.com",
      displayName: "defi_maxi",
      role: "INVESTOR",
      kycStatus: "APPROVED",
      kycTier: "STANDARD",
      kycApprovedAt: daysAgo(60),
      kycExpiresAt: daysFromNow(305),
      tierLevel: "GOLD",
      totalPoints: 12000,
      totalContributed: 75000,
      country: "DE",
      lastLoginAt: hoursAgo(8),
      investorClassification: "experienced",
      attestationHash: randomAttestationHash(),
      attestationExpiresAt: daysFromNow(305),
    },
  });

  const investor3 = await prisma.user.create({
    data: {
      walletAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
      email: "alice@web3fund.io",
      displayName: "alice.eth",
      role: "INVESTOR",
      kycStatus: "APPROVED",
      kycTier: "STANDARD",
      kycApprovedAt: daysAgo(45),
      kycExpiresAt: daysFromNow(320),
      tierLevel: "SILVER",
      totalPoints: 8000,
      totalContributed: 32000,
      country: "JP",
      lastLoginAt: daysAgo(1),
      investorClassification: "experienced",
      attestationHash: randomAttestationHash(),
      attestationExpiresAt: daysFromNow(320),
    },
  });

  const investor4 = await prisma.user.create({
    data: {
      walletAddress: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
      email: "bob@cryptomail.xyz",
      displayName: "bobTheBuilder",
      role: "INVESTOR",
      kycStatus: "APPROVED",
      kycTier: "BASIC",
      kycApprovedAt: daysAgo(30),
      kycExpiresAt: daysFromNow(335),
      tierLevel: "SILVER",
      totalPoints: 5000,
      totalContributed: 15000,
      country: "GB",
      lastLoginAt: daysAgo(2),
      investorClassification: "experienced",
      attestationHash: randomAttestationHash(),
      attestationExpiresAt: daysFromNow(335),
    },
  });

  const investor5 = await prisma.user.create({
    data: {
      walletAddress: "0x14dC79964da2C08dfa0b275a74674f0B4E7D2C63",
      displayName: "anon_trader",
      role: "INVESTOR",
      kycStatus: "APPROVED",
      kycTier: "BASIC",
      kycApprovedAt: daysAgo(20),
      kycExpiresAt: daysFromNow(345),
      tierLevel: "BRONZE",
      totalPoints: 2500,
      totalContributed: 5000,
      country: "KR",
      lastLoginAt: daysAgo(3),
      investorClassification: "retail",
      attestationHash: randomAttestationHash(),
      attestationExpiresAt: daysFromNow(345),
    },
  });

  const investor6 = await prisma.user.create({
    data: {
      walletAddress: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
      email: "newuser@hotmail.com",
      displayName: "crypto_newbie",
      role: "INVESTOR",
      kycStatus: "PENDING",
      tierLevel: "BRONZE",
      totalPoints: 500,
      totalContributed: 0,
      country: "BR",
      lastLoginAt: daysAgo(1),
      investorClassification: "retail",
    },
  });

  const investor7 = await prisma.user.create({
    data: {
      walletAddress: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
      displayName: null,
      role: "INVESTOR",
      kycStatus: "NONE",
      tierLevel: "BRONZE",
      totalPoints: 100,
      totalContributed: 0,
      lastLoginAt: daysAgo(7),
      investorClassification: "retail",
    },
  });

  const allInvestors = [investor1, investor2, investor3, investor4, investor5, investor6, investor7];

  console.log(`Created ${3 + allInvestors.length} users`);

  // ===========================================================================
  // LINKED WALLETS (1-3 per investor)
  // ===========================================================================

  const walletData = [
    { userId: investor1.id, address: randomAddress(), chain: "ETHEREUM" as const, isPrimary: true },
    { userId: investor1.id, address: randomAddress(), chain: "ARBITRUM" as const, isPrimary: false },
    { userId: investor1.id, address: randomAddress(), chain: "BASE" as const, isPrimary: false },
    { userId: investor2.id, address: randomAddress(), chain: "ETHEREUM" as const, isPrimary: true },
    { userId: investor2.id, address: randomAddress(), chain: "BASE" as const, isPrimary: false },
    { userId: investor3.id, address: randomAddress(), chain: "ETHEREUM" as const, isPrimary: true },
    { userId: investor3.id, address: randomAddress(), chain: "ARBITRUM" as const, isPrimary: false },
    { userId: investor4.id, address: randomAddress(), chain: "ETHEREUM" as const, isPrimary: true },
    { userId: investor5.id, address: randomAddress(), chain: "ARBITRUM" as const, isPrimary: true },
    { userId: investor5.id, address: randomAddress(), chain: "BASE" as const, isPrimary: false },
    { userId: investor6.id, address: randomAddress(), chain: "ETHEREUM" as const, isPrimary: true },
    { userId: investor7.id, address: randomAddress(), chain: "ETHEREUM" as const, isPrimary: true },
  ];

  for (const w of walletData) {
    await prisma.linkedWallet.create({ data: w });
  }

  console.log(`Created ${walletData.length} linked wallets`);

  // ===========================================================================
  // DEALS (8)
  // ===========================================================================

  // Deal 1: COMPLETED (DeFi, Ethereum)
  const deal1 = await prisma.deal.create({
    data: {
      title: "Meridian Finance - Seed Round",
      slug: "meridian-finance-seed",
      description: "Meridian Finance is a next-generation lending protocol that enables under-collateralized loans through on-chain credit scoring and social reputation systems. The protocol introduces novel risk assessment mechanisms powered by machine learning models trained on wallet history and DeFi interaction patterns.",
      shortDescription: "Under-collateralized DeFi lending with on-chain credit scoring",
      projectName: "Meridian Finance",
      projectWebsite: "https://meridian.finance",
      projectTwitter: "https://twitter.com/meridianfi",
      projectDiscord: "https://discord.gg/meridianfi",
      category: "DEFI",
      status: "COMPLETED",
      chain: "ETHEREUM",
      raiseTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      raiseTokenSymbol: "USDC",
      distributionTokenSymbol: "MRD",
      tokenPrice: "0.08",
      totalRaise: "2000000",
      softCap: "1000000",
      hardCap: "2000000",
      minContribution: "100",
      maxContribution: "50000",
      totalRaised: "1950000",
      contributorCount: 312,
      allocationMethod: "HYBRID",
      vestingType: "TGE_PLUS_LINEAR",
      tgeUnlockPercent: 20,
      vestingCliffDays: 30,
      vestingDurationDays: 365,
      registrationOpenAt: daysAgo(90),
      registrationCloseAt: daysAgo(80),
      contributionOpenAt: daysAgo(78),
      contributionCloseAt: daysAgo(65),
      distributionAt: daysAgo(60),
      vestingStartAt: daysAgo(60),
      minTierRequired: "BRONZE",
      requiresKyc: true,
      isFeatured: false,
      createdById: superAdmin.id,
    },
  });

  // Deal 2: COMPLETED (Gaming, Base)
  const deal2 = await prisma.deal.create({
    data: {
      title: "PixelVerse - Community Round",
      slug: "pixelverse-community",
      description: "PixelVerse is a fully on-chain multiplayer strategy game built on Base. Players own, trade, and battle with unique pixel armies represented as dynamic NFTs. The game features a player-driven economy with real-time combat mechanics and seasonal tournaments with prize pools funded by the protocol treasury.",
      shortDescription: "On-chain multiplayer strategy game with dynamic NFT armies",
      projectName: "PixelVerse",
      projectWebsite: "https://pixelverse.gg",
      projectTwitter: "https://twitter.com/pixelversegg",
      category: "GAMING",
      status: "COMPLETED",
      chain: "BASE",
      raiseTokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      raiseTokenSymbol: "USDC",
      distributionTokenSymbol: "PXV",
      tokenPrice: "0.025",
      totalRaise: "1500000",
      softCap: "750000",
      hardCap: "1500000",
      minContribution: "50",
      maxContribution: "25000",
      totalRaised: "1500000",
      contributorCount: 845,
      allocationMethod: "FCFS",
      vestingType: "MONTHLY_CLIFF",
      tgeUnlockPercent: 15,
      vestingCliffDays: 60,
      vestingDurationDays: 540,
      registrationOpenAt: daysAgo(120),
      registrationCloseAt: daysAgo(110),
      contributionOpenAt: daysAgo(108),
      contributionCloseAt: daysAgo(95),
      distributionAt: daysAgo(90),
      vestingStartAt: daysAgo(90),
      minTierRequired: "BRONZE",
      requiresKyc: true,
      isFeatured: false,
      createdById: superAdmin.id,
    },
  });

  // Deal 3: REGISTRATION_OPEN (AI, Arbitrum)
  const deal3 = await prisma.deal.create({
    data: {
      title: "Synthos AI - Strategic Round",
      slug: "synthos-ai-strategic",
      description: "Synthos AI is building a decentralized compute marketplace for AI model training and inference. By leveraging idle GPU capacity from a global network of providers, Synthos offers enterprise-grade AI infrastructure at a fraction of centralized cloud costs. The protocol uses proof-of-compute verification to ensure quality and reliability.",
      shortDescription: "Decentralized AI compute marketplace with proof-of-compute verification",
      projectName: "Synthos AI",
      projectWebsite: "https://synthos.ai",
      projectTwitter: "https://twitter.com/synthosai",
      projectGithub: "https://github.com/synthos-ai",
      category: "AI",
      status: "REGISTRATION_OPEN",
      chain: "ARBITRUM",
      raiseTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      raiseTokenSymbol: "USDC",
      distributionTokenSymbol: "SYN",
      tokenPrice: "0.15",
      totalRaise: "5000000",
      softCap: "2500000",
      hardCap: "5000000",
      minContribution: "250",
      maxContribution: "100000",
      totalRaised: 0,
      contributorCount: 0,
      allocationMethod: "GUARANTEED",
      vestingType: "TGE_PLUS_LINEAR",
      tgeUnlockPercent: 10,
      vestingCliffDays: 90,
      vestingDurationDays: 730,
      registrationOpenAt: daysAgo(3),
      registrationCloseAt: daysFromNow(11),
      contributionOpenAt: daysFromNow(14),
      contributionCloseAt: daysFromNow(28),
      distributionAt: daysFromNow(35),
      vestingStartAt: daysFromNow(35),
      minTierRequired: "SILVER",
      requiresKyc: true,
      requiresAccreditation: false,
      isFeatured: true,
      createdById: platformAdmin.id,
      spvName: "Synthos AI Ventures SPV LLC",
      spvJurisdiction: "Singapore",
      spvEntityId: "SG-2025-SPV-33201",
      platformFeePercent: 2.5,
      feeType: "flat",
      leadCarryPercent: 20,
    },
  });

  // Deal 4: GUARANTEED_ALLOCATION (Infrastructure, Ethereum)
  const deal4 = await prisma.deal.create({
    data: {
      title: "Aether Protocol - Series A",
      slug: "aether-protocol-series-a",
      description: "Aether Protocol is building a cross-chain messaging and interoperability layer that enables seamless communication between EVM and non-EVM chains. Unlike existing bridges, Aether uses a novel zero-knowledge proof system that provides cryptographic guarantees of message validity without relying on external validator sets.",
      shortDescription: "ZK-powered cross-chain messaging and interoperability protocol",
      projectName: "Aether Protocol",
      projectWebsite: "https://aether.network",
      projectTwitter: "https://twitter.com/aetherprotocol",
      projectDiscord: "https://discord.gg/aetherprotocol",
      category: "INFRASTRUCTURE",
      status: "GUARANTEED_ALLOCATION",
      chain: "ETHEREUM",
      raiseTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      raiseTokenSymbol: "USDC",
      distributionTokenSymbol: "AETH",
      tokenPrice: "0.35",
      totalRaise: "8000000",
      softCap: "4000000",
      hardCap: "8000000",
      minContribution: "500",
      maxContribution: "200000",
      totalRaised: "3750000",
      contributorCount: 187,
      allocationMethod: "GUARANTEED",
      vestingType: "LINEAR",
      tgeUnlockPercent: 5,
      vestingCliffDays: 180,
      vestingDurationDays: 1095,
      registrationOpenAt: daysAgo(21),
      registrationCloseAt: daysAgo(7),
      contributionOpenAt: daysAgo(5),
      contributionCloseAt: daysFromNow(9),
      distributionAt: daysFromNow(14),
      vestingStartAt: daysFromNow(14),
      minTierRequired: "GOLD",
      requiresKyc: true,
      requiresAccreditation: true,
      isFeatured: true,
      createdById: superAdmin.id,
      spvName: "Aether Capital SPV I LLC",
      spvJurisdiction: "Cayman Islands",
      spvEntityId: "KY-2025-SPV-00412",
      platformFeePercent: 2.5,
      feeType: "flat",
      leadCarryPercent: 20,
    },
  });

  // Deal 5: FCFS (DeFi, Base)
  const deal5 = await prisma.deal.create({
    data: {
      title: "NeuralSwap - Public Sale",
      slug: "neuralswap-public-sale",
      description: "NeuralSwap is an AI-powered automated market maker (AMM) that dynamically adjusts pool parameters using machine learning to minimize impermanent loss and maximize LP returns. The protocol continuously analyzes market conditions and rebalances pools in real-time, offering significantly better yields for liquidity providers.",
      shortDescription: "AI-powered AMM that minimizes impermanent loss through ML optimization",
      projectName: "NeuralSwap",
      projectWebsite: "https://neuralswap.io",
      projectTwitter: "https://twitter.com/neuralswap",
      category: "DEFI",
      status: "FCFS",
      chain: "BASE",
      raiseTokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      raiseTokenSymbol: "USDC",
      distributionTokenSymbol: "NSWP",
      tokenPrice: "0.04",
      totalRaise: "3000000",
      softCap: "1500000",
      hardCap: "3000000",
      minContribution: "100",
      maxContribution: "50000",
      totalRaised: "2100000",
      contributorCount: 523,
      allocationMethod: "FCFS",
      vestingType: "TGE_PLUS_LINEAR",
      tgeUnlockPercent: 25,
      vestingCliffDays: 0,
      vestingDurationDays: 270,
      registrationOpenAt: daysAgo(14),
      registrationCloseAt: daysAgo(7),
      contributionOpenAt: daysAgo(5),
      contributionCloseAt: daysFromNow(2),
      distributionAt: daysFromNow(7),
      vestingStartAt: daysFromNow(7),
      minTierRequired: "BRONZE",
      requiresKyc: true,
      isFeatured: true,
      createdById: platformAdmin.id,
      spvName: "NeuralSwap Venture SPV LLC",
      spvJurisdiction: "Delaware, US",
      spvEntityId: "DE-2025-SPV-88231",
      platformFeePercent: 2.0,
      feeType: "tiered",
      leadCarryPercent: 15,
    },
  });

  // Deal 6: APPROVED (Gaming, Arbitrum)
  const deal6 = await prisma.deal.create({
    data: {
      title: "Realm Guardians - Pre-Seed",
      slug: "realm-guardians-preseed",
      description: "Realm Guardians is an open-world RPG built on Arbitrum with a fully player-owned economy. Players explore procedurally generated realms, collect rare items, and engage in guild-based PvP combat. The game integrates DeFi mechanics allowing players to earn yield on in-game assets through a staking system.",
      shortDescription: "Open-world RPG with DeFi-integrated player-owned economy",
      projectName: "Realm Guardians",
      projectWebsite: "https://realmguardians.game",
      category: "GAMING",
      status: "APPROVED",
      chain: "ARBITRUM",
      raiseTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      raiseTokenSymbol: "USDC",
      distributionTokenSymbol: "RLM",
      tokenPrice: "0.01",
      totalRaise: "1000000",
      softCap: "500000",
      hardCap: "1000000",
      minContribution: "50",
      maxContribution: "10000",
      totalRaised: 0,
      contributorCount: 0,
      allocationMethod: "LOTTERY",
      vestingType: "MONTHLY_CLIFF",
      tgeUnlockPercent: 10,
      vestingCliffDays: 30,
      vestingDurationDays: 365,
      registrationOpenAt: daysFromNow(14),
      registrationCloseAt: daysFromNow(28),
      contributionOpenAt: daysFromNow(30),
      contributionCloseAt: daysFromNow(44),
      minTierRequired: "BRONZE",
      requiresKyc: true,
      isFeatured: false,
      createdById: platformAdmin.id,
    },
  });

  // Deal 7: DRAFT (Infrastructure, Ethereum)
  const deal7 = await prisma.deal.create({
    data: {
      title: "Helix Data - Private Round",
      slug: "helix-data-private",
      description: "Helix Data is building a decentralized data availability layer optimized for zero-knowledge rollups. By providing cheap, reliable data availability with strong economic security guarantees, Helix enables rollups to reduce transaction costs by up to 90% while maintaining Ethereum-level security.",
      shortDescription: "Decentralized data availability layer for ZK rollups",
      projectName: "Helix Data",
      projectWebsite: "https://helixdata.xyz",
      category: "INFRASTRUCTURE",
      status: "DRAFT",
      chain: "ETHEREUM",
      raiseTokenSymbol: "USDC",
      distributionTokenSymbol: "HLX",
      tokenPrice: "0.50",
      totalRaise: "10000000",
      softCap: "5000000",
      hardCap: "10000000",
      minContribution: "1000",
      maxContribution: "500000",
      totalRaised: 0,
      contributorCount: 0,
      allocationMethod: "GUARANTEED",
      vestingType: "LINEAR",
      tgeUnlockPercent: 0,
      vestingCliffDays: 365,
      vestingDurationDays: 1460,
      requiresKyc: true,
      requiresAccreditation: true,
      isFeatured: false,
      createdById: superAdmin.id,
      spvName: "Helix Data Holdings SPV Ltd",
      spvJurisdiction: "British Virgin Islands",
      spvEntityId: "BVI-2025-SPV-55019",
      platformFeePercent: 3.0,
      feeType: "flat",
      leadCarryPercent: 25,
    },
  });

  // Deal 8: UNDER_REVIEW (AI, Base)
  const deal8 = await prisma.deal.create({
    data: {
      title: "Orbiter Social - Community Round",
      slug: "orbiter-social-community",
      description: "Orbiter Social is a decentralized social graph protocol enabling portable identity and content across Web3 applications. Users own their social connections and content on-chain, allowing seamless migration between platforms without losing followers or engagement history.",
      shortDescription: "Decentralized social graph protocol with portable Web3 identity",
      projectName: "Orbiter Social",
      projectWebsite: "https://orbiter.social",
      projectTwitter: "https://twitter.com/orbitersocial",
      category: "AI",
      status: "UNDER_REVIEW",
      chain: "BASE",
      raiseTokenSymbol: "USDC",
      distributionTokenSymbol: "ORB",
      tokenPrice: "0.02",
      totalRaise: "2500000",
      softCap: "1250000",
      hardCap: "2500000",
      minContribution: "50",
      maxContribution: "25000",
      totalRaised: 0,
      contributorCount: 0,
      allocationMethod: "PRO_RATA",
      vestingType: "TGE_PLUS_LINEAR",
      tgeUnlockPercent: 20,
      vestingCliffDays: 30,
      vestingDurationDays: 365,
      requiresKyc: true,
      isFeatured: false,
      createdById: platformAdmin.id,
    },
  });

  const allDeals = [deal1, deal2, deal3, deal4, deal5, deal6, deal7, deal8];
  console.log(`Created ${allDeals.length} deals`);

  // ===========================================================================
  // DEAL PHASES (3-4 per deal)
  // ===========================================================================

  const dealPhases = [
    // Deal 1 phases
    { dealId: deal1.id, phaseName: "Registration", phaseOrder: 1, startsAt: daysAgo(90), endsAt: daysAgo(80), isActive: false },
    { dealId: deal1.id, phaseName: "Guaranteed Allocation", phaseOrder: 2, startsAt: daysAgo(78), endsAt: daysAgo(72), isActive: false },
    { dealId: deal1.id, phaseName: "FCFS", phaseOrder: 3, startsAt: daysAgo(72), endsAt: daysAgo(65), isActive: false },
    { dealId: deal1.id, phaseName: "Distribution", phaseOrder: 4, startsAt: daysAgo(60), endsAt: daysAgo(59), isActive: false },
    // Deal 2 phases
    { dealId: deal2.id, phaseName: "Registration", phaseOrder: 1, startsAt: daysAgo(120), endsAt: daysAgo(110), isActive: false },
    { dealId: deal2.id, phaseName: "FCFS Sale", phaseOrder: 2, startsAt: daysAgo(108), endsAt: daysAgo(95), isActive: false },
    { dealId: deal2.id, phaseName: "Distribution", phaseOrder: 3, startsAt: daysAgo(90), endsAt: daysAgo(89), isActive: false },
    // Deal 3 phases
    { dealId: deal3.id, phaseName: "Registration", phaseOrder: 1, startsAt: daysAgo(3), endsAt: daysFromNow(11), isActive: true },
    { dealId: deal3.id, phaseName: "Guaranteed Allocation", phaseOrder: 2, startsAt: daysFromNow(14), endsAt: daysFromNow(21), isActive: false },
    { dealId: deal3.id, phaseName: "FCFS", phaseOrder: 3, startsAt: daysFromNow(21), endsAt: daysFromNow(28), isActive: false },
    { dealId: deal3.id, phaseName: "Distribution", phaseOrder: 4, startsAt: daysFromNow(35), endsAt: daysFromNow(36), isActive: false },
    // Deal 4 phases
    { dealId: deal4.id, phaseName: "Registration", phaseOrder: 1, startsAt: daysAgo(21), endsAt: daysAgo(7), isActive: false },
    { dealId: deal4.id, phaseName: "Guaranteed Allocation", phaseOrder: 2, startsAt: daysAgo(5), endsAt: daysFromNow(2), isActive: true },
    { dealId: deal4.id, phaseName: "FCFS", phaseOrder: 3, startsAt: daysFromNow(2), endsAt: daysFromNow(9), isActive: false },
    // Deal 5 phases
    { dealId: deal5.id, phaseName: "Registration", phaseOrder: 1, startsAt: daysAgo(14), endsAt: daysAgo(7), isActive: false },
    { dealId: deal5.id, phaseName: "FCFS Public Sale", phaseOrder: 2, startsAt: daysAgo(5), endsAt: daysFromNow(2), isActive: true },
    { dealId: deal5.id, phaseName: "Distribution", phaseOrder: 3, startsAt: daysFromNow(7), endsAt: daysFromNow(8), isActive: false },
  ];

  for (const phase of dealPhases) {
    await prisma.dealPhase.create({ data: phase });
  }

  console.log(`Created ${dealPhases.length} deal phases`);

  // ===========================================================================
  // CONTRIBUTIONS (25+)
  // ===========================================================================

  // Completed deal 1 contributions
  const contrib1 = await prisma.contribution.create({
    data: {
      userId: investor1.id, dealId: deal1.id,
      amount: "25000", currency: "USDC", amountUsd: "25000",
      txHash: randomTxHash(), chain: "ETHEREUM", status: "CONFIRMED",
      confirmedAt: daysAgo(75), blockNumber: 19500100,
      createdAt: daysAgo(76),
    },
  });

  const contrib2 = await prisma.contribution.create({
    data: {
      userId: investor2.id, dealId: deal1.id,
      amount: "15000", currency: "USDC", amountUsd: "15000",
      txHash: randomTxHash(), chain: "ETHEREUM", status: "CONFIRMED",
      confirmedAt: daysAgo(74), blockNumber: 19500200,
      createdAt: daysAgo(75),
    },
  });

  const contrib3 = await prisma.contribution.create({
    data: {
      userId: investor3.id, dealId: deal1.id,
      amount: "5000", currency: "USDC", amountUsd: "5000",
      txHash: randomTxHash(), chain: "ETHEREUM", status: "CONFIRMED",
      confirmedAt: daysAgo(73), blockNumber: 19500300,
      createdAt: daysAgo(74),
    },
  });

  // Completed deal 2 contributions
  const contrib4 = await prisma.contribution.create({
    data: {
      userId: investor1.id, dealId: deal2.id,
      amount: "10000", currency: "USDC", amountUsd: "10000",
      txHash: randomTxHash(), chain: "BASE", status: "CONFIRMED",
      confirmedAt: daysAgo(105), blockNumber: 12100100,
      createdAt: daysAgo(106),
    },
  });

  const contrib5 = await prisma.contribution.create({
    data: {
      userId: investor3.id, dealId: deal2.id,
      amount: "7000", currency: "USDC", amountUsd: "7000",
      txHash: randomTxHash(), chain: "BASE", status: "CONFIRMED",
      confirmedAt: daysAgo(103), blockNumber: 12100200,
      createdAt: daysAgo(104),
    },
  });

  const contrib6 = await prisma.contribution.create({
    data: {
      userId: investor4.id, dealId: deal2.id,
      amount: "3000", currency: "USDC", amountUsd: "3000",
      txHash: randomTxHash(), chain: "BASE", status: "CONFIRMED",
      confirmedAt: daysAgo(100), blockNumber: 12100300,
      createdAt: daysAgo(101),
    },
  });

  // Active deal 4 contributions (GUARANTEED_ALLOCATION)
  const contrib7 = await prisma.contribution.create({
    data: {
      userId: investor1.id, dealId: deal4.id,
      amount: "50000", currency: "USDC", amountUsd: "50000",
      txHash: randomTxHash(), chain: "ETHEREUM", status: "CONFIRMED",
      confirmedAt: daysAgo(3), blockNumber: 19800100,
      createdAt: daysAgo(4),
    },
  });

  const contrib8 = await prisma.contribution.create({
    data: {
      userId: investor2.id, dealId: deal4.id,
      amount: "30000", currency: "USDC", amountUsd: "30000",
      txHash: randomTxHash(), chain: "ETHEREUM", status: "CONFIRMED",
      confirmedAt: daysAgo(2), blockNumber: 19800200,
      createdAt: daysAgo(3),
    },
  });

  await prisma.contribution.create({
    data: {
      userId: investor3.id, dealId: deal4.id,
      amount: "10000", currency: "USDC", amountUsd: "10000",
      txHash: randomTxHash(), chain: "ETHEREUM", status: "CONFIRMED",
      confirmedAt: daysAgo(1), blockNumber: 19800300,
      createdAt: daysAgo(2),
    },
  });

  await prisma.contribution.create({
    data: {
      userId: investor4.id, dealId: deal4.id,
      amount: "5000", currency: "USDC", amountUsd: "5000",
      txHash: randomTxHash(), chain: "ETHEREUM", status: "PENDING",
      createdAt: hoursAgo(6),
    },
  });

  // Active deal 5 contributions (FCFS)
  await prisma.contribution.create({
    data: {
      userId: investor1.id, dealId: deal5.id,
      amount: "20000", currency: "USDC", amountUsd: "20000",
      txHash: randomTxHash(), chain: "BASE", status: "CONFIRMED",
      confirmedAt: daysAgo(3), blockNumber: 12500100,
      createdAt: daysAgo(4),
    },
  });

  await prisma.contribution.create({
    data: {
      userId: investor2.id, dealId: deal5.id,
      amount: "15000", currency: "USDC", amountUsd: "15000",
      txHash: randomTxHash(), chain: "BASE", status: "CONFIRMED",
      confirmedAt: daysAgo(2), blockNumber: 12500200,
      createdAt: daysAgo(3),
    },
  });

  await prisma.contribution.create({
    data: {
      userId: investor3.id, dealId: deal5.id,
      amount: "8000", currency: "USDC", amountUsd: "8000",
      txHash: randomTxHash(), chain: "BASE", status: "CONFIRMED",
      confirmedAt: daysAgo(2), blockNumber: 12500250,
      createdAt: daysAgo(3),
    },
  });

  await prisma.contribution.create({
    data: {
      userId: investor4.id, dealId: deal5.id,
      amount: "5000", currency: "USDC", amountUsd: "5000",
      txHash: randomTxHash(), chain: "BASE", status: "CONFIRMED",
      confirmedAt: daysAgo(1), blockNumber: 12500300,
      createdAt: daysAgo(2),
    },
  });

  await prisma.contribution.create({
    data: {
      userId: investor5.id, dealId: deal5.id,
      amount: "2000", currency: "USDC", amountUsd: "2000",
      txHash: randomTxHash(), chain: "BASE", status: "CONFIRMED",
      confirmedAt: hoursAgo(18), blockNumber: 12500400,
      createdAt: daysAgo(1),
    },
  });

  await prisma.contribution.create({
    data: {
      userId: investor5.id, dealId: deal5.id,
      amount: "3000", currency: "USDC", amountUsd: "3000",
      txHash: randomTxHash(), chain: "BASE", status: "PENDING",
      createdAt: hoursAgo(4),
    },
  });

  // A few more scattered contributions for volume
  await prisma.contribution.create({
    data: {
      userId: investor2.id, dealId: deal1.id,
      amount: "10000", currency: "USDC", amountUsd: "10000",
      txHash: randomTxHash(), chain: "ETHEREUM", status: "CONFIRMED",
      confirmedAt: daysAgo(70), blockNumber: 19500400,
      createdAt: daysAgo(71),
    },
  });

  await prisma.contribution.create({
    data: {
      userId: investor5.id, dealId: deal1.id,
      amount: "2000", currency: "USDC", amountUsd: "2000",
      txHash: randomTxHash(), chain: "ETHEREUM", status: "CONFIRMED",
      confirmedAt: daysAgo(68), blockNumber: 19500500,
      createdAt: daysAgo(69),
    },
  });

  await prisma.contribution.create({
    data: {
      userId: investor4.id, dealId: deal1.id,
      amount: "7000", currency: "USDC", amountUsd: "7000",
      txHash: randomTxHash(), chain: "ETHEREUM", status: "CONFIRMED",
      confirmedAt: daysAgo(67), blockNumber: 19500600,
      createdAt: daysAgo(68),
    },
  });

  // A failed contribution
  await prisma.contribution.create({
    data: {
      userId: investor6.id, dealId: deal5.id,
      amount: "500", currency: "USDC", amountUsd: "500",
      txHash: randomTxHash(), chain: "BASE", status: "FAILED",
      createdAt: daysAgo(1),
    },
  });

  // A refunded contribution
  await prisma.contribution.create({
    data: {
      userId: investor4.id, dealId: deal2.id,
      amount: "1000", currency: "USDC", amountUsd: "1000",
      txHash: randomTxHash(), chain: "BASE", status: "REFUNDED",
      refundAmount: "1000",
      refundTxHash: randomTxHash(),
      refundedAt: daysAgo(92),
      confirmedAt: daysAgo(98), blockNumber: 12100350,
      createdAt: daysAgo(99),
    },
  });

  console.log("Created 21 contributions");

  // ===========================================================================
  // ALLOCATIONS (15+)
  // ===========================================================================

  const allocations = [
    // Deal 1 allocations
    { userId: investor1.id, dealId: deal1.id, guaranteedAmount: "30000", requestedAmount: "30000", finalAmount: "25000", allocationMethod: "GUARANTEED" as const, isFinalized: true, finalizedAt: daysAgo(78) },
    { userId: investor2.id, dealId: deal1.id, guaranteedAmount: "20000", requestedAmount: "20000", finalAmount: "15000", allocationMethod: "GUARANTEED" as const, isFinalized: true, finalizedAt: daysAgo(78) },
    { userId: investor3.id, dealId: deal1.id, guaranteedAmount: "10000", requestedAmount: "10000", finalAmount: "5000", allocationMethod: "PRO_RATA" as const, isFinalized: true, finalizedAt: daysAgo(78) },
    { userId: investor4.id, dealId: deal1.id, guaranteedAmount: "0", requestedAmount: "10000", finalAmount: "7000", allocationMethod: "FCFS" as const, isFinalized: true, finalizedAt: daysAgo(66) },
    { userId: investor5.id, dealId: deal1.id, guaranteedAmount: "0", requestedAmount: "5000", finalAmount: "2000", allocationMethod: "FCFS" as const, isFinalized: true, finalizedAt: daysAgo(66) },
    // Deal 2 allocations
    { userId: investor1.id, dealId: deal2.id, guaranteedAmount: "0", requestedAmount: "15000", finalAmount: "10000", allocationMethod: "FCFS" as const, isFinalized: true, finalizedAt: daysAgo(108) },
    { userId: investor3.id, dealId: deal2.id, guaranteedAmount: "0", requestedAmount: "10000", finalAmount: "7000", allocationMethod: "FCFS" as const, isFinalized: true, finalizedAt: daysAgo(108) },
    { userId: investor4.id, dealId: deal2.id, guaranteedAmount: "0", requestedAmount: "5000", finalAmount: "3000", allocationMethod: "FCFS" as const, isFinalized: true, finalizedAt: daysAgo(108) },
    // Deal 4 allocations (active)
    { userId: investor1.id, dealId: deal4.id, guaranteedAmount: "75000", requestedAmount: "75000", finalAmount: "50000", allocationMethod: "GUARANTEED" as const, isFinalized: false },
    { userId: investor2.id, dealId: deal4.id, guaranteedAmount: "50000", requestedAmount: "50000", finalAmount: "30000", allocationMethod: "GUARANTEED" as const, isFinalized: false },
    { userId: investor3.id, dealId: deal4.id, guaranteedAmount: "15000", requestedAmount: "15000", finalAmount: "10000", allocationMethod: "GUARANTEED" as const, isFinalized: false },
    { userId: investor4.id, dealId: deal4.id, guaranteedAmount: "5000", requestedAmount: "10000", finalAmount: "0", allocationMethod: "GUARANTEED" as const, isFinalized: false },
    // Deal 5 allocations (FCFS)
    { userId: investor1.id, dealId: deal5.id, guaranteedAmount: "0", requestedAmount: "25000", finalAmount: "20000", allocationMethod: "FCFS" as const, isFinalized: false },
    { userId: investor2.id, dealId: deal5.id, guaranteedAmount: "0", requestedAmount: "20000", finalAmount: "15000", allocationMethod: "FCFS" as const, isFinalized: false },
    { userId: investor3.id, dealId: deal5.id, guaranteedAmount: "0", requestedAmount: "10000", finalAmount: "8000", allocationMethod: "FCFS" as const, isFinalized: false },
    { userId: investor4.id, dealId: deal5.id, guaranteedAmount: "0", requestedAmount: "5000", finalAmount: "5000", allocationMethod: "FCFS" as const, isFinalized: false },
    { userId: investor5.id, dealId: deal5.id, guaranteedAmount: "0", requestedAmount: "5000", finalAmount: "2000", allocationMethod: "FCFS" as const, isFinalized: false },
  ];

  for (const alloc of allocations) {
    await prisma.allocation.create({ data: alloc });
  }

  console.log(`Created ${allocations.length} allocations`);

  // ===========================================================================
  // VESTING SCHEDULES (10+) — for completed deals
  // ===========================================================================

  // Deal 1 vesting schedules
  const vesting1 = await prisma.vestingSchedule.create({
    data: {
      dealId: deal1.id, userId: investor1.id,
      totalAmount: "312500", // 25000 / 0.08 price
      claimedAmount: "93750", // TGE (20%) + some linear
      tgeAmount: "62500",
      vestingStart: daysAgo(60), cliffEnd: daysAgo(30), vestingEnd: daysFromNow(305),
      lastClaimAt: daysAgo(5),
      nextUnlockAt: daysFromNow(25),
    },
  });

  const vesting2 = await prisma.vestingSchedule.create({
    data: {
      dealId: deal1.id, userId: investor2.id,
      totalAmount: "187500",
      claimedAmount: "37500",
      tgeAmount: "37500",
      vestingStart: daysAgo(60), cliffEnd: daysAgo(30), vestingEnd: daysFromNow(305),
      lastClaimAt: daysAgo(58),
      nextUnlockAt: daysFromNow(25),
    },
  });

  const vesting3 = await prisma.vestingSchedule.create({
    data: {
      dealId: deal1.id, userId: investor3.id,
      totalAmount: "62500",
      claimedAmount: "12500",
      tgeAmount: "12500",
      vestingStart: daysAgo(60), cliffEnd: daysAgo(30), vestingEnd: daysFromNow(305),
      lastClaimAt: daysAgo(58),
      nextUnlockAt: daysFromNow(25),
    },
  });

  // Deal 2 vesting schedules
  const vesting4 = await prisma.vestingSchedule.create({
    data: {
      dealId: deal2.id, userId: investor1.id,
      totalAmount: "400000", // 10000 / 0.025 price
      claimedAmount: "100000",
      tgeAmount: "60000",
      vestingStart: daysAgo(90), cliffEnd: daysAgo(30), vestingEnd: daysFromNow(450),
      lastClaimAt: daysAgo(10),
      nextUnlockAt: daysFromNow(20),
    },
  });

  const vesting5 = await prisma.vestingSchedule.create({
    data: {
      dealId: deal2.id, userId: investor3.id,
      totalAmount: "280000",
      claimedAmount: "42000",
      tgeAmount: "42000",
      vestingStart: daysAgo(90), cliffEnd: daysAgo(30), vestingEnd: daysFromNow(450),
      lastClaimAt: daysAgo(88),
      nextUnlockAt: daysFromNow(20),
    },
  });

  const vesting6 = await prisma.vestingSchedule.create({
    data: {
      dealId: deal2.id, userId: investor4.id,
      totalAmount: "120000",
      claimedAmount: "18000",
      tgeAmount: "18000",
      vestingStart: daysAgo(90), cliffEnd: daysAgo(30), vestingEnd: daysFromNow(450),
      lastClaimAt: daysAgo(88),
      nextUnlockAt: daysFromNow(20),
    },
  });

  // Additional vesting for deal 1 users with later entries
  await prisma.vestingSchedule.create({
    data: {
      dealId: deal1.id, userId: investor4.id,
      totalAmount: "87500",
      claimedAmount: "17500",
      tgeAmount: "17500",
      vestingStart: daysAgo(60), cliffEnd: daysAgo(30), vestingEnd: daysFromNow(305),
      lastClaimAt: daysAgo(58),
      nextUnlockAt: daysFromNow(25),
    },
  });

  await prisma.vestingSchedule.create({
    data: {
      dealId: deal1.id, userId: investor5.id,
      totalAmount: "25000",
      claimedAmount: "5000",
      tgeAmount: "5000",
      vestingStart: daysAgo(60), cliffEnd: daysAgo(30), vestingEnd: daysFromNow(305),
      lastClaimAt: daysAgo(58),
      nextUnlockAt: daysFromNow(25),
    },
  });

  console.log("Created 8 vesting schedules");

  // ===========================================================================
  // CLAIM RECORDS (8+)
  // ===========================================================================

  // TGE claims
  await prisma.claimRecord.create({
    data: {
      vestingScheduleId: vesting1.id, userId: investor1.id, dealId: deal1.id,
      amount: "62500", txHash: randomTxHash(), chain: "ETHEREUM",
      claimedAt: daysAgo(58),
    },
  });

  await prisma.claimRecord.create({
    data: {
      vestingScheduleId: vesting1.id, userId: investor1.id, dealId: deal1.id,
      amount: "31250", txHash: randomTxHash(), chain: "ETHEREUM",
      claimedAt: daysAgo(5),
    },
  });

  await prisma.claimRecord.create({
    data: {
      vestingScheduleId: vesting2.id, userId: investor2.id, dealId: deal1.id,
      amount: "37500", txHash: randomTxHash(), chain: "ETHEREUM",
      claimedAt: daysAgo(58),
    },
  });

  await prisma.claimRecord.create({
    data: {
      vestingScheduleId: vesting3.id, userId: investor3.id, dealId: deal1.id,
      amount: "12500", txHash: randomTxHash(), chain: "ETHEREUM",
      claimedAt: daysAgo(58),
    },
  });

  await prisma.claimRecord.create({
    data: {
      vestingScheduleId: vesting4.id, userId: investor1.id, dealId: deal2.id,
      amount: "60000", txHash: randomTxHash(), chain: "BASE",
      claimedAt: daysAgo(88),
    },
  });

  await prisma.claimRecord.create({
    data: {
      vestingScheduleId: vesting4.id, userId: investor1.id, dealId: deal2.id,
      amount: "40000", txHash: randomTxHash(), chain: "BASE",
      claimedAt: daysAgo(10),
    },
  });

  await prisma.claimRecord.create({
    data: {
      vestingScheduleId: vesting5.id, userId: investor3.id, dealId: deal2.id,
      amount: "42000", txHash: randomTxHash(), chain: "BASE",
      claimedAt: daysAgo(88),
    },
  });

  await prisma.claimRecord.create({
    data: {
      vestingScheduleId: vesting6.id, userId: investor4.id, dealId: deal2.id,
      amount: "18000", txHash: randomTxHash(), chain: "BASE",
      claimedAt: daysAgo(88),
    },
  });

  console.log("Created 8 claim records");

  // ===========================================================================
  // STAKING POSITIONS (6+)
  // ===========================================================================

  const staking1 = await prisma.stakingPosition.create({
    data: {
      userId: investor1.id, amount: "50000",
      lockPeriod: "THREE_SIXTY_FIVE_DAYS",
      lockStartAt: daysAgo(120), lockEndAt: daysFromNow(245),
      isActive: true, txHash: randomTxHash(), chain: "ETHEREUM",
    },
  });

  const staking2 = await prisma.stakingPosition.create({
    data: {
      userId: investor2.id, amount: "25000",
      lockPeriod: "ONE_EIGHTY_DAYS",
      lockStartAt: daysAgo(60), lockEndAt: daysFromNow(120),
      isActive: true, txHash: randomTxHash(), chain: "ETHEREUM",
    },
  });

  const staking3 = await prisma.stakingPosition.create({
    data: {
      userId: investor3.id, amount: "10000",
      lockPeriod: "NINETY_DAYS",
      lockStartAt: daysAgo(45), lockEndAt: daysFromNow(45),
      isActive: true, txHash: randomTxHash(), chain: "ARBITRUM",
    },
  });

  await prisma.stakingPosition.create({
    data: {
      userId: investor4.id, amount: "7500",
      lockPeriod: "THIRTY_DAYS",
      lockStartAt: daysAgo(15), lockEndAt: daysFromNow(15),
      isActive: true, txHash: randomTxHash(), chain: "ETHEREUM",
    },
  });

  await prisma.stakingPosition.create({
    data: {
      userId: investor5.id, amount: "3000",
      lockPeriod: "THIRTY_DAYS",
      lockStartAt: daysAgo(20), lockEndAt: daysFromNow(10),
      isActive: true, txHash: randomTxHash(), chain: "BASE",
    },
  });

  // An expired/inactive staking position
  await prisma.stakingPosition.create({
    data: {
      userId: investor1.id, amount: "20000",
      lockPeriod: "NINETY_DAYS",
      lockStartAt: daysAgo(150), lockEndAt: daysAgo(60),
      isActive: false, txHash: randomTxHash(), chain: "ETHEREUM",
      unstakeRequestedAt: daysAgo(60),
    },
  });

  console.log("Created 6 staking positions");

  // ===========================================================================
  // STAKING REWARDS
  // ===========================================================================

  await prisma.stakingReward.create({
    data: {
      userId: investor1.id, stakingPositionId: staking1.id,
      amount: "2500", rewardType: "STAKING_YIELD",
      txHash: randomTxHash(), claimedAt: daysAgo(30),
    },
  });

  await prisma.stakingReward.create({
    data: {
      userId: investor2.id, stakingPositionId: staking2.id,
      amount: "750", rewardType: "STAKING_YIELD",
      txHash: randomTxHash(), claimedAt: daysAgo(15),
    },
  });

  await prisma.stakingReward.create({
    data: {
      userId: investor3.id, stakingPositionId: staking3.id,
      amount: "300", rewardType: "STAKING_YIELD",
    },
  });

  console.log("Created 3 staking rewards");

  // ===========================================================================
  // NOTIFICATIONS (20+)
  // ===========================================================================

  const notificationTemplates = [
    { userId: investor1.id, type: "DEAL_ALERT" as const, title: "Contribution Confirmed", message: "Your contribution of $25,000 to Meridian Finance has been confirmed.", isRead: true, readAt: daysAgo(74), createdAt: daysAgo(75) },
    { userId: investor1.id, type: "VESTING" as const, title: "Tokens Available to Claim", message: "31,250 MRD tokens are now available to claim from Meridian Finance.", isRead: true, readAt: daysAgo(4), createdAt: daysAgo(5) },
    { userId: investor1.id, type: "DEAL_ALERT" as const, title: "New Deal: Synthos AI", message: "Synthos AI Strategic Round is now open for registration. You are eligible based on your tier.", isRead: false, createdAt: daysAgo(3) },
    { userId: investor1.id, type: "DEAL_ALERT" as const, title: "Contribution Confirmed", message: "Your contribution of $50,000 to Aether Protocol has been confirmed.", isRead: true, readAt: daysAgo(2), createdAt: daysAgo(3) },
    { userId: investor2.id, type: "DEAL_ALERT" as const, title: "Contribution Confirmed", message: "Your contribution of $15,000 to Meridian Finance has been confirmed.", isRead: true, readAt: daysAgo(73), createdAt: daysAgo(74) },
    { userId: investor2.id, type: "DEAL_ALERT" as const, title: "Contribution Confirmed", message: "Your contribution of $30,000 to Aether Protocol has been confirmed.", isRead: true, readAt: daysAgo(1), createdAt: daysAgo(2) },
    { userId: investor2.id, type: "DEAL_ALERT" as const, title: "NeuralSwap FCFS Open", message: "NeuralSwap Public Sale is now in FCFS phase. Contribute before it fills up!", isRead: false, createdAt: daysAgo(5) },
    { userId: investor3.id, type: "DEAL_ALERT" as const, title: "Contribution Confirmed", message: "Your contribution of $5,000 to Meridian Finance has been confirmed.", isRead: true, readAt: daysAgo(72), createdAt: daysAgo(73) },
    { userId: investor3.id, type: "VESTING" as const, title: "Vesting Schedule Created", message: "Your vesting schedule for PixelVerse has been created. TGE tokens will be available soon.", isRead: true, readAt: daysAgo(88), createdAt: daysAgo(89) },
    { userId: investor3.id, type: "DEAL_ALERT" as const, title: "New Deal Available", message: "Aether Protocol Series A is now open for registration.", isRead: false, createdAt: daysAgo(21) },
    { userId: investor4.id, type: "DEAL_ALERT" as const, title: "Contribution Confirmed", message: "Your contribution of $3,000 to PixelVerse has been confirmed.", isRead: true, readAt: daysAgo(99), createdAt: daysAgo(100) },
    { userId: investor4.id, type: "ACCOUNT" as const, title: "KYC Approved", message: "Your KYC verification has been approved. You can now participate in deals.", isRead: true, readAt: daysAgo(29), createdAt: daysAgo(30) },
    { userId: investor5.id, type: "DEAL_ALERT" as const, title: "Contribution Confirmed", message: "Your contribution of $2,000 to NeuralSwap has been confirmed.", isRead: false, createdAt: hoursAgo(17) },
    { userId: investor5.id, type: "ACCOUNT" as const, title: "Tier Upgraded", message: "Congratulations! You have been upgraded to BRONZE tier based on your staking activity.", isRead: true, readAt: daysAgo(18), createdAt: daysAgo(19) },
    { userId: investor6.id, type: "ACCOUNT" as const, title: "KYC Submission Received", message: "Your KYC documents have been received and are being reviewed. This typically takes 1-3 business days.", isRead: true, readAt: daysAgo(0), createdAt: daysAgo(1) },
    { userId: investor6.id, type: "DEAL_ALERT" as const, title: "Contribution Failed", message: "Your contribution to NeuralSwap has failed. Please check your wallet and try again.", isRead: false, createdAt: daysAgo(1) },
    { userId: investor7.id, type: "ACCOUNT" as const, title: "Welcome to Exposure", message: "Welcome! Complete your KYC verification to participate in exclusive deals.", isRead: false, createdAt: daysAgo(7) },
    { userId: investor7.id, type: "MARKETING" as const, title: "Stake EXPO for Tier Benefits", message: "Stake EXPO tokens to unlock higher allocation tiers and access exclusive deals.", isRead: false, createdAt: daysAgo(5) },
    { userId: platformAdmin.id, type: "COMPLIANCE" as const, title: "New Compliance Flag", message: "A new HIGH severity compliance flag has been created for wallet 0xa0Ee...9720.", isRead: true, readAt: daysAgo(3), createdAt: daysAgo(4) },
    { userId: complianceOfficer.id, type: "COMPLIANCE" as const, title: "Flag Requires Review", message: "SANCTIONS_MATCH flag on user 0x23618e...1E8f requires immediate review.", isRead: false, createdAt: daysAgo(2) },
    { userId: superAdmin.id, type: "ACCOUNT" as const, title: "System Health Alert", message: "All systems operational. Monthly uptime: 99.98%.", isRead: true, readAt: daysAgo(1), createdAt: daysAgo(2) },
  ];

  for (const n of notificationTemplates) {
    await prisma.notification.create({ data: n });
  }

  console.log(`Created ${notificationTemplates.length} notifications`);

  // ===========================================================================
  // COMPLIANCE FLAGS (5)
  // ===========================================================================

  const flag1 = await prisma.complianceFlag.create({
    data: {
      userId: investor7.id,
      reason: "SANCTIONS_MATCH",
      severity: "HIGH",
      description: "Wallet address 0xa0Ee...9720 flagged by Chainalysis for potential interaction with OFAC-sanctioned address. Automatic screening during registration.",
      isResolved: false,
      createdAt: daysAgo(4),
    },
  });

  const flag2 = await prisma.complianceFlag.create({
    data: {
      userId: investor3.id,
      dealId: deal4.id,
      reason: "RAPID_ACTIVITY",
      severity: "MEDIUM",
      description: "Multiple contributions from different wallets linked to the same user within 5 minutes on Aether Protocol deal. Possible sybil behavior.",
      isResolved: false,
      createdAt: daysAgo(2),
    },
  });

  await prisma.complianceFlag.create({
    data: {
      userId: investor6.id,
      reason: "NEW_WALLET",
      severity: "LOW",
      description: "New wallet with no prior on-chain history attempting KYC verification. Standard review required for newly created wallets.",
      isResolved: false,
      createdAt: daysAgo(1),
    },
  });

  await prisma.complianceFlag.create({
    data: {
      userId: investor1.id,
      dealId: deal4.id,
      contributionId: contrib7.id,
      reason: "LARGE_CONTRIBUTION",
      severity: "LOW",
      description: "Single contribution of $50,000 to Aether Protocol. Automatically flagged for AML review per compliance policy for transactions above $25,000.",
      isResolved: true,
      resolution: "KYC verified at accredited level. Source of funds documentation provided and validated through third-party verification. Contribution approved.",
      resolvedById: complianceOfficer.id,
      resolvedAt: daysAgo(2),
      createdAt: daysAgo(3),
    },
  });

  await prisma.complianceFlag.create({
    data: {
      userId: investor2.id,
      reason: "CUMULATIVE_THRESHOLD",
      severity: "MEDIUM",
      description: "Cumulative contributions across all deals have exceeded $100,000 threshold. Enhanced due diligence required per platform compliance policy.",
      isResolved: true,
      resolution: "Enhanced due diligence completed. User verified as accredited investor. All documentation in order. Cleared for continued participation.",
      resolvedById: complianceOfficer.id,
      resolvedAt: daysAgo(15),
      createdAt: daysAgo(20),
    },
  });

  console.log("Created 5 compliance flags");

  // ===========================================================================
  // PROJECT APPLICATIONS (4)
  // ===========================================================================

  await prisma.projectApplication.create({
    data: {
      projectName: "NeuralSwap Protocol",
      projectWebsite: "https://neuralswap.io",
      contactEmail: "sarah@neuralswap.io",
      contactTelegram: "@sarahkim_ns",
      applicantWallet: randomAddress(),
      status: "APPROVED",
      category: "DEFI",
      description: "AI-powered AMM that dynamically adjusts pool parameters using machine learning to minimize impermanent loss and maximize LP returns. Our proprietary ML models analyze on-chain and off-chain data to optimize pool rebalancing in real-time.",
      targetRaise: "3000000",
      valuation: "30000000",
      tokenName: "NeuralSwap Token",
      tokenTicker: "NSWP",
      tokenSupply: "100000000",
      chain: "BASE",
      teamInfo: { members: [{ name: "Sarah Kim", role: "CEO", linkedin: "https://linkedin.com/in/sarahkim" }, { name: "James Park", role: "CTO", linkedin: "https://linkedin.com/in/jamespark" }], size: 12, background: "Ex-Google, Ex-Meta ML engineers" },
      tokenomics: { publicSale: "15%", team: "20%", treasury: "25%", ecosystem: "30%", advisors: "10%" },
      pitchDeckUrl: "https://storage.exposure.fi/applications/neuralswap-deck.pdf",
      internalScore: 88,
      internalNotes: "Strong team with ML backgrounds from Google and Meta. Product demo was impressive. Audit in progress with Certora.",
      reviewedById: platformAdmin.id,
      reviewedAt: daysAgo(20),
      convertedToDealId: deal5.id,
      createdAt: daysAgo(35),
    },
  });

  await prisma.projectApplication.create({
    data: {
      projectName: "ChainGuard Insurance",
      projectWebsite: "https://chainguard.xyz",
      contactEmail: "michael@chainguard.xyz",
      contactTelegram: "@mtorres_cg",
      applicantWallet: randomAddress(),
      status: "UNDER_REVIEW",
      category: "DEFI",
      description: "Decentralized insurance protocol for smart contract exploits. Parametric policies with instant payouts triggered by on-chain events. Built on Ethereum with coverage pools backed by diversified DeFi yields.",
      targetRaise: "6000000",
      valuation: "60000000",
      tokenName: "ChainGuard Token",
      tokenTicker: "GUARD",
      tokenSupply: "500000000",
      chain: "ETHEREUM",
      teamInfo: { members: [{ name: "Michael Torres", role: "Founder", linkedin: "https://linkedin.com/in/mtorres" }], size: 8, background: "Ex-Nexus Mutual, Ex-OpenZeppelin" },
      tokenomics: { publicSale: "12%", team: "18%", treasury: "30%", ecosystem: "25%", advisors: "15%" },
      pitchDeckUrl: "https://storage.exposure.fi/applications/chainguard-deck.pdf",
      internalScore: 75,
      internalNotes: "Solid concept with experienced team. Needs further due diligence on actuarial models.",
      createdAt: daysAgo(10),
    },
  });

  await prisma.projectApplication.create({
    data: {
      projectName: "Orbiter Social Protocol",
      projectWebsite: "https://orbiter.social",
      contactEmail: "lisa@orbiter.social",
      contactTelegram: "@lisawang_orb",
      applicantWallet: randomAddress(),
      status: "DUE_DILIGENCE",
      category: "SOCIAL",
      description: "Decentralized social graph protocol enabling portable identity and content across Web3 applications. Users own their social connections and can seamlessly migrate between platforms.",
      targetRaise: "2500000",
      valuation: "25000000",
      tokenName: "Orbiter Token",
      tokenTicker: "ORB",
      tokenSupply: "1000000000",
      chain: "BASE",
      teamInfo: { members: [{ name: "Lisa Wang", role: "CEO", linkedin: "https://linkedin.com/in/lisawang" }], size: 15, background: "Ex-Meta social graph engineers" },
      tokenomics: { publicSale: "20%", team: "15%", treasury: "25%", ecosystem: "30%", advisors: "10%" },
      internalScore: 91,
      internalNotes: "Exceptional team. Strong testnet traction with 50K+ profiles. Moving to due diligence phase.",
      reviewedById: platformAdmin.id,
      reviewedAt: daysAgo(5),
      createdAt: daysAgo(25),
    },
  });

  await prisma.projectApplication.create({
    data: {
      projectName: "MegaYield Farm",
      projectWebsite: "https://megayield.farm",
      contactEmail: "john@megayield.farm",
      contactTelegram: "@johndoe_my",
      applicantWallet: randomAddress(),
      status: "REJECTED",
      category: "DEFI",
      description: "High-yield farming aggregator promising 500% APY through proprietary trading strategies and advanced yield optimization algorithms across multiple DeFi protocols.",
      targetRaise: "10000000",
      valuation: "100000000",
      tokenName: "MegaYield Token",
      tokenTicker: "MEGA",
      tokenSupply: "10000000000",
      chain: "ETHEREUM",
      teamInfo: { members: [{ name: "John Doe", role: "Founder" }], size: 3, background: "Anonymous team" },
      tokenomics: { publicSale: "5%", team: "40%", treasury: "30%", ecosystem: "20%", advisors: "5%" },
      internalScore: 15,
      internalNotes: "Unsustainable yield claims. Anonymous team. No audit. Potential Ponzi risk. Rejected unanimously.",
      rejectionReason: "Application does not meet our quality standards. Unsustainable yield projections and insufficient team transparency.",
      reviewedById: platformAdmin.id,
      reviewedAt: daysAgo(28),
      createdAt: daysAgo(30),
    },
  });

  console.log("Created 4 project applications");

  // ===========================================================================
  // AUDIT LOGS (12+)
  // ===========================================================================

  const auditLogs = [
    { userId: superAdmin.id, action: "USER_CREATED", resourceType: "User", resourceId: superAdmin.id, metadata: { role: "SUPER_ADMIN" }, createdAt: daysAgo(180) },
    { userId: platformAdmin.id, action: "DEAL_CREATED", resourceType: "Deal", resourceId: deal1.id, metadata: { title: "Meridian Finance - Seed Round" }, createdAt: daysAgo(95) },
    { userId: platformAdmin.id, action: "DEAL_STATUS_CHANGED", resourceType: "Deal", resourceId: deal1.id, metadata: { from: "DRAFT", to: "APPROVED" }, createdAt: daysAgo(92) },
    { userId: platformAdmin.id, action: "DEAL_STATUS_CHANGED", resourceType: "Deal", resourceId: deal1.id, metadata: { from: "APPROVED", to: "REGISTRATION_OPEN" }, createdAt: daysAgo(90) },
    { userId: superAdmin.id, action: "DEAL_CREATED", resourceType: "Deal", resourceId: deal4.id, metadata: { title: "Aether Protocol - Series A" }, createdAt: daysAgo(30) },
    { userId: platformAdmin.id, action: "APPLICATION_REVIEWED", resourceType: "ProjectApplication", metadata: { projectName: "NeuralSwap Protocol", status: "APPROVED" }, createdAt: daysAgo(20) },
    { userId: complianceOfficer.id, action: "COMPLIANCE_FLAG_CREATED", resourceType: "ComplianceFlag", resourceId: flag1.id, metadata: { reason: "SANCTIONS_MATCH", severity: "HIGH" }, createdAt: daysAgo(4) },
    { userId: complianceOfficer.id, action: "COMPLIANCE_FLAG_RESOLVED", resourceType: "ComplianceFlag", metadata: { reason: "LARGE_CONTRIBUTION", resolution: "Cleared" }, createdAt: daysAgo(2) },
    { userId: platformAdmin.id, action: "DEAL_STATUS_CHANGED", resourceType: "Deal", resourceId: deal3.id, metadata: { from: "APPROVED", to: "REGISTRATION_OPEN" }, createdAt: daysAgo(3) },
    { userId: platformAdmin.id, action: "DEAL_STATUS_CHANGED", resourceType: "Deal", resourceId: deal5.id, metadata: { from: "GUARANTEED_ALLOCATION", to: "FCFS" }, createdAt: daysAgo(5) },
    { userId: complianceOfficer.id, action: "COMPLIANCE_FLAG_CREATED", resourceType: "ComplianceFlag", resourceId: flag2.id, metadata: { reason: "RAPID_ACTIVITY", severity: "MEDIUM" }, createdAt: daysAgo(2) },
    { userId: platformAdmin.id, action: "APPLICATION_REJECTED", resourceType: "ProjectApplication", metadata: { projectName: "MegaYield Farm", reason: "Quality standards" }, createdAt: daysAgo(28) },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }

  console.log(`Created ${auditLogs.length} audit logs`);

  // ===========================================================================
  // TRANSACTIONS (8+)
  // ===========================================================================

  const transactions = [
    { userId: investor1.id, type: "CONTRIBUTION" as const, txHash: randomTxHash(), chain: "ETHEREUM" as const, fromAddress: investor1.walletAddress, toAddress: "0xContractAddr1111111111111111111111111111", amount: "25000", currency: "USDC", amountUsd: "25000", blockNumber: 19500100, status: "CONFIRMED", createdAt: daysAgo(76) },
    { userId: investor1.id, type: "CONTRIBUTION" as const, txHash: randomTxHash(), chain: "ETHEREUM" as const, fromAddress: investor1.walletAddress, toAddress: "0xContractAddr2222222222222222222222222222", amount: "50000", currency: "USDC", amountUsd: "50000", blockNumber: 19800100, status: "CONFIRMED", createdAt: daysAgo(4) },
    { userId: investor2.id, type: "CONTRIBUTION" as const, txHash: randomTxHash(), chain: "ETHEREUM" as const, fromAddress: investor2.walletAddress, toAddress: "0xContractAddr2222222222222222222222222222", amount: "30000", currency: "USDC", amountUsd: "30000", blockNumber: 19800200, status: "CONFIRMED", createdAt: daysAgo(3) },
    { userId: investor1.id, type: "CLAIM" as const, txHash: randomTxHash(), chain: "ETHEREUM" as const, fromAddress: "0xVestingContract111111111111111111111111", toAddress: investor1.walletAddress, amount: "62500", currency: "MRD", status: "CONFIRMED", createdAt: daysAgo(58) },
    { userId: investor1.id, type: "CLAIM" as const, txHash: randomTxHash(), chain: "BASE" as const, fromAddress: "0xVestingContract222222222222222222222222", toAddress: investor1.walletAddress, amount: "60000", currency: "PXV", status: "CONFIRMED", createdAt: daysAgo(88) },
    { userId: investor1.id, type: "STAKE" as const, txHash: randomTxHash(), chain: "ETHEREUM" as const, fromAddress: investor1.walletAddress, toAddress: "0xStakingContract1111111111111111111111", amount: "50000", currency: "EXPO", status: "CONFIRMED", createdAt: daysAgo(120) },
    { userId: investor2.id, type: "STAKE" as const, txHash: randomTxHash(), chain: "ETHEREUM" as const, fromAddress: investor2.walletAddress, toAddress: "0xStakingContract1111111111111111111111", amount: "25000", currency: "EXPO", status: "CONFIRMED", createdAt: daysAgo(60) },
    { userId: investor1.id, type: "UNSTAKE" as const, txHash: randomTxHash(), chain: "ETHEREUM" as const, fromAddress: "0xStakingContract1111111111111111111111", toAddress: investor1.walletAddress, amount: "20000", currency: "EXPO", status: "CONFIRMED", createdAt: daysAgo(60) },
  ];

  for (const tx of transactions) {
    await prisma.transaction.create({ data: tx });
  }

  console.log(`Created ${transactions.length} transactions`);

  // ===========================================================================
  // PLATFORM CONFIG
  // ===========================================================================

  await prisma.platformConfig.create({
    data: { key: "platform_fee_rate", value: "2.5", description: "Platform fee percentage on contributions" },
  });
  await prisma.platformConfig.create({
    data: { key: "min_staking_amount", value: "100", description: "Minimum EXPO tokens required to stake" },
  });
  await prisma.platformConfig.create({
    data: { key: "kyc_provider", value: "sumsub", description: "Active KYC verification provider" },
  });

  console.log("Created 3 platform config entries");

  // ===========================================================================
  // INVESTMENT GROUPS (3)
  // ===========================================================================

  const group1 = await prisma.investmentGroup.create({
    data: {
      name: "Whale Alliance",
      description: "A syndicate of high-conviction crypto investors pooling capital for premier deal access. Minimum commitment $50K per deal.",
      leadId: investor1.id,
      isPublic: true,
      maxMembers: 25,
      minContribution: "50000",
      createdAt: daysAgo(60),
    },
  });

  const group2 = await prisma.investmentGroup.create({
    data: {
      name: "DeFi Degens Collective",
      description: "Community-driven investment group focused on early-stage DeFi protocols. We research together and invest together.",
      leadId: investor2.id,
      isPublic: true,
      maxMembers: 50,
      minContribution: "5000",
      createdAt: daysAgo(45),
    },
  });

  const group3 = await prisma.investmentGroup.create({
    data: {
      name: "Infrastructure Maxi Fund",
      description: "Private investment group focused exclusively on blockchain infrastructure, L1s, L2s, data availability, and cross-chain protocols.",
      leadId: investor3.id,
      isPublic: false,
      maxMembers: 15,
      minContribution: "25000",
      createdAt: daysAgo(30),
    },
  });

  console.log("Created 3 investment groups");

  // ===========================================================================
  // GROUP MEMBERSHIPS (10)
  // ===========================================================================

  const memberships = [
    // Whale Alliance members
    { groupId: group1.id, userId: investor1.id, role: "LEAD", joinedAt: daysAgo(60) },
    { groupId: group1.id, userId: investor2.id, role: "MEMBER", joinedAt: daysAgo(55) },
    { groupId: group1.id, userId: investor3.id, role: "MEMBER", joinedAt: daysAgo(50) },
    { groupId: group1.id, userId: investor4.id, role: "MEMBER", joinedAt: daysAgo(40) },
    // DeFi Degens Collective members
    { groupId: group2.id, userId: investor2.id, role: "LEAD", joinedAt: daysAgo(45) },
    { groupId: group2.id, userId: investor5.id, role: "MEMBER", joinedAt: daysAgo(40) },
    { groupId: group2.id, userId: investor4.id, role: "MEMBER", joinedAt: daysAgo(35) },
    { groupId: group2.id, userId: investor1.id, role: "MEMBER", joinedAt: daysAgo(30) },
    // Infrastructure Maxi Fund members
    { groupId: group3.id, userId: investor3.id, role: "LEAD", joinedAt: daysAgo(30) },
    { groupId: group3.id, userId: investor1.id, role: "MEMBER", joinedAt: daysAgo(25) },
  ];

  for (const m of memberships) {
    await prisma.groupMembership.create({ data: m });
  }

  console.log(`Created ${memberships.length} group memberships`);

  // ===========================================================================
  // GROUP DEALS (5)
  // ===========================================================================

  const groupDeals = [
    // Whale Alliance participated in Deal 1 (Meridian), Deal 4 (Aether), Deal 5 (NeuralSwap)
    { groupId: group1.id, dealId: deal1.id, totalGroupContribution: "47000", status: "COMPLETED", createdAt: daysAgo(78) },
    { groupId: group1.id, dealId: deal4.id, totalGroupContribution: "95000", status: "ACTIVE", createdAt: daysAgo(5) },
    // DeFi Degens Collective participated in Deal 5 (NeuralSwap), Deal 1 (Meridian)
    { groupId: group2.id, dealId: deal5.id, totalGroupContribution: "42000", status: "ACTIVE", createdAt: daysAgo(5) },
    { groupId: group2.id, dealId: deal1.id, totalGroupContribution: "27000", status: "COMPLETED", createdAt: daysAgo(75) },
    // Infrastructure Maxi Fund targeting Deal 4 (Aether)
    { groupId: group3.id, dealId: deal4.id, totalGroupContribution: "60000", status: "ACTIVE", createdAt: daysAgo(4) },
  ];

  for (const gd of groupDeals) {
    await prisma.groupDeal.create({ data: gd });
  }

  console.log(`Created ${groupDeals.length} group deals`);

  // ===========================================================================
  // 2FA AUDIT LOGS (for admin users with 2FA enabled)
  // ===========================================================================

  const twoFaAuditLogs = [
    { userId: superAdmin.id, action: "TWO_FA_ENABLED", resourceType: "User", resourceId: superAdmin.id, metadata: { backupCodesGenerated: 8 }, createdAt: daysAgo(170) },
    { userId: platformAdmin.id, action: "TWO_FA_ENABLED", resourceType: "User", resourceId: platformAdmin.id, metadata: { backupCodesGenerated: 8 }, createdAt: daysAgo(140) },
    { userId: superAdmin.id, action: "TWO_FA_VALIDATED", resourceType: "User", resourceId: superAdmin.id, metadata: { action: "settings" }, createdAt: daysAgo(10) },
    { userId: platformAdmin.id, action: "TWO_FA_VALIDATED", resourceType: "User", resourceId: platformAdmin.id, metadata: { action: "login" }, createdAt: daysAgo(3) },
  ];

  for (const log of twoFaAuditLogs) {
    await prisma.auditLog.create({ data: log });
  }

  console.log(`Created ${twoFaAuditLogs.length} 2FA audit logs`);

  // ===========================================================================
  // DONE
  // ===========================================================================

  console.log("\nSeed completed successfully!");
  console.log("Summary:");
  console.log(`  Users:              10`);
  console.log(`  Linked Wallets:     ${walletData.length}`);
  console.log(`  Deals:              ${allDeals.length}`);
  console.log(`  Deal Phases:        ${dealPhases.length}`);
  console.log(`  Contributions:      21`);
  console.log(`  Allocations:        ${allocations.length}`);
  console.log(`  Vesting Schedules:  8`);
  console.log(`  Claim Records:      8`);
  console.log(`  Staking Positions:  6`);
  console.log(`  Staking Rewards:    3`);
  console.log(`  Notifications:      ${notificationTemplates.length}`);
  console.log(`  Compliance Flags:   5`);
  console.log(`  Applications:       4`);
  console.log(`  Audit Logs:         ${auditLogs.length + twoFaAuditLogs.length}`);
  console.log(`  Transactions:       ${transactions.length}`);
  console.log(`  Platform Config:    3`);
  console.log(`  Investment Groups:  3`);
  console.log(`  Group Memberships:  ${memberships.length}`);
  console.log(`  Group Deals:        ${groupDeals.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
