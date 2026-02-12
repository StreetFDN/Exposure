"use client";

import { useState } from "react";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  RotateCcw,
  Download,
  Shield,
  Users,
  Wallet,
  Activity,
  Copy,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import { formatCurrency, formatAddress, formatDate, formatLargeNumber } from "@/lib/utils/format";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface User {
  id: string;
  wallet: string;
  displayName: string;
  email: string;
  kycStatus: "Verified" | "Pending" | "Failed" | "Not Started";
  tier: "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";
  role: "User" | "Admin" | "Moderator";
  totalContributed: number;
  dealsCount: number;
  joined: string;
  banned: boolean;
  linkedWallets: string[];
  stakingPositions: { token: string; amount: number; apy: number }[];
  complianceFlags: string[];
  recentActivity: { action: string; date: string }[];
}

/* -------------------------------------------------------------------------- */
/*  Placeholder data                                                          */
/* -------------------------------------------------------------------------- */

const users: User[] = [
  {
    id: "u1",
    wallet: "0x7a2F3b8C4d5E6f1A9B0c1D2e3F4a5B6c7D8e9F0A",
    displayName: "CryptoWhale",
    email: "whale@protonmail.com",
    kycStatus: "Verified",
    tier: "Diamond",
    role: "User",
    totalContributed: 1_250_000,
    dealsCount: 18,
    joined: "2025-03-15",
    banned: false,
    linkedWallets: ["0x7a2F...9F0A", "0x1b3C...2D4E"],
    stakingPositions: [{ token: "EXPO", amount: 500_000, apy: 12.5 }],
    complianceFlags: [],
    recentActivity: [
      { action: "Contributed $50,000 to Nexus Protocol", date: "2026-02-12T10:30:00Z" },
      { action: "Claimed tokens from Quantum Bridge", date: "2026-02-10T14:00:00Z" },
    ],
  },
  {
    id: "u2",
    wallet: "0x3E4f5A6b7C8d9E0F1a2B3c4D5e6F7a8B9c0D1E2F",
    displayName: "DeFiMaster",
    email: "defi@gmail.com",
    kycStatus: "Verified",
    tier: "Platinum",
    role: "User",
    totalContributed: 450_000,
    dealsCount: 12,
    joined: "2025-05-20",
    banned: false,
    linkedWallets: ["0x3E4f...1E2F"],
    stakingPositions: [{ token: "EXPO", amount: 200_000, apy: 12.5 }],
    complianceFlags: [],
    recentActivity: [
      { action: "Registered for AetherFi raise", date: "2026-02-09T08:00:00Z" },
    ],
  },
  {
    id: "u3",
    wallet: "0xA1b2C3d4E5f6A7B8c9D0e1F2a3B4c5D6e7F8a9B0",
    displayName: "AlphaHunter",
    email: "alpha@outlook.com",
    kycStatus: "Verified",
    tier: "Gold",
    role: "User",
    totalContributed: 180_000,
    dealsCount: 8,
    joined: "2025-07-10",
    banned: false,
    linkedWallets: ["0xA1b2...a9B0", "0xC3d4...b1A2", "0xE5f6...c3D4"],
    stakingPositions: [{ token: "EXPO", amount: 75_000, apy: 12.5 }],
    complianceFlags: [],
    recentActivity: [
      { action: "Contributed $10,000 to ZeroLayer", date: "2026-02-11T16:00:00Z" },
    ],
  },
  {
    id: "u4",
    wallet: "0xF9e8D7c6B5a4F3E2d1C0b9A8f7E6d5C4b3A2f1E0",
    displayName: "TokenCollector",
    email: "tokens@yahoo.com",
    kycStatus: "Pending",
    tier: "Silver",
    role: "User",
    totalContributed: 25_000,
    dealsCount: 3,
    joined: "2025-10-05",
    banned: false,
    linkedWallets: ["0xF9e8...f1E0"],
    stakingPositions: [],
    complianceFlags: ["KYC document unclear"],
    recentActivity: [
      { action: "Submitted KYC documents", date: "2026-02-08T12:00:00Z" },
    ],
  },
  {
    id: "u5",
    wallet: "0x1234567890aBcDeF1234567890AbCdEf12345678",
    displayName: "NewbieTrader",
    email: "newbie@gmail.com",
    kycStatus: "Not Started",
    tier: "Bronze",
    role: "User",
    totalContributed: 0,
    dealsCount: 0,
    joined: "2026-02-01",
    banned: false,
    linkedWallets: ["0x1234...5678"],
    stakingPositions: [],
    complianceFlags: [],
    recentActivity: [
      { action: "Account created", date: "2026-02-01T10:00:00Z" },
    ],
  },
  {
    id: "u6",
    wallet: "0x9876543210FeDcBa9876543210FeDcBa98765432",
    displayName: "ShadyAccount",
    email: "shadow@tempmail.com",
    kycStatus: "Failed",
    tier: "Bronze",
    role: "User",
    totalContributed: 5_000,
    dealsCount: 1,
    joined: "2025-12-15",
    banned: true,
    linkedWallets: ["0x9876...5432", "0xAbCd...EfGh"],
    stakingPositions: [],
    complianceFlags: ["Sanctions match", "Fraudulent KYC documents"],
    recentActivity: [
      { action: "Account banned — sanctions match", date: "2026-01-20T09:00:00Z" },
    ],
  },
  {
    id: "u7",
    wallet: "0xaAbBcCdDeEfF0011223344556677889900AaBbCc",
    displayName: "InstitutionalInvestor",
    email: "invest@blackrock.com",
    kycStatus: "Verified",
    tier: "Diamond",
    role: "User",
    totalContributed: 2_500_000,
    dealsCount: 6,
    joined: "2025-06-01",
    banned: false,
    linkedWallets: ["0xaAbB...BbCc"],
    stakingPositions: [{ token: "EXPO", amount: 1_000_000, apy: 12.5 }],
    complianceFlags: [],
    recentActivity: [
      { action: "Contributed $500,000 to Nexus Protocol", date: "2026-02-12T09:00:00Z" },
    ],
  },
  {
    id: "u8",
    wallet: "0x1122334455667788990011223344556677889900",
    displayName: "YieldFarmer",
    email: "farmer@proton.me",
    kycStatus: "Verified",
    tier: "Gold",
    role: "User",
    totalContributed: 95_000,
    dealsCount: 7,
    joined: "2025-08-22",
    banned: false,
    linkedWallets: ["0x1122...9900"],
    stakingPositions: [{ token: "EXPO", amount: 50_000, apy: 12.5 }],
    complianceFlags: [],
    recentActivity: [
      { action: "Unstaked 10,000 EXPO", date: "2026-02-10T11:00:00Z" },
    ],
  },
  {
    id: "u9",
    wallet: "0xfFeEdDcCbBaA9988776655443322110000112233",
    displayName: "AdminSarah",
    email: "sarah@exposure.io",
    kycStatus: "Verified",
    tier: "Diamond",
    role: "Admin",
    totalContributed: 0,
    dealsCount: 0,
    joined: "2025-01-01",
    banned: false,
    linkedWallets: ["0xfFeE...2233"],
    stakingPositions: [],
    complianceFlags: [],
    recentActivity: [
      { action: "Approved NeuralDAO application", date: "2026-02-02T11:30:00Z" },
    ],
  },
  {
    id: "u10",
    wallet: "0xAAbbCCddEEff00112233445566778899AAbbCCdd",
    displayName: "ModMike",
    email: "mike@exposure.io",
    kycStatus: "Verified",
    tier: "Platinum",
    role: "Moderator",
    totalContributed: 50_000,
    dealsCount: 4,
    joined: "2025-02-15",
    banned: false,
    linkedWallets: ["0xAAbb...CCdd"],
    stakingPositions: [{ token: "EXPO", amount: 100_000, apy: 12.5 }],
    complianceFlags: [],
    recentActivity: [
      { action: "Reviewed GameVerse application", date: "2026-02-06T10:00:00Z" },
    ],
  },
  {
    id: "u11",
    wallet: "0x0000111122223333444455556666777788889999",
    displayName: "EarlyBird",
    email: "early@proton.me",
    kycStatus: "Verified",
    tier: "Silver",
    role: "User",
    totalContributed: 42_000,
    dealsCount: 5,
    joined: "2025-04-10",
    banned: false,
    linkedWallets: ["0x0000...9999"],
    stakingPositions: [{ token: "EXPO", amount: 25_000, apy: 12.5 }],
    complianceFlags: [],
    recentActivity: [
      { action: "Claimed vesting tokens from Onchain Labs", date: "2026-02-07T14:00:00Z" },
    ],
  },
  {
    id: "u12",
    wallet: "0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333",
    displayName: "MegaDegen",
    email: "degen@yahoo.com",
    kycStatus: "Verified",
    tier: "Gold",
    role: "User",
    totalContributed: 200_000,
    dealsCount: 15,
    joined: "2025-05-30",
    banned: false,
    linkedWallets: ["0xAAAA...3333", "0xBBBB...4444"],
    stakingPositions: [{ token: "EXPO", amount: 150_000, apy: 12.5 }],
    complianceFlags: [],
    recentActivity: [
      { action: "Registered for Helix Network raise", date: "2026-02-05T18:00:00Z" },
    ],
  },
  {
    id: "u13",
    wallet: "0x4444555566667777888899990000AAAABBBBcCCC",
    displayName: "SmartMoney",
    email: "smart@investment.co",
    kycStatus: "Verified",
    tier: "Platinum",
    role: "User",
    totalContributed: 680_000,
    dealsCount: 9,
    joined: "2025-06-15",
    banned: false,
    linkedWallets: ["0x4444...cCCC"],
    stakingPositions: [{ token: "EXPO", amount: 300_000, apy: 12.5 }],
    complianceFlags: [],
    recentActivity: [
      { action: "Contributed $25,000 to Prism Finance", date: "2026-02-11T20:00:00Z" },
    ],
  },
  {
    id: "u14",
    wallet: "0xDDDDEEEEFFFF00001111222233334444555566667",
    displayName: "PassiveIncome",
    email: "passive@gmail.com",
    kycStatus: "Pending",
    tier: "Bronze",
    role: "User",
    totalContributed: 8_000,
    dealsCount: 1,
    joined: "2026-01-20",
    banned: false,
    linkedWallets: ["0xDDDD...6667"],
    stakingPositions: [],
    complianceFlags: ["Pending KYC verification"],
    recentActivity: [
      { action: "Submitted KYC documents", date: "2026-02-05T08:00:00Z" },
    ],
  },
  {
    id: "u15",
    wallet: "0x7777888899990000AAAABBBBcCCCDDDDEEEEFFFF",
    displayName: "GhostTrader",
    email: "ghost@tempmail.org",
    kycStatus: "Failed",
    tier: "Bronze",
    role: "User",
    totalContributed: 0,
    dealsCount: 0,
    joined: "2026-01-05",
    banned: false,
    linkedWallets: ["0x7777...FFFF"],
    stakingPositions: [],
    complianceFlags: ["KYC document mismatch", "Multiple accounts suspected"],
    recentActivity: [
      { action: "KYC verification failed", date: "2026-01-10T14:00:00Z" },
    ],
  },
];

