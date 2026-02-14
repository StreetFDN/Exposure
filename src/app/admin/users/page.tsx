"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  RotateCcw,
  Download,
  Shield,
  Users,
  Wallet,
  Copy,
  Loader2,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import {
  formatCurrency,
  formatAddress,
  formatDate,
  formatLargeNumber,
} from "@/lib/utils/format";

/* -------------------------------------------------------------------------- */
/*  Types (matching API response shape)                                       */
/* -------------------------------------------------------------------------- */

interface ApiUser {
  id: string;
  walletAddress: string;
  displayName: string | null;
  email: string | null;
  role: string;
  kycStatus: string;
  kycTier: string | null;
  tierLevel: string;
  totalContributed: string;
  totalPoints: number;
  isBanned: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count: {
    wallets: number;
    contributions: number;
    referrals: number;
  };
}

interface UserDetail {
  id: string;
  walletAddress: string;
  displayName: string | null;
  email: string | null;
  role: string;
  kycStatus: string;
  tierLevel: string;
  totalContributed: string;
  totalPoints: number;
  isBanned: boolean;
  banReason: string | null;
  country: string | null;
  createdAt: string;
  wallets: { id: string; address: string; chain: string; isPrimary: boolean }[];
  contributions: {
    id: string;
    amount: string;
    amountUsd: string;
    currency: string;
    chain: string;
    status: string;
    txHash: string | null;
    createdAt: string;
    deal: { id: string; title: string };
  }[];
  stakingPositions: {
    id: string;
    amount: string;
    lockPeriod: string;
    chain: string;
    lockStartAt: string;
    lockEndAt: string | null;
  }[];
  complianceFlags: {
    id: string;
    reason: string;
    severity: string;
    description: string | null;
    isResolved: boolean;
    createdAt: string;
  }[];
  auditLogs: {
    id: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    createdAt: string;
  }[];
  _count: {
    wallets: number;
    contributions: number;
    referrals: number;
    stakingPositions: number;
  };
}

/* -------------------------------------------------------------------------- */
/*  Display maps                                                              */
/* -------------------------------------------------------------------------- */

const kycLabel: Record<string, string> = {
  APPROVED: "Verified",
  PENDING: "Pending",
  REJECTED: "Failed",
  EXPIRED: "Expired",
  NONE: "Not Started",
};

const kycColor: Record<string, string> = {
  APPROVED: "text-emerald-600",
  PENDING: "text-amber-600",
  REJECTED: "text-red-600",
  EXPIRED: "text-red-600",
  NONE: "text-zinc-500",
};

