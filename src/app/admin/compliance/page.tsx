"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Search,
  Activity,
  ChevronRight,
  Eye,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Flag,
  Loader2,
  Users,
  Inbox,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
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

const severityColor: Record<string, string> = {
  CRITICAL: "text-red-600",
  HIGH: "text-red-600",
  MEDIUM: "text-amber-600",
  LOW: "text-zinc-500",
};

const tabs = [
  { id: "flagged", label: "Flagged Transactions" },
  { id: "kyc", label: "KYC Queue" },
  { id: "sanctions", label: "Sanctions Alerts" },
  { id: "audit", label: "Audit Log" },
];

/* -------------------------------------------------------------------------- */
/*  Loading skeletons                                                         */
/* -------------------------------------------------------------------------- */

function RowSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-6 border-b border-zinc-200 px-5 py-4"
        >
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-28 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-14 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
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

  useEffect(() => {
    if (activeTab === "flagged") fetchFlags();
    else if (activeTab === "kyc") fetchKycQueue();
    else if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab, fetchFlags, fetchKycQueue, fetchAuditLogs]);

  const handleResolveFlag = async (flagId: string) => {
    setResolvingFlagId(flagId);
    try {
      const res = await fetch(`/api/admin/compliance/flags/${flagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution: "Resolved by admin review -- no further action required" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to resolve flag");
      await fetchFlags();
    } catch {
      // Silently handle
    } finally {
      setResolvingFlagId(null);
    }
  };

  const openFlags = flagSummary?.unresolved ?? 0;
  const resolvedFlags = flags.filter((f) => f.isResolved).length;
  const highSeverity = (flagSummary?.bySeverity?.CRITICAL ?? 0) + (flagSummary?.bySeverity?.HIGH ?? 0);
  const pendingSar = flags.filter((f) => !f.isResolved && (f.severity === "CRITICAL" || f.severity === "HIGH")).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-light text-zinc-900">Compliance</h1>
        <p className="mt-1 text-sm font-normal text-zinc-500">Monitor flagged transactions, KYC reviews, and sanctions alerts</p>
      </div>

      {/* Critical alert banner */}
      {highSeverity > 0 && (
        <div className="flex items-center gap-3 border border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm font-normal text-red-700">
            {highSeverity} high-severity flags require immediate attention. Review flagged transactions below.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-zinc-200">
        {[
          { label: "Open Flags", value: flagsLoading ? "..." : openFlags },
          { label: "Resolved", value: flagsLoading ? "..." : resolvedFlags },
          { label: "Pending SAR", value: flagsLoading ? "..." : pendingSar },
          { label: "High Severity", value: flagsLoading ? "..." : highSeverity },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5">
            <p className="text-xs uppercase tracking-widest text-zinc-500">{stat.label}</p>
            <p className="mt-2 font-serif text-2xl font-light text-zinc-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "border-b-2 px-5 py-3 text-sm font-normal transition-colors",
                activeTab === tab.id
                  ? "border-violet-500 text-zinc-800"
                  : "border-transparent text-zinc-500 hover:text-zinc-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Flagged Transactions */}
      {activeTab === "flagged" && (
        <>
          {flagsError && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Shield className="mb-6 h-8 w-8 text-zinc-400" />
              <h2 className="font-serif text-2xl font-light text-zinc-800">Unable to load flags</h2>
              <p className="mt-3 max-w-sm text-sm font-normal leading-relaxed text-zinc-500">{flagsError}</p>
              <button onClick={fetchFlags} className="mt-8 border border-zinc-300 px-6 py-2.5 text-sm font-normal text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-800">Retry</button>
            </div>
          )}

          <div className="border border-zinc-200">
            {flagsLoading ? (
              <RowSkeleton />
            ) : flags.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
                <CheckCircle2 className="h-6 w-6" />
                <p className="font-serif text-lg font-normal text-zinc-500">No flagged transactions</p>
                <p className="text-sm font-normal">All clear -- no compliance flags to review</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200">
                    {["Wallet", "Deal", "Amount", "Flag Reason", "Severity", "Status", "Date", ""].map((h) => (
                      <th key={h} className={cn("px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500", h === "" && "text-right")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flags.map((flag) => (
                    <tr key={flag.id} className="border-b border-zinc-200 transition-colors hover:bg-zinc-50">
                      <td className="px-5 py-4"><span className="font-mono text-xs text-zinc-500">{formatAddress(flag.user.walletAddress)}</span></td>
                      <td className="px-5 py-4 text-sm font-normal text-zinc-700">{flag.deal?.title ?? "---"}</td>
                      <td className="px-5 py-4 font-mono text-sm text-zinc-800">{flag.contribution ? formatCurrency(flag.contribution.amountUsd) : "---"}</td>
                      <td className="px-5 py-4"><span className="text-sm font-normal text-zinc-600">{flag.reason}</span></td>
                      <td className="px-5 py-4"><span className={cn("text-sm font-normal", severityColor[flag.severity] || "text-zinc-500")}>{flag.severity}</span></td>
                      <td className="px-5 py-4"><span className={cn("text-sm font-normal", !flag.isResolved ? "text-amber-600" : "text-emerald-600")}>{flag.isResolved ? "Resolved" : "Open"}</span></td>
                      <td className="px-5 py-4 text-sm font-normal text-zinc-500">{formatDate(flag.createdAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-zinc-500 transition-colors hover:text-zinc-600"><Eye className="h-3.5 w-3.5" /></button>
                          {!flag.isResolved && (
                            <button onClick={() => handleResolveFlag(flag.id)} disabled={resolvingFlagId === flag.id} className="text-zinc-500 transition-colors hover:text-emerald-600 disabled:opacity-50">
                              {resolvingFlagId === flag.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          <button className="text-zinc-500 transition-colors hover:text-zinc-600"><ArrowUpRight className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* KYC Queue */}
      {activeTab === "kyc" && (
        <>
          {kycError && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Users className="mb-6 h-8 w-8 text-zinc-400" />
              <h2 className="font-serif text-2xl font-light text-zinc-800">Unable to load KYC queue</h2>
              <p className="mt-3 max-w-sm text-sm font-normal leading-relaxed text-zinc-500">{kycError}</p>
              <button onClick={fetchKycQueue} className="mt-8 border border-zinc-300 px-6 py-2.5 text-sm font-normal text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-800">Retry</button>
            </div>
          )}

          {kycLoading ? (
            <RowSkeleton rows={4} />
          ) : kycUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border border-zinc-200 py-16 text-zinc-500">
              <CheckCircle2 className="h-6 w-6" />
              <p className="font-serif text-lg font-normal text-zinc-500">KYC queue is empty</p>
              <p className="text-sm font-normal">No pending KYC submissions to review</p>
            </div>
          ) : (
            <div className="flex flex-col gap-px bg-zinc-200">
              {kycUsers.map((kyc) => (
                <div key={kyc.id} className="flex items-center justify-between bg-white px-5 py-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-normal text-zinc-800">{kyc.displayName || "Unknown User"}</span>
                      <span className="text-[10px] uppercase tracking-widest text-amber-600">Pending KYC</span>
                    </div>
                    <div className="flex items-center gap-4 text-zinc-500">
                      <span className="font-mono text-xs">{formatAddress(kyc.walletAddress)}</span>
                      <span className="text-xs font-normal">{kyc.email || "No email"}</span>
                      <span className="flex items-center gap-1 text-xs font-normal"><Clock className="h-3 w-3" />Joined {formatDate(kyc.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="border border-emerald-200 px-4 py-2 text-sm font-normal text-emerald-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50">Approve</button>
                    <button className="border border-red-200 px-4 py-2 text-sm font-normal text-red-600 transition-colors hover:border-red-300 hover:bg-red-50">Reject</button>
                    <button className="border border-zinc-200 px-4 py-2 text-sm font-normal text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700">Request Resubmission</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sanctions Alerts */}
      {activeTab === "sanctions" && (
        <div className="flex flex-col items-center gap-4 border border-zinc-200 py-20 text-center">
          <Shield className="h-8 w-8 text-zinc-300" />
          <p className="font-serif text-lg font-normal text-zinc-500">No sanctions alerts</p>
          <p className="max-w-sm text-sm font-normal leading-relaxed text-zinc-400">
            Chainalysis sanctions screening integration is pending. When connected, real-time OFAC/EU/UN sanctions matches will appear here.
          </p>
        </div>
      )}

      {/* Audit Log */}
      {activeTab === "audit" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Search by user, action, resource..." value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)}
                className="h-9 w-full rounded-none border border-zinc-200 bg-transparent pl-9 pr-3 text-sm font-normal text-zinc-700 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none" />
            </div>
            <div className="w-48">
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-zinc-500">Action Type</label>
              <select value={auditActionFilter} onChange={(e) => setAuditActionFilter(e.target.value)}
                className="h-9 w-full rounded-none border border-zinc-200 bg-transparent px-3 text-sm font-normal text-zinc-600 focus:border-zinc-400 focus:outline-none">
                <option value="">All Actions</option>
                <option value="COMPLIANCE_FLAG">Flag Events</option>
                <option value="USER_KYC">KYC Events</option>
                <option value="USER_BANNED">User Ban Events</option>
                <option value="USER_UPDATED">User Updates</option>
              </select>
            </div>
          </div>

          {auditError && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Activity className="mb-6 h-8 w-8 text-zinc-400" />
              <h2 className="font-serif text-2xl font-light text-zinc-800">Unable to load audit logs</h2>
              <p className="mt-3 max-w-sm text-sm font-normal leading-relaxed text-zinc-500">{auditError}</p>
              <button onClick={fetchAuditLogs} className="mt-8 border border-zinc-300 px-6 py-2.5 text-sm font-normal text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-800">Retry</button>
            </div>
          )}

          <div className="border border-zinc-200">
            {auditLoading ? (
              <RowSkeleton rows={10} />
            ) : auditLogs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-zinc-500">
                <Inbox className="h-6 w-6" />
                <p className="font-serif text-lg font-normal text-zinc-500">No audit log entries</p>
                <p className="text-sm font-normal">Activity will appear here as actions are taken</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="w-8 px-3 py-3" />
                    <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Timestamp</th>
                    <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">User</th>
                    <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Action</th>
                    <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">Resource</th>
                    <th className="px-5 py-3 text-left text-xs font-normal uppercase tracking-widest text-zinc-500">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((entry) => {
                    const isExpanded = expandedAuditId === entry.id;
                    const displayUser = entry.user?.email || entry.user?.displayName || (entry.userId ? "Unknown" : "system");
                    const actionColor = entry.action.includes("CREATED") || entry.action.includes("SUBMIT")
                      ? "text-sky-600"
                      : entry.action.includes("APPROVED") || entry.action.includes("RESOLVED")
                        ? "text-emerald-600"
                        : entry.action.includes("REJECTED") || entry.action.includes("BANNED")
                          ? "text-red-600"
                          : entry.action.includes("ALERT") || entry.action.includes("PAUSE")
                            ? "text-amber-600"
                            : "text-zinc-500";

                    return (
                      <>
                        <tr key={entry.id} className="cursor-pointer border-b border-zinc-200 transition-colors hover:bg-zinc-50" onClick={() => setExpandedAuditId(isExpanded ? null : entry.id)}>
                          <td className="px-3 py-4"><ChevronRight className={cn("h-3.5 w-3.5 text-zinc-400 transition-transform", isExpanded && "rotate-90")} /></td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-normal text-zinc-500">{formatDate(entry.createdAt, { includeTime: true })}</td>
                          <td className="px-5 py-4"><span className={cn("text-sm font-normal", displayUser === "system" ? "italic text-zinc-400" : "text-zinc-700")}>{displayUser}</span></td>
                          <td className="px-5 py-4"><span className={cn("text-xs font-normal uppercase tracking-wider", actionColor)}>{entry.action}</span></td>
                          <td className="px-5 py-4 font-mono text-xs text-zinc-500">{entry.resourceType}{entry.resourceId ? `:${entry.resourceId.slice(0, 8)}...` : ""}</td>
                          <td className="px-5 py-4 text-xs font-normal text-zinc-400">{entry.ipAddress || "---"}</td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${entry.id}-detail`}>
                            <td colSpan={6} className="border-b border-zinc-200 bg-zinc-50 p-0">
                              <div className="px-5 py-4">
                                <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Metadata</p>
                                <pre className="overflow-x-auto border border-zinc-200 bg-white p-4 font-mono text-xs leading-relaxed text-zinc-500">
                                  {entry.metadata ? JSON.stringify(entry.metadata, null, 2) : "No metadata"}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
