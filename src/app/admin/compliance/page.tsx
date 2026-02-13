"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  Shield,
  Search,
  FileWarning,
  Activity,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Clock,
  Flag,
  Loader2,
  Users,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatAddress, formatDate } from "@/lib/utils/format";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ComplianceFlag {
  id: string;
  userId: string;
  dealId: string | null;
  contributionId: string | null;
  reason: string;
  severity: string;
  description: string | null;
  isResolved: boolean;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    walletAddress: string;
    displayName: string | null;
  };
  deal: {
    id: string;
    title: string;
  } | null;
  contribution: {
    id: string;
    txHash: string | null;
    amountUsd: string;
  } | null;
}

interface FlagSummary {
  total: number;
  unresolved: number;
  bySeverity: Record<string, number>;
}

interface KycUser {
  id: string;
  walletAddress: string;
  displayName: string | null;
  email: string | null;
  kycStatus: string;
  tierLevel: string;
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    walletAddress: string;
  } | null;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const severityVariant: Record<string, "error" | "warning" | "info"> = {
  CRITICAL: "error",
  HIGH: "error",
  MEDIUM: "warning",
  LOW: "info",
};

/* -------------------------------------------------------------------------- */
/*  Loading skeletons                                                         */
/* -------------------------------------------------------------------------- */

function FlagTableSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-zinc-800/50 px-4 py-3"
        >
          <Skeleton variant="text" width="100px" />
          <Skeleton variant="text" width="80px" />
          <Skeleton variant="text" width="70px" />
          <Skeleton variant="text" width="100px" />
          <Skeleton variant="text" width="60px" />
          <Skeleton variant="text" width="70px" />
          <Skeleton variant="text" width="80px" />
        </div>
      ))}
    </div>
  );
}

function KycQueueSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="card" height="80px" />
      ))}
    </div>
  );
}

function AuditLogSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-zinc-800/50 px-4 py-3"
        >
          <Skeleton variant="text" width="20px" />
          <Skeleton variant="text" width="120px" />
          <Skeleton variant="text" width="100px" />
          <Skeleton variant="text" width="80px" />
          <Skeleton variant="text" width="100px" />
          <Skeleton variant="text" width="80px" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ComplianceDashboardPage() {
  const [activeTab, setActiveTab] = useState("flagged");

  // Flagged Transactions state
  const [flags, setFlags] = useState<ComplianceFlag[]>([]);
  const [flagSummary, setFlagSummary] = useState<FlagSummary | null>(null);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagsError, setFlagsError] = useState<string | null>(null);
  const [resolvingFlagId, setResolvingFlagId] = useState<string | null>(null);

  // KYC Queue state
  const [kycUsers, setKycUsers] = useState<KycUser[]>([]);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycError, setKycError] = useState<string | null>(null);

  // Audit Log state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");

  // --------------------------------------------------------------------------
  // Fetch flagged transactions
  // --------------------------------------------------------------------------
  const fetchFlags = useCallback(async () => {
    setFlagsLoading(true);
    setFlagsError(null);
    try {
      const res = await fetch("/api/admin/compliance/flags?limit=50");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to fetch flags");
      setFlags(json.data.flags);
      setFlagSummary(json.data.summary);
    } catch (err) {
      setFlagsError(err instanceof Error ? err.message : "Failed to fetch flags");
    } finally {
      setFlagsLoading(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // Fetch KYC queue
  // --------------------------------------------------------------------------
  const fetchKycQueue = useCallback(async () => {
    setKycLoading(true);
    setKycError(null);
    try {
      const res = await fetch("/api/admin/users?kycStatus=PENDING&limit=50");
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to fetch KYC queue");
      setKycUsers(json.data.users);
    } catch (err) {
      setKycError(err instanceof Error ? err.message : "Failed to fetch KYC queue");
    } finally {
      setKycLoading(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // Fetch audit logs
  // --------------------------------------------------------------------------
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (auditSearch) params.set("search", auditSearch);
      if (auditActionFilter) params.set("action", auditActionFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to fetch audit logs");
      setAuditLogs(json.data.logs);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Failed to fetch audit logs");
    } finally {
      setAuditLoading(false);
    }
  }, [auditSearch, auditActionFilter]);

  // --------------------------------------------------------------------------
  // Load data based on active tab
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (activeTab === "flagged") fetchFlags();
    else if (activeTab === "kyc") fetchKycQueue();
    else if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab, fetchFlags, fetchKycQueue, fetchAuditLogs]);

  // --------------------------------------------------------------------------
  // Resolve flag action
  // --------------------------------------------------------------------------
  const handleResolveFlag = async (flagId: string) => {
    setResolvingFlagId(flagId);
    try {
      const res = await fetch(`/api/admin/compliance/flags/${flagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: "Resolved by admin review — no further action required",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to resolve flag");
      // Refresh flags
      await fetchFlags();
    } catch {
      // Silently handle
    } finally {
      setResolvingFlagId(null);
    }
  };

  // --------------------------------------------------------------------------
  // Derived stats
  // --------------------------------------------------------------------------
  const openFlags = flagSummary?.unresolved ?? 0;
  const resolvedFlags = flags.filter((f) => f.isResolved).length;
  const highSeverity =
    (flagSummary?.bySeverity?.CRITICAL ?? 0) +
    (flagSummary?.bySeverity?.HIGH ?? 0);
  const pendingSar = flags.filter(
    (f) => !f.isResolved && (f.severity === "CRITICAL" || f.severity === "HIGH")
  ).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Compliance</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Monitor flagged transactions, KYC reviews, and sanctions alerts
        </p>
      </div>

      {/* Critical alert banner */}
      {highSeverity > 0 && (
        <Alert
          variant="error"
          title={`${highSeverity} high-severity flags require immediate attention`}
          description="Review flagged transactions below to address potential compliance violations."
          dismissible
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Open Flags"
          value={flagsLoading ? "..." : openFlags}
          icon={<Flag className="h-5 w-5" />}
        />
        <StatCard
          label="Resolved"
          value={flagsLoading ? "..." : resolvedFlags}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Pending SAR"
          value={flagsLoading ? "..." : pendingSar}
          icon={<FileWarning className="h-5 w-5" />}
        />
        <StatCard
          label="High Severity"
          value={flagsLoading ? "..." : highSeverity}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="flagged" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="flagged">Flagged Transactions</TabsTrigger>
          <TabsTrigger value="kyc">KYC Queue</TabsTrigger>
          <TabsTrigger value="sanctions">Sanctions Alerts</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* Flagged Transactions                                             */}
        {/* ================================================================ */}
        <TabsContent value="flagged">
          {flagsError && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{flagsError}</span>
              <Button size="sm" variant="ghost" onClick={fetchFlags} className="ml-auto">
                Retry
              </Button>
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            {flagsLoading ? (
              <FlagTableSkeleton />
            ) : flags.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-zinc-500">
                <CheckCircle2 className="h-8 w-8" />
                <p className="text-sm font-medium">No flagged transactions</p>
                <p className="text-xs">All clear -- no compliance flags to review</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Wallet</TableHead>
                    <TableHead>Deal</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Flag Reason</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-zinc-400">
                          {formatAddress(flag.user.walletAddress)}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-200">
                        {flag.deal?.title ?? "---"}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-50">
                        {flag.contribution
                          ? formatCurrency(flag.contribution.amountUsd)
                          : "---"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{flag.reason}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={severityVariant[flag.severity] || "info"}>
                          {flag.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-sm",
                            !flag.isResolved && "text-amber-400",
                            flag.isResolved && "text-emerald-400"
                          )}
                        >
                          {flag.isResolved ? "Resolved" : "Open"}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {formatDate(flag.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {!flag.isResolved && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResolveFlag(flag.id)}
                              disabled={resolvingFlagId === flag.id}
                            >
                              {resolvingFlagId === flag.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* KYC Queue                                                        */}
        {/* ================================================================ */}
        <TabsContent value="kyc">
          {kycError && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{kycError}</span>
              <Button size="sm" variant="ghost" onClick={fetchKycQueue} className="ml-auto">
                Retry
              </Button>
            </div>
          )}
          {kycLoading ? (
            <KycQueueSkeleton />
          ) : kycUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 py-12 text-zinc-500">
              <CheckCircle2 className="h-8 w-8" />
              <p className="text-sm font-medium">KYC queue is empty</p>
              <p className="text-xs">No pending KYC submissions to review</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {kycUsers.map((kyc) => (
                <Card key={kyc.id}>
                  <div className="flex items-center justify-between p-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-zinc-50">
                          {kyc.displayName || "Unknown User"}
                        </span>
                        <Badge variant="warning">Pending KYC</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <span className="font-mono text-xs">
                          {formatAddress(kyc.walletAddress)}
                        </span>
                        <span>{kyc.email || "No email"}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Joined {formatDate(kyc.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm">Approve</Button>
                      <Button size="sm" variant="destructive">
                        Reject
                      </Button>
                      <Button size="sm" variant="outline">
                        Request Resubmission
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/* Sanctions Alerts                                                 */}
        {/* ================================================================ */}
        <TabsContent value="sanctions">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 py-16 text-zinc-500">
            <Shield className="h-10 w-10 text-zinc-600" />
            <p className="text-sm font-medium text-zinc-400">
              No sanctions alerts
            </p>
            <p className="max-w-sm text-center text-xs text-zinc-600">
              Chainalysis sanctions screening integration is pending. When
              connected, real-time OFAC/EU/UN sanctions matches will appear
              here.
            </p>
          </div>
        </TabsContent>

        {/* ================================================================ */}
        {/* Audit Log                                                        */}
        {/* ================================================================ */}
        <TabsContent value="audit">
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div className="w-72">
              <Input
                placeholder="Search by user, action, resource..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                leftAddon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-48">
              <Select
                placeholder="All Actions"
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                options={[
                  { value: "", label: "All Actions" },
                  { value: "COMPLIANCE_FLAG", label: "Flag Events" },
                  { value: "USER_KYC", label: "KYC Events" },
                  { value: "USER_BANNED", label: "User Ban Events" },
                  { value: "USER_UPDATED", label: "User Updates" },
                ]}
              />
            </div>
          </div>

          {auditError && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{auditError}</span>
              <Button size="sm" variant="ghost" onClick={fetchAuditLogs} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-zinc-800">
            {auditLoading ? (
              <AuditLogSkeleton />
            ) : auditLogs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-zinc-500">
                <Inbox className="h-8 w-8" />
                <p className="text-sm font-medium">No audit log entries</p>
                <p className="text-xs">Activity will appear here as actions are taken</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-8" />
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((entry) => {
                    const isExpanded = expandedAuditId === entry.id;
                    const displayUser =
                      entry.user?.email ||
                      entry.user?.displayName ||
                      (entry.userId ? "Unknown" : "system");
                    return (
                      <>
                        <TableRow
                          key={entry.id}
                          className="cursor-pointer"
                          onClick={() =>
                            setExpandedAuditId(isExpanded ? null : entry.id)
                          }
                        >
                          <TableCell>
                            <ChevronRight
                              className={cn(
                                "h-3.5 w-3.5 text-zinc-600 transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-zinc-400 whitespace-nowrap">
                            {formatDate(entry.createdAt, { includeTime: true })}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "text-sm",
                                displayUser === "system"
                                  ? "text-zinc-500 italic"
                                  : "text-zinc-200"
                              )}
                            >
                              {displayUser}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                entry.action.includes("CREATED") ||
                                entry.action.includes("SUBMIT")
                                  ? "info"
                                  : entry.action.includes("APPROVED") ||
                                      entry.action.includes("RESOLVED")
                                    ? "success"
                                    : entry.action.includes("REJECTED") ||
                                        entry.action.includes("BANNED")
                                      ? "error"
                                      : entry.action.includes("ALERT") ||
                                          entry.action.includes("PAUSE")
                                        ? "warning"
                                        : "outline"
                              }
                            >
                              {entry.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-zinc-400">
                            {entry.resourceType}
                            {entry.resourceId
                              ? `:${entry.resourceId.slice(0, 8)}...`
                              : ""}
                          </TableCell>
                          <TableCell className="text-zinc-500 text-xs">
                            {entry.ipAddress || "---"}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow
                            key={`${entry.id}-detail`}
                            className="hover:bg-transparent"
                          >
                            <TableCell colSpan={6} className="bg-zinc-800/20 p-0">
                              <div className="p-4">
                                <p className="mb-1 text-xs font-medium text-zinc-400">
                                  Details (JSON)
                                </p>
                                <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
                                  {entry.metadata
                                    ? JSON.stringify(entry.metadata, null, 2)
                                    : "No metadata"}
                                </pre>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
