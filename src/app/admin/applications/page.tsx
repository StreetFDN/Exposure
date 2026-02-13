"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Star,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency, formatAddress, formatDate } from "@/lib/utils/format";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ApiApplication {
  id: string;
  projectName: string;
  projectWebsite: string;
  contactEmail: string;
  contactTelegram: string | null;
  applicantWallet: string;
  status: string;
  category: string;
  description: string;
  targetRaise: string;
  valuation: string | null;
  tokenName: string;
  tokenTicker: string;
  tokenSupply: string;
  chain: string;
  teamInfo: any;
  tokenomics: any;
  pitchDeckUrl: string | null;
  whitepaperUrl: string | null;
  auditReportUrl: string | null;
  internalScore: string | null;
  internalNotes: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ScoreData {
  teamScore: number;
  productScore: number;
  tokenomicsScore: number;
  tractionScore: number;
  compositeScore: number;
  notes?: string;
  scoredBy: string;
  scoredAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const statusVariant: Record<string, "default" | "info" | "success" | "warning" | "error" | "outline"> = {
  SUBMITTED: "warning",
  UNDER_REVIEW: "info",
  DUE_DILIGENCE: "info",
  APPROVED: "success",
  REJECTED: "error",
  CHANGES_REQUESTED: "outline",
};

const statusLabel: Record<string, string> = {
  SUBMITTED: "Pending",
  UNDER_REVIEW: "Under DD",
  DUE_DILIGENCE: "Under DD",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CHANGES_REQUESTED: "Changes Requested",
};

const categoryLabel: Record<string, string> = {
  DEFI: "DeFi",
  INFRASTRUCTURE: "Infrastructure",
  GAMING: "Gaming",
  AI: "AI",
  NFT: "NFT",
  SOCIAL: "Social",
  OTHER: "Other",
};

function parseScoreData(internalNotes: string | null): ScoreData | null {
  if (!internalNotes) return null;
  try {
    const parsed = JSON.parse(internalNotes);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "teamScore" in parsed &&
      "productScore" in parsed
    ) {
      return parsed as ScoreData;
    }
    return null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Score bar component                                                        */
/* -------------------------------------------------------------------------- */

function ScoreBar({ score, label, editable, onChange }: {
  score: number;
  label: string;
  editable?: boolean;
  onChange?: (value: number) => void;
}) {
  const pct = (score / 10) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        {editable ? (
          <input
            type="number"
            min={0}
            max={10}
            step={1}
            value={score}
            onChange={(e) => onChange?.(Math.min(10, Math.max(0, Number(e.target.value))))}
            className="w-14 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-300 text-right outline-none focus:border-violet-500"
          />
        ) : (
          <span className="text-xs font-medium text-zinc-300">{score}/10</span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score >= 7 ? "bg-emerald-500" : score >= 4 ? "bg-amber-500" : "bg-rose-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function ApplicationsSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div>
        <div className="h-8 w-64 rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-48 rounded bg-zinc-800" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-zinc-800/40 bg-zinc-900/30" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-zinc-800/40 bg-zinc-900/30" />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ApplicationReviewPage() {
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});

  // Scoring state per application
  const [editingScores, setEditingScores] = useState<Record<string, {
    teamScore: number;
    productScore: number;
    tokenomicsScore: number;
    tractionScore: number;
  }>>({});
  const [scoringId, setScoringId] = useState<string | null>(null);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("limit", "50");

      const res = await fetch(`/api/admin/applications?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load applications");
      }

      setApplications(json.data.applications);
      setTotal(json.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Compute status counts
  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "SUBMITTED").length,
    dd: applications.filter((a) => a.status === "UNDER_REVIEW" || a.status === "DUE_DILIGENCE").length,
    approved: applications.filter((a) => a.status === "APPROVED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  // Filter applications by tab
  const filtered = applications.filter((app) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return app.status === "SUBMITTED";
    if (activeTab === "dd") return app.status === "UNDER_REVIEW" || app.status === "DUE_DILIGENCE";
    if (activeTab === "approved") return app.status === "APPROVED";
    if (activeTab === "rejected") return app.status === "REJECTED";
    return true;
  });

  // Action: Update application status
  const handleStatusUpdate = useCallback(async (
    appId: string,
    newStatus: string,
    rejectionReason?: string
  ) => {
    try {
      setActionLoading(appId);

      const body: Record<string, unknown> = { status: newStatus };
      if (rejectionReason) body.rejectionReason = rejectionReason;
      if (actionNotes[appId]) body.internalNotes = actionNotes[appId];

      const res = await fetch(`/api/admin/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update application");
      }

      await fetchApplications();
      // Clear notes for this app
      setActionNotes((prev) => {
        const copy = { ...prev };
        delete copy[appId];
        return copy;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update application");
    } finally {
      setActionLoading(null);
    }
  }, [fetchApplications, actionNotes]);

  // Action: Approve
  const handleApprove = useCallback((appId: string) => {
    handleStatusUpdate(appId, "APPROVED");
  }, [handleStatusUpdate]);

  // Action: Reject (requires reason)
  const handleReject = useCallback((appId: string) => {
    const reason = actionNotes[appId] || prompt("Rejection reason is required:");
    if (!reason) {
      alert("A rejection reason is required.");
      return;
    }
    handleStatusUpdate(appId, "REJECTED", reason);
  }, [handleStatusUpdate, actionNotes]);

  // Action: Request changes
  const handleRequestChanges = useCallback((appId: string) => {
    handleStatusUpdate(appId, "CHANGES_REQUESTED");
  }, [handleStatusUpdate]);

  // Action: Submit scores
  const handleSubmitScores = useCallback(async (appId: string) => {
    const scores = editingScores[appId];
    if (!scores) return;

    try {
      setScoringId(appId);
      const res = await fetch(`/api/admin/applications/${appId}/score`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamScore: scores.teamScore,
          productScore: scores.productScore,
          tokenomicsScore: scores.tokenomicsScore,
          tractionScore: scores.tractionScore,
          notes: actionNotes[appId] || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to submit scores");
      }

      // Clear editing state
      setEditingScores((prev) => {
        const copy = { ...prev };
        delete copy[appId];
        return copy;
      });
      await fetchApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit scores");
    } finally {
      setScoringId(null);
    }
  }, [editingScores, actionNotes, fetchApplications]);

  // Start scoring an application
  const startScoring = useCallback((app: ApiApplication) => {
    const existingScoreData = parseScoreData(app.internalNotes);
    setEditingScores((prev) => ({
      ...prev,
      [app.id]: {
        teamScore: existingScoreData?.teamScore ?? 0,
        productScore: existingScoreData?.productScore ?? 0,
        tokenomicsScore: existingScoreData?.tokenomicsScore ?? 0,
        tractionScore: existingScoreData?.tractionScore ?? 0,
      },
    }));
  }, []);

  if (loading) return <ApplicationsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="h-10 w-10 text-rose-400" />
        <h2 className="text-lg font-semibold text-zinc-200">Failed to load applications</h2>
        <p className="text-sm text-zinc-500">{error}</p>
        <button
          onClick={fetchApplications}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Application Review</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Review and score project applications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard
          label="Total Applications"
          value={statusCounts.all}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Review"
          value={statusCounts.pending}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Under DD"
          value={statusCounts.dd}
          icon={<Search className="h-5 w-5" />}
        />
        <StatCard
          label="Approved"
          value={statusCounts.approved}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Rejected"
          value={statusCounts.rejected}
          icon={<XCircle className="h-5 w-5" />}
        />
      </div>

      {/* Tabs + List */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="dd">Under DD ({statusCounts.dd})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({statusCounts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({statusCounts.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="flex flex-col gap-4">
            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-500">
                No applications found
              </p>
            )}
            {filtered.map((app) => {
              const isExpanded = expandedId === app.id;
              const isLoading = actionLoading === app.id;
              const scoreData = parseScoreData(app.internalNotes);
              const compositeScore = app.internalScore ? parseFloat(app.internalScore) / 10 : null;
              const avgScore = scoreData
                ? (scoreData.teamScore + scoreData.productScore + scoreData.tokenomicsScore + scoreData.tractionScore) / 4
                : compositeScore;
              const isEditingScore = !!editingScores[app.id];
              const isScoringLoading = scoringId === app.id;

              return (
                <Card key={app.id}>
                  {/* Card summary */}
                  <div
                    className="flex cursor-pointer items-start justify-between p-6"
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-zinc-50">
                          {app.projectName}
                        </h3>
                        <Badge variant={statusVariant[app.status] ?? "outline"}>
                          {statusLabel[app.status] ?? app.status}
                        </Badge>
                        <Badge variant="outline">
                          {categoryLabel[app.category] ?? app.category}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                        <span>Target: {formatCurrency(app.targetRaise)}</span>
                        <span>Submitted: {formatDate(app.createdAt)}</span>
                        <span className="font-mono text-xs">
                          {formatAddress(app.applicantWallet)}
                        </span>
                        <span>{app.contactEmail}</span>
                      </div>

                      {/* Score indicator */}
                      {avgScore !== null && (
                        <div className="flex items-center gap-2 mt-1">
                          <Star
                            className={cn(
                              "h-4 w-4",
                              avgScore >= 7
                                ? "text-emerald-400"
                                : avgScore >= 4
                                  ? "text-amber-400"
                                  : "text-rose-400"
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              avgScore >= 7
                                ? "text-emerald-400"
                                : avgScore >= 4
                                  ? "text-amber-400"
                                  : "text-rose-400"
                            )}
                          >
                            {avgScore.toFixed(1)}/10
                          </span>
                          <Progress
                            value={avgScore * 10}
                            color={avgScore >= 7 ? "success" : avgScore >= 4 ? "warning" : "error"}
                            className="w-24"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quick actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {app.status === "SUBMITTED" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              startScoring(app);
                              setExpandedId(app.id);
                            }}
                          >
                            Score
                          </Button>
                        )}
                        {(app.status === "SUBMITTED" || app.status === "UNDER_REVIEW" || app.status === "DUE_DILIGENCE") && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(app.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(app.id)}
                              disabled={isLoading}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {app.status !== "CHANGES_REQUESTED" &&
                          app.status !== "APPROVED" &&
                          app.status !== "REJECTED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestChanges(app.id)}
                              disabled={isLoading}
                            >
                              Request Changes
                            </Button>
                          )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-zinc-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-zinc-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800 p-6 pt-4">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left: Application details */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-zinc-300">
                              Project Description
                            </h4>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                              {app.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div>
                              <p className="text-xs text-zinc-500">Token</p>
                              <p className="text-sm font-medium text-zinc-200">
                                {app.tokenName} ({app.tokenTicker})
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-500">Chain</p>
                              <p className="text-sm font-medium text-zinc-200">
                                {app.chain}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-500">Website</p>
                              <a
                                href={app.projectWebsite}
                                className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Visit <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <div>
                              <p className="text-xs text-zinc-500">Contact</p>
                              <p className="text-sm font-medium text-zinc-200">
                                {app.contactTelegram || app.contactEmail}
                              </p>
                            </div>
                          </div>

                          {/* Scoring */}
                          <div>
                            <h4 className="mb-3 text-sm font-semibold text-zinc-300">
                              Internal Scoring
                            </h4>
                            {isEditingScore ? (
                              <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <ScoreBar
                                    score={editingScores[app.id].teamScore}
                                    label="Team"
                                    editable
                                    onChange={(v) => setEditingScores((prev) => ({
                                      ...prev,
                                      [app.id]: { ...prev[app.id], teamScore: v },
                                    }))}
                                  />
                                  <ScoreBar
                                    score={editingScores[app.id].productScore}
                                    label="Product"
                                    editable
                                    onChange={(v) => setEditingScores((prev) => ({
                                      ...prev,
                                      [app.id]: { ...prev[app.id], productScore: v },
                                    }))}
                                  />
                                  <ScoreBar
                                    score={editingScores[app.id].tokenomicsScore}
                                    label="Tokenomics"
                                    editable
                                    onChange={(v) => setEditingScores((prev) => ({
                                      ...prev,
                                      [app.id]: { ...prev[app.id], tokenomicsScore: v },
                                    }))}
                                  />
                                  <ScoreBar
                                    score={editingScores[app.id].tractionScore}
                                    label="Traction"
                                    editable
                                    onChange={(v) => setEditingScores((prev) => ({
                                      ...prev,
                                      [app.id]: { ...prev[app.id], tractionScore: v },
                                    }))}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSubmitScores(app.id)}
                                    disabled={isScoringLoading}
                                  >
                                    {isScoringLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                    Save Scores
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setEditingScores((prev) => {
                                      const copy = { ...prev };
                                      delete copy[app.id];
                                      return copy;
                                    })}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <ScoreBar score={scoreData?.teamScore ?? 0} label="Team" />
                                  <ScoreBar score={scoreData?.productScore ?? 0} label="Product" />
                                  <ScoreBar score={scoreData?.tokenomicsScore ?? 0} label="Tokenomics" />
                                  <ScoreBar score={scoreData?.tractionScore ?? 0} label="Traction" />
                                </div>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => startScoring(app)}
                                  className="w-fit"
                                >
                                  {scoreData ? "Edit Scores" : "Add Scores"}
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Action with reason */}
                          <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
                            <label className="text-sm font-medium text-zinc-300">
                              Action Notes / Reason
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Add notes or reason for your decision..."
                              value={actionNotes[app.id] || ""}
                              onChange={(e) =>
                                setActionNotes((prev) => ({ ...prev, [app.id]: e.target.value }))
                              }
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                            />
                            <div className="flex items-center gap-2">
                              {(app.status === "SUBMITTED" || app.status === "UNDER_REVIEW" || app.status === "DUE_DILIGENCE") && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(app.id)}
                                    disabled={isLoading}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(app.id)}
                                    disabled={isLoading}
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRequestChanges(app.id)}
                                    disabled={isLoading}
                                  >
                                    Request Changes
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Notes feed */}
                        <div className="flex flex-col gap-4">
                          <h4 className="text-sm font-semibold text-zinc-300">
                            Internal Notes
                          </h4>

                          {/* Score data notes display */}
                          <div className="flex flex-col gap-3">
                            {scoreData?.notes ? (
                              <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-xs font-medium text-violet-400">
                                    Score Notes
                                  </span>
                                  {scoreData.scoredAt && (
                                    <span className="text-xs text-zinc-600">
                                      {formatDate(scoreData.scoredAt)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-zinc-400">
                                  {scoreData.notes}
                                </p>
                              </div>
                            ) : null}

                            {app.rejectionReason && (
                              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                                <div className="mb-1">
                                  <span className="text-xs font-medium text-rose-400">
                                    Rejection Reason
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-400">
                                  {app.rejectionReason}
                                </p>
                              </div>
                            )}

                            {!scoreData?.notes && !app.rejectionReason && (
                              <p className="text-sm text-zinc-600">
                                No notes yet
                              </p>
                            )}
                          </div>

                          {/* Additional info */}
                          {app.pitchDeckUrl && (
                            <a
                              href={app.pitchDeckUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
                            >
                              <FileText className="h-4 w-4" />
                              Pitch Deck
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {app.whitepaperUrl && (
                            <a
                              href={app.whitepaperUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
                            >
                              <FileText className="h-4 w-4" />
                              Whitepaper
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {app.auditReportUrl && (
                            <a
                              href={app.auditReportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
                            >
                              <FileText className="h-4 w-4" />
                              Audit Report
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