const kycVariant: Record<string, "success" | "warning" | "error" | "outline"> = {
  Verified: "success",
  Pending: "warning",
  Failed: "error",
  "Not Started": "outline",
};

const tierVariant: Record<string, "default" | "info" | "success" | "warning" | "outline"> = {
  Bronze: "outline",
  Silver: "info",
  Gold: "warning",
  Platinum: "default",
  Diamond: "success",
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [bannedFilter, setBannedFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filtered = users.filter((user) => {
    if (
      searchQuery &&
      !user.wallet.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !user.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    if (kycFilter && user.kycStatus !== kycFilter) return false;
    if (tierFilter && user.tier !== tierFilter) return false;
    if (roleFilter && user.role !== roleFilter) return false;
    if (bannedFilter === "banned" && !user.banned) return false;
    if (bannedFilter === "active" && user.banned) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">User Management</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {users.length} registered users on the platform
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-72">
          <Input
            label="Search"
            placeholder="Search by wallet, email, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftAddon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-40">
          <Select
            label="KYC Status"
            placeholder="All"
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            options={[
              { value: "", label: "All" },
              { value: "Verified", label: "Verified" },
              { value: "Pending", label: "Pending" },
              { value: "Failed", label: "Failed" },
              { value: "Not Started", label: "Not Started" },
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            label="Tier"
            placeholder="All"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            options={[
              { value: "", label: "All Tiers" },
              { value: "Bronze", label: "Bronze" },
              { value: "Silver", label: "Silver" },
              { value: "Gold", label: "Gold" },
              { value: "Platinum", label: "Platinum" },
              { value: "Diamond", label: "Diamond" },
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            label="Role"
            placeholder="All"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: "", label: "All Roles" },
              { value: "User", label: "User" },
              { value: "Moderator", label: "Moderator" },
              { value: "Admin", label: "Admin" },
            ]}
          />
        </div>
        <div className="w-36">
          <Select
            label="Status"
            placeholder="All"
            value={bannedFilter}
            onChange={(e) => setBannedFilter(e.target.value)}
            options={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "banned", label: "Banned" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Wallet</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Contributed</TableHead>
              <TableHead>Deals</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow
                key={user.id}
                className={cn(user.banned && "opacity-60")}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar alt={user.displayName} size="sm" />
                    <span className="font-mono text-xs text-zinc-400">
                      {formatAddress(user.wallet)}
                    </span>
                    {user.banned && (
                      <Badge variant="error" size="sm">Banned</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-zinc-50">
                  {user.displayName}
                </TableCell>
                <TableCell className="text-zinc-400">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={kycVariant[user.kycStatus]}>
                    {user.kycStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={tierVariant[user.tier]}>{user.tier}</Badge>
                </TableCell>
                <TableCell>{formatCurrency(user.totalContributed)}</TableCell>
                <TableCell>{user.dealsCount}</TableCell>
                <TableCell className="text-zinc-500">
                  {formatDate(user.joined)}
                </TableCell>
                <TableCell className="text-right">
                  <Dropdown>
                    <DropdownTrigger className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownTrigger>
                    <DropdownMenu align="right">
                      <DropdownItem
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => setSelectedUser(user)}
                      >
                        View Profile
                      </DropdownItem>
                      <DropdownItem icon={<Edit className="h-4 w-4" />}>
                        Edit Role
                      </DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem icon={<Ban className="h-4 w-4" />}>
                        {user.banned ? "Unban User" : "Ban User"}
                      </DropdownItem>
                      <DropdownItem icon={<RotateCcw className="h-4 w-4" />}>
                        Reset KYC
                      </DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem icon={<Download className="h-4 w-4" />}>
                        Export Data
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* User detail modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.displayName ?? "User Profile"}
        description={selectedUser ? formatAddress(selectedUser.wallet) : ""}
        size="xl"
      >
        {selectedUser && (
          <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-sm text-zinc-200">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Role</p>
                <p className="text-sm text-zinc-200">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">KYC Status</p>
                <Badge variant={kycVariant[selectedUser.kycStatus]}>
                  {selectedUser.kycStatus}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Tier</p>
                <Badge variant={tierVariant[selectedUser.tier]}>
                  {selectedUser.tier}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Total Contributed</p>
                <p className="text-sm font-semibold text-zinc-200">
                  {formatCurrency(selectedUser.totalContributed)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Deals Participated</p>
                <p className="text-sm font-semibold text-zinc-200">
                  {selectedUser.dealsCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Joined</p>
                <p className="text-sm text-zinc-200">
                  {formatDate(selectedUser.joined)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Status</p>
                {selectedUser.banned ? (
                  <Badge variant="error">Banned</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
            </div>

            {/* Linked wallets */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-zinc-300">
                Linked Wallets
              </h4>
              <div className="space-y-1.5">
                {selectedUser.linkedWallets.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2"
                  >
                    <span className="font-mono text-sm text-zinc-400">{w}</span>
                    <CopyButton text={w} />
                  </div>
                ))}
              </div>
            </div>

            {/* Staking positions */}
            {selectedUser.stakingPositions.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-300">
                  Staking Positions
                </h4>
                <div className="space-y-1.5">
                  {selectedUser.stakingPositions.map((sp, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2"
                    >
                      <span className="text-sm text-zinc-300">
                        {formatLargeNumber(sp.amount)} {sp.token}
                      </span>
                      <Badge variant="success">{sp.apy}% APY</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance flags */}
            {selectedUser.complianceFlags.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-300">
                  Compliance Flags
                </h4>
                <div className="space-y-1.5">
                  {selectedUser.complianceFlags.map((flag, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2"
                    >
                      <Shield className="h-4 w-4 text-rose-400" />
                      <span className="text-sm text-rose-300">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity log */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-zinc-300">
                Recent Activity
              </h4>
              <div className="space-y-1.5">
                {selectedUser.recentActivity.map((act, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2"
                  >
                    <span className="text-sm text-zinc-400">{act.action}</span>
                    <span className="text-xs text-zinc-600">
                      {formatDate(act.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