const tierLabel: Record<string, string> = {
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  DIAMOND: "Diamond",
};

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function TableSkeleton() {
  return (
    <div className="border border-zinc-200">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-6 border-b border-zinc-200 px-5 py-4"
        >
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-14 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-10 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [bannedFilter, setBannedFilter] = useState("");

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (kycFilter) params.set("kycStatus", kycFilter);
      if (tierFilter) params.set("tierLevel", tierFilter);
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Failed to fetch users");
      }

      setUsers(json.data.users);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, kycFilter, tierFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [kycFilter, tierFilter, roleFilter, bannedFilter]);

  // Fetch user detail
  const fetchUserDetail = useCallback(async (userId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Failed to fetch user details");
      }
      setUserDetail(json.data.user);
    } catch {
      setUserDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserDetail(selectedUserId);
    } else {
      setUserDetail(null);
    }
  }, [selectedUserId, fetchUserDetail]);

  // Admin actions
  const handleBanUser = async (userId: string, currentlyBanned: boolean) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          currentlyBanned
            ? { isBanned: false, banReason: null }
            : { isBanned: true, banReason: "Banned by admin" }
        ),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Action failed");
      }
      await fetchUsers();
    } catch {
      // Silently handle
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetKyc = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kycStatus: "NONE" }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Action failed");
      }
      await fetchUsers();
    } catch {
      // Silently handle
    } finally {
      setActionLoading(null);
    }
  };

  // Client-side filter for banned status (API doesn't have isBanned filter)
  const filtered = bannedFilter
    ? users.filter((u) => {
        if (bannedFilter === "banned") return u.isBanned;
        if (bannedFilter === "active") return !u.isBanned;
        return true;
      })
    : users;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-light text-zinc-900">
          User Management
        </h1>
        <p className="mt-1 text-sm font-normal text-zinc-500">
          {loading
            ? "Loading..."
            : `${total.toLocaleString()} registered users on the platform`}
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by wallet, email, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-none border border-zinc-200 bg-transparent pl-9 pr-3 text-sm font-normal text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
        </div>
        <div className="w-40">
          <label className="mb-1.5 block text-xs uppercase tracking-widest text-zinc-500">
            KYC Status
          </label>
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="h-9 w-full rounded-none border border-zinc-200 bg-transparent px-3 text-sm font-normal text-zinc-600 focus:border-zinc-400 focus:outline-none"
          >
            <option value="">All</option>
            <option value="APPROVED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Failed</option>
            <option value="NONE">Not Started</option>
          </select>
        </div>
        <div className="w-36">
          <label className="mb-1.5 block text-xs uppercase tracking-widest text-zinc-500">
            Tier
          </label>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-9 w-full rounded-none border border-zinc-200 bg-transparent px-3 text-sm font-normal text-zinc-600 focus:border-zinc-400 focus:outline-none"
          >
            <option value="">All Tiers</option>
            <option value="BRONZE">Bronze</option>
            <option value="SILVER">Silver</option>
            <option value="GOLD">Gold</option>
            <option value="PLATINUM">Platinum</option>
            <option value="DIAMOND">Diamond</option>
          </select>
        </div>
        <div className="w-36">
          <label className="mb-1.5 block text-xs uppercase tracking-widest text-zinc-500">
            Role
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 w-full rounded-none border border-zinc-200 bg-transparent px-3 text-sm font-normal text-zinc-600 focus:border-zinc-400 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="INVESTOR">User</option>
            <option value="PLATFORM_ADMIN">Admin</option>
            <option value="COMPLIANCE_OFFICER">Compliance</option>
          </select>
        </div>
        <div className="w-36">
          <label className="mb-1.5 block text-xs uppercase tracking-widest text-zinc-500">
            Status
          </label>
          <select
            value={bannedFilter}
            onChange={(e) => setBannedFilter(e.target.value)}
            className="h-9 w-full rounded-none border border-zinc-200 bg-transparent px-3 text-sm font-normal text-zinc-600 focus:border-zinc-400 focus:outline-none"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <Users className="mb-6 h-8 w-8 text-zinc-400" />
          <h2 className="font-serif text-2xl font-light text-zinc-800">
            Unable to load users
          </h2>
          <p className="mt-3 max-w-sm text-sm font-normal leading-relaxed text-zinc-500">
            {error}
          </p>
          <button
            onClick={fetchUsers}
            className="mt-8 border border-zinc-300 px-6 py-2.5 text-sm font-normal text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : !error ? (
        <div className="border border-zinc-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-zinc-500 font-normal">
                  Wallet
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-zinc-500 font-normal">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-zinc-500 font-normal">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-zinc-500 font-normal">
                  KYC
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-zinc-500 font-normal">
                  Tier
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-zinc-500 font-normal">
                  Contributed
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-zinc-500 font-normal">
                  Deals
                </th>
                <th className="px-5 py-3 text-left text-xs uppercase tracking-widest text-zinc-500 font-normal">
                  Joined
                </th>
                <th className="px-5 py-3 text-right text-xs uppercase tracking-widest text-zinc-500 font-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-zinc-500">
                      <Users className="h-6 w-6" />
                      <p className="font-serif text-lg font-normal text-zinc-500">
                        No users found
                      </p>
                      <p className="text-sm font-normal">
                        Try adjusting your filters or search query
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      "border-b border-zinc-200 transition-colors hover:bg-zinc-50",
                      user.isBanned && "opacity-50"
                    )}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-500">
                          {formatAddress(user.walletAddress)}
                        </span>
                        {user.isBanned && (
                          <span className="text-[10px] uppercase tracking-widest text-red-600">
                            Banned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-normal text-zinc-700">
                      {user.displayName || "---"}
                    </td>
                    <td className="px-5 py-4 text-sm font-normal text-zinc-500">
                      {user.email || "---"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "text-sm font-normal",
                          kycColor[user.kycStatus] || "text-zinc-500"
                        )}
                      >
                        {kycLabel[user.kycStatus] || user.kycStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-normal text-zinc-600">
                      {tierLabel[user.tierLevel] || user.tierLevel}
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-zinc-700">
                      {formatCurrency(user.totalContributed)}
                    </td>
                    <td className="px-5 py-4 text-sm tabular-nums text-zinc-500">
                      {user._count.contributions}
                    </td>
                    <td className="px-5 py-4 text-sm font-normal text-zinc-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Dropdown>
                        <DropdownTrigger className="inline-flex h-8 w-8 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-600">
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </DropdownTrigger>
                        <DropdownMenu align="right">
                          <DropdownItem
                            icon={<Eye className="h-4 w-4" />}
                            onClick={() => setSelectedUserId(user.id)}
                          >
                            View Profile
                          </DropdownItem>
                          <DropdownSeparator />
                          <DropdownItem
                            icon={<Ban className="h-4 w-4" />}
                            onClick={() =>
                              handleBanUser(user.id, user.isBanned)
                            }
                          >
                            {user.isBanned ? "Unban User" : "Ban User"}
                          </DropdownItem>
                          <DropdownItem
                            icon={<RotateCcw className="h-4 w-4" />}
                            onClick={() => handleResetKyc(user.id)}
                          >
                            Reset KYC
                          </DropdownItem>
                          <DropdownSeparator />
                          <DropdownItem
                            icon={<Download className="h-4 w-4" />}
                          >
                            Export Data
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-normal text-zinc-500">
            Showing {(page - 1) * 20 + 1}--
            {Math.min(page * 20, total)} of {total} users
          </p>
          <div className="flex items-center gap-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1.5 border border-zinc-200 px-4 py-2 text-sm font-normal text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <span className="text-sm font-normal tabular-nums text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1.5 border border-zinc-200 px-4 py-2 text-sm font-normal text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* User detail slide-over panel */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setSelectedUserId(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg overflow-y-auto border-l border-zinc-200 bg-white">
            {/* Panel header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
              <div>
                <h2 className="font-serif text-xl font-normal text-zinc-800">
                  {detailLoading
                    ? "Loading..."
                    : userDetail?.displayName ?? "User Profile"}
                </h2>
                {userDetail && (
                  <p className="mt-0.5 font-mono text-xs text-zinc-500">
                    {formatAddress(userDetail.walletAddress)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedUserId(null)}
                className="flex h-8 w-8 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex flex-col gap-4 p-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="h-2.5 w-16 animate-pulse rounded bg-zinc-200" />
                    <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-200" />
                  </div>
                ))}
              </div>
            ) : userDetail ? (
              <div className="flex flex-col gap-0 p-0">
                {/* Basic info grid */}
                <div className="grid grid-cols-2 gap-px bg-zinc-200">
                  {[
                    {
                      label: "Email",
                      value: userDetail.email || "---",
                    },
                    { label: "Role", value: userDetail.role },
                    {
                      label: "KYC Status",
                      value: kycLabel[userDetail.kycStatus] || userDetail.kycStatus,
                      color: kycColor[userDetail.kycStatus],
                    },
                    {
                      label: "Tier",
                      value: tierLabel[userDetail.tierLevel] || userDetail.tierLevel,
                    },
                    {
                      label: "Total Contributed",
                      value: formatCurrency(userDetail.totalContributed),
                      mono: true,
                    },
                    {
                      label: "Deals",
                      value: userDetail._count.contributions.toString(),
                    },
                    {
                      label: "Joined",
                      value: formatDate(userDetail.createdAt),
                    },
                    {
                      label: "Status",
                      value: userDetail.isBanned ? "Banned" : "Active",
                      color: userDetail.isBanned
                        ? "text-red-600"
                        : "text-emerald-600",
                    },
                  ].map((item) => (
                    <div key={item.label} className="bg-white p-4">
                      <p className="text-xs uppercase tracking-widest text-zinc-500">
                        {item.label}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-sm font-normal",
                          item.color || "text-zinc-700",
                          item.mono && "font-mono"
                        )}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Linked wallets */}
                <div className="border-t border-zinc-200 px-6 py-5">
                  <h4 className="mb-3 text-xs uppercase tracking-widest text-zinc-500">
                    Linked Wallets
                  </h4>
                  {userDetail.wallets.length === 0 ? (
                    <p className="text-sm font-normal text-zinc-400">
                      No linked wallets
                    </p>
                  ) : (
                    <div className="flex flex-col gap-px bg-zinc-200">
                      {userDetail.wallets.map((w) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between bg-white px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <Wallet className="h-3.5 w-3.5 text-zinc-400" />
                            <span className="font-mono text-xs text-zinc-500">
                              {formatAddress(w.address)}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-zinc-400">
                              {w.chain}
                            </span>
                            {w.isPrimary && (
                              <span className="text-[10px] uppercase tracking-widest text-violet-600">
                                Primary
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(w.address)
                            }
                            className="text-zinc-400 transition-colors hover:text-zinc-500"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Staking positions */}
                {userDetail.stakingPositions.length > 0 && (
                  <div className="border-t border-zinc-200 px-6 py-5">
                    <h4 className="mb-3 text-xs uppercase tracking-widest text-zinc-500">
                      Staking Positions
                    </h4>
                    <div className="flex flex-col gap-px bg-zinc-200">
                      {userDetail.stakingPositions.map((sp) => (
                        <div
                          key={sp.id}
                          className="flex items-center justify-between bg-white px-4 py-3"
                        >
                          <span className="text-sm font-normal text-zinc-600">
                            {formatLargeNumber(sp.amount)} EXPO
                          </span>
                          <span className="text-xs font-normal text-emerald-600">
                            {sp.lockPeriod}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliance flags */}
                {userDetail.complianceFlags.length > 0 && (
                  <div className="border-t border-zinc-200 px-6 py-5">
                    <h4 className="mb-3 text-xs uppercase tracking-widest text-zinc-500">
                      Compliance Flags
                    </h4>
                    <div className="flex flex-col gap-px bg-zinc-200">
                      {userDetail.complianceFlags.map((flag) => (
                        <div
                          key={flag.id}
                          className={cn(
                            "flex items-center gap-3 bg-white px-4 py-3",
                            !flag.isResolved && "border-l-2 border-l-red-500/50"
                          )}
                        >
                          <Shield
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              flag.isResolved
                                ? "text-zinc-400"
                                : "text-red-600"
                            )}
                          />
                          <span
                            className={cn(
                              "flex-1 text-sm font-normal",
                              flag.isResolved
                                ? "text-zinc-500"
                                : "text-zinc-600"
                            )}
                          >
                            {flag.reason} -- {flag.severity}
                            {flag.description && `: ${flag.description}`}
                          </span>
                          {flag.isResolved && (
                            <span className="text-[10px] uppercase tracking-widest text-emerald-600">
                              Resolved
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent activity */}
                {userDetail.auditLogs.length > 0 && (
                  <div className="border-t border-zinc-200 px-6 py-5">
                    <h4 className="mb-3 text-xs uppercase tracking-widest text-zinc-500">
                      Recent Activity
                    </h4>
                    <div className="flex flex-col gap-px bg-zinc-200">
                      {userDetail.auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between bg-white px-4 py-3"
                        >
                          <span className="text-sm font-normal text-zinc-500">
                            {log.action} on {log.resourceType}
                            {log.resourceId
                              ? ` (${log.resourceId.slice(0, 8)}...)`
                              : ""}
                          </span>
                          <span className="text-xs font-normal text-zinc-400">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent contributions */}
                {userDetail.contributions.length > 0 && (
                  <div className="border-t border-zinc-200 px-6 py-5">
                    <h4 className="mb-3 text-xs uppercase tracking-widest text-zinc-500">
                      Recent Contributions
                    </h4>
                    <div className="flex flex-col gap-px bg-zinc-200">
                      {userDetail.contributions.slice(0, 5).map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between bg-white px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-normal text-zinc-600">
                              {c.deal.title}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] uppercase tracking-widest",
                                c.status === "CONFIRMED"
                                  ? "text-emerald-600"
                                  : c.status === "PENDING"
                                    ? "text-amber-600"
                                    : "text-red-600"
                              )}
                            >
                              {c.status}
                            </span>
                          </div>
                          <span className="font-mono text-sm text-zinc-700">
                            {formatCurrency(c.amountUsd)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <User className="mb-4 h-6 w-6 text-zinc-400" />
                <p className="font-serif text-lg font-normal text-zinc-600">
                  Unable to load profile
                </p>
                <p className="mt-2 text-sm font-normal text-zinc-500">
                  User details could not be retrieved
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
