"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
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
/*  Badge variant maps                                                        */
/* -------------------------------------------------------------------------- */

const kycVariant: Record<string, "success" | "warning" | "error" | "outline"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "error",
  EXPIRED: "error",
  NONE: "outline",
};

const kycLabel: Record<string, string> = {
  APPROVED: "Verified",
  PENDING: "Pending",
  REJECTED: "Failed",
  EXPIRED: "Expired",
  NONE: "Not Started",
};

const tierVariant: Record<string, "default" | "info" | "success" | "warning" | "outline"> = {
  BRONZE: "outline",
  SILVER: "info",
  GOLD: "warning",
  PLATINUM: "default",
  DIAMOND: "success",
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
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <div className="flex flex-col gap-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-zinc-800/50 px-4 py-3"
          >
            <Skeleton variant="circle" width="2rem" height="2rem" />
            <Skeleton variant="text" width="120px" />
            <Skeleton variant="text" width="100px" />
            <Skeleton variant="text" width="140px" />
            <Skeleton variant="text" width="70px" />
            <Skeleton variant="text" width="60px" />
            <Skeleton variant="text" width="80px" />
            <Skeleton variant="text" width="50px" />
            <Skeleton variant="text" width="80px" />
          </div>
        ))}
      </div>
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
      // Refresh list
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
        <h1 className="text-2xl font-bold text-zinc-50">User Management</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {loading ? "Loading..." : `${total} registered users on the platform`}
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
              { value: "APPROVED", label: "Verified" },
              { value: "PENDING", label: "Pending" },
              { value: "REJECTED", label: "Failed" },
              { value: "NONE", label: "Not Started" },
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
              { value: "BRONZE", label: "Bronze" },
              { value: "SILVER", label: "Silver" },
              { value: "GOLD", label: "Gold" },
              { value: "PLATINUM", label: "Platinum" },
              { value: "DIAMOND", label: "Diamond" },
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
              { value: "INVESTOR", label: "User" },
              { value: "PLATFORM_ADMIN", label: "Admin" },
              { value: "COMPLIANCE_OFFICER", label: "Compliance" },
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

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchUsers}
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <Users className="h-8 w-8" />
                      <p className="text-sm font-medium">No users found</p>
                      <p className="text-xs">
                        Try adjusting your filters or search query
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow
                    key={user.id}
                    className={cn(user.isBanned && "opacity-60")}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar alt={user.displayName || "User"} size="sm" />
                        <span className="font-mono text-xs text-zinc-400">
                          {formatAddress(user.walletAddress)}
                        </span>
                        {user.isBanned && (
                          <Badge variant="error" size="sm">
                            Banned
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-zinc-50">
                      {user.displayName || "---"}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {user.email || "---"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={kycVariant[user.kycStatus] || "outline"}>
                        {kycLabel[user.kycStatus] || user.kycStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tierVariant[user.tierLevel] || "outline"}>
                        {tierLabel[user.tierLevel] || user.tierLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(user.totalContributed)}
                    </TableCell>
                    <TableCell>{user._count.contributions}</TableCell>
                    <TableCell className="text-zinc-500">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dropdown>
                        <DropdownTrigger className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50">
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
                          <DropdownItem icon={<Edit className="h-4 w-4" />}>
                            Edit Role
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
                          <DropdownItem icon={<Download className="h-4 w-4" />}>
                            Export Data
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Showing {(page - 1) * 20 + 1}--
            {Math.min(page * 20, total)} of {total} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User detail modal */}
      <Modal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        title={userDetail?.displayName ?? "User Profile"}
        description={
          userDetail ? formatAddress(userDetail.walletAddress) : ""
        }
        size="xl"
      >
        {detailLoading ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <Skeleton variant="text" width="60px" height="12px" />
                  <Skeleton variant="text" width="120px" height="16px" />
                </div>
              ))}
            </div>
            <Skeleton variant="rect" height="80px" />
            <Skeleton variant="rect" height="80px" />
          </div>
        ) : userDetail ? (
          <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-sm text-zinc-200">
                  {userDetail.email || "---"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Role</p>
                <p className="text-sm text-zinc-200">{userDetail.role}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">KYC Status</p>
                <Badge
                  variant={kycVariant[userDetail.kycStatus] || "outline"}
                >
                  {kycLabel[userDetail.kycStatus] || userDetail.kycStatus}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Tier</p>
                <Badge
                  variant={tierVariant[userDetail.tierLevel] || "outline"}
                >
                  {tierLabel[userDetail.tierLevel] || userDetail.tierLevel}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Total Contributed</p>
                <p className="text-sm font-semibold text-zinc-200">
                  {formatCurrency(userDetail.totalContributed)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Deals Participated</p>
                <p className="text-sm font-semibold text-zinc-200">
                  {userDetail._count.contributions}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Joined</p>
                <p className="text-sm text-zinc-200">
                  {formatDate(userDetail.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Status</p>
                {userDetail.isBanned ? (
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
                {userDetail.wallets.length === 0 ? (
                  <p className="text-sm text-zinc-500">No linked wallets</p>
                ) : (
                  userDetail.wallets.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-zinc-400">
                          {formatAddress(w.address)}
                        </span>
                        <Badge variant="outline" size="sm">
                          {w.chain}
                        </Badge>
                        {w.isPrimary && (
                          <Badge variant="info" size="sm">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <CopyButton text={w.address} />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Staking positions */}
            {userDetail.stakingPositions.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-300">
                  Staking Positions
                </h4>
                <div className="space-y-1.5">
                  {userDetail.stakingPositions.map((sp) => (
                    <div
                      key={sp.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2"
                    >
                      <span className="text-sm text-zinc-300">
                        {formatLargeNumber(sp.amount)} EXPO
                      </span>
                      <Badge variant="success">{sp.lockPeriod}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance flags */}
            {userDetail.complianceFlags.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-300">
                  Compliance Flags
                </h4>
                <div className="space-y-1.5">
                  {userDetail.complianceFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2",
                        flag.isResolved
                          ? "border-zinc-800 bg-zinc-800/30"
                          : "border-rose-500/20 bg-rose-500/5"
                      )}
                    >
                      <Shield
                        className={cn(
                          "h-4 w-4",
                          flag.isResolved
                            ? "text-zinc-500"
                            : "text-rose-400"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm",
                          flag.isResolved
                            ? "text-zinc-500"
                            : "text-rose-300"
                        )}
                      >
                        {flag.reason} — {flag.severity}
                        {flag.description && `: ${flag.description}`}
                      </span>
                      {flag.isResolved && (
                        <Badge variant="success" size="sm">
                          Resolved
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity from audit logs */}
            {userDetail.auditLogs.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-300">
                  Recent Activity
                </h4>
                <div className="space-y-1.5">
                  {userDetail.auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2"
                    >
                      <span className="text-sm text-zinc-400">
                        {log.action} on {log.resourceType}
                        {log.resourceId ? ` (${log.resourceId.slice(0, 8)}...)` : ""}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent contributions */}
            {userDetail.contributions.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-300">
                  Recent Contributions
                </h4>
                <div className="space-y-1.5">
                  {userDetail.contributions.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-300">
                          {c.deal.title}
                        </span>
                        <Badge
                          variant={
                            c.status === "CONFIRMED"
                              ? "success"
                              : c.status === "PENDING"
                                ? "warning"
                                : "error"
                          }
                          size="sm"
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <span className="text-sm font-semibold text-zinc-200">
                        {formatCurrency(c.amountUsd)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-zinc-500">
            <AlertTriangle className="h-6 w-6" />
            <p className="text-sm">Failed to load user details</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
