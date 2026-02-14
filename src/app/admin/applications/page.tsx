"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
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

const statusLabel: Record<string, string> = {
  SUBMITTED: "Pending", UNDER_REVIEW: "Under DD", DUE_DILIGENCE: "Under DD",
  APPROVED: "Approved", REJECTED: "Rejected", CHANGES_REQUESTED: "Changes Req.",
};

const categoryLabel: Record<string, string> = {
  DEFI: "DeFi", INFRASTRUCTURE: "Infrastructure", GAMING: "Gaming",
  AI: "AI", NFT: "NFT", SOCIAL: "Social", OTHER: "Other",
};

function parseScoreData(internalNotes: string | null): ScoreData | null {
  if (!internalNotes) return null;
  try {
    const parsed = JSON.parse(internalNotes);
    if (typeof parsed === "object" && parsed !== null && "teamScore" in parsed) return parsed as ScoreData;
    return null;
  } catch { return null; }
}

/* -------------------------------------------------------------------------- */
/*  Score bar                                                                  */
/* -------------------------------------------------------------------------- */

function ScoreBar({ score, label, editable, onChange }: {
  score: number; label: string; editable?: boolean; onChange?: (v: number) => void;
}) {
  const pct = (score / 10) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-normal text-zinc-500">{label}</span>
        {editable ? (
          <input type="number" min={0} max={10} step={1} value={score}
            onChange={(e) => onChange?.(Math.min(10, Math.max(0, Number(e.target.value))))}
            className="w-12 border border-zinc-200 bg-transparent px-2 py-0.5 text-right text-xs text-zinc-600 outline-none focus:border-zinc-400"
          />
        ) : (
          <span className="text-xs text-zinc-500">{score}/10</span>
        )}
      </div>
      <div className="h-1 w-full bg-zinc-200">
        <div
          className={cn("h-full transition-all", score >= 7 ? "bg-emerald-500" : score >= 4 ? "bg-amber-500" : "bg-red-500")}
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
    <div className="flex flex-col gap-8">
      <div className="h-8 w-48 animate-pulse bg-zinc-200" />
      <div className="grid grid-cols-2 gap-px border border-zinc-200 bg-zinc-200 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse bg-white" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse border border-zinc-200 bg-white" />
      ))}
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
  const [editingScores, setEditingScores] = useState<Record<string, { teamScore: number; productScore: number; tokenomicsScore: number; tractionScore: number }>>({});
  const [scoringId, setScoringId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch("/api/admin/applications?limit=50");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to load");
      setApplications(json.data.applications);
      setTotal(json.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "SUBMITTED").length,
    dd: applications.filter((a) => a.status === "UNDER_REVIEW" || a.status === "DUE_DILIGENCE").length,
    approved: applications.filter((a) => a.status === "APPROVED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  const filtered = applications.filter((app) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return app.status === "SUBMITTED";
    if (activeTab === "dd") return app.status === "UNDER_REVIEW" || app.status === "DUE_DILIGENCE";
    if (activeTab === "approved") return app.status === "APPROVED";
    if (activeTab === "rejected") return app.status === "REJECTED";
    return true;
  });

  const handleStatusUpdate = useCallback(async (appId: string, newStatus: string, rejectionReason?: string) => {
    try {
      setActionLoading(appId);
      const body: Record<string, unknown> = { status: newStatus };
      if (rejectionReason) body.rejectionReason = rejectionReason;
      if (actionNotes[appId]) body.internalNotes = actionNotes[appId];
      const res = await fetch(`/api/admin/applications/${appId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed");
      await fetchApplications();
      setActionNotes((prev) => { const copy = { ...prev }; delete copy[appId]; return copy; });
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setActionLoading(null); }
  }, [fetchApplications, actionNotes]);

  const handleApprove = useCallback((appId: string) => handleStatusUpdate(appId, "APPROVED"), [handleStatusUpdate]);
  const handleReject = useCallback((appId: string) => {
    const reason = actionNotes[appId] || prompt("Rejection reason:");
    if (!reason) { alert("A rejection reason is required."); return; }
    handleStatusUpdate(appId, "REJECTED", reason);
  }, [handleStatusUpdate, actionNotes]);
  const handleRequestChanges = useCallback((appId: string) => handleStatusUpdate(appId, "CHANGES_REQUESTED"), [handleStatusUpdate]);

  const handleSubmitScores = useCallback(async (appId: string) => {
    const scores = editingScores[appId]; if (!scores) return;
    try {
      setScoringId(appId);
      const res = await fetch(`/api/admin/applications/${appId}/score`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...scores, notes: actionNotes[appId] || undefined }) });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed");
      setEditingScores((prev) => { const copy = { ...prev }; delete copy[appId]; return copy; });
      await fetchApplications();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setScoringId(null); }
  }, [editingScores, actionNotes, fetchApplications]);

  const startScoring = useCallback((app: ApiApplication) => {
    const sd = parseScoreData(app.internalNotes);
    setEditingScores((prev) => ({ ...prev, [app.id]: { teamScore: sd?.teamScore ?? 0, productScore: sd?.productScore ?? 0, tokenomicsScore: sd?.tokenomicsScore ?? 0, tractionScore: sd?.tractionScore ?? 0 } }));
  }, []);

  if (loading) return <ApplicationsSkeleton />;
  if (error) return (
    <div className="flex flex-col items-center gap-4 py-24">
      <p className="font-serif text-lg font-normal text-zinc-500">Failed to load applications</p>
      <p className="text-sm font-normal text-zinc-400">{error}</p>
      <button onClick={fetchApplications} className="border border-zinc-200 px-4 py-2 text-sm font-normal text-zinc-500 transition-colors hover:text-zinc-700">Retry</button>
    </div>
  );

  const tabs = [
    { key: "all", label: "All", count: statusCounts.all },
    { key: "pending", label: "Pending", count: statusCounts.pending },
    { key: "dd", label: "Under DD", count: statusCounts.dd },
    { key: "approved", label: "Approved", count: statusCounts.approved },
    { key: "rejected", label: "Rejected", count: statusCounts.rejected },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-2xl font-light text-zinc-900">Applications</h1>
        <p className="mt-1 text-sm font-normal text-zinc-500">Review and score project applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px border border-zinc-200 bg-zinc-200 sm:grid-cols-5">
        {tabs.map((t) => (
          <div key={t.key} className="bg-white p-4">
            <p className="text-xs uppercase tracking-widest text-zinc-500">{t.label}</p>
            <p className="mt-1 font-serif text-2xl font-light text-zinc-900">{t.count}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-zinc-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn("px-4 py-2 text-sm font-normal transition-colors", activeTab === t.key ? "border-b-2 border-violet-500 text-zinc-900" : "text-zinc-500 hover:text-zinc-600")}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-0">
        {filtered.length === 0 && <p className="py-16 text-center text-sm font-normal text-zinc-400">No applications found</p>}
        {filtered.map((app) => {
          const isExpanded = expandedId === app.id;
          const isLoading = actionLoading === app.id;
          const scoreData = parseScoreData(app.internalNotes);
          const compositeScore = app.internalScore ? parseFloat(app.internalScore) / 10 : null;
          const avgScore = scoreData ? (scoreData.teamScore + scoreData.productScore + scoreData.tokenomicsScore + scoreData.tractionScore) / 4 : compositeScore;
          const isEditingScore = !!editingScores[app.id];
          const isScoringLoading = scoringId === app.id;

          return (
            <div key={app.id} className="border border-zinc-200 border-b-0 last:border-b">
              <div className="flex cursor-pointer items-start justify-between px-6 py-5" onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-normal text-zinc-800">{app.projectName}</span>
                    <span className="text-xs font-normal text-zinc-500">{statusLabel[app.status] ?? app.status}</span>
                    <span className="text-xs font-normal text-zinc-400">{categoryLabel[app.category] ?? app.category}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-normal text-zinc-500">
                    <span>Target: {formatCurrency(app.targetRaise)}</span>
                    <span>{formatDate(app.createdAt)}</span>
                    <span className="font-mono">{formatAddress(app.applicantWallet)}</span>
                  </div>
                  {avgScore !== null && (
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm", avgScore >= 7 ? "text-emerald-600" : avgScore >= 4 ? "text-amber-600" : "text-red-600")}>
                        {avgScore.toFixed(1)}/10
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {(app.status === "SUBMITTED" || app.status === "UNDER_REVIEW" || app.status === "DUE_DILIGENCE") && (
                    <>
                      <button onClick={() => handleApprove(app.id)} disabled={isLoading} className="px-3 py-1.5 text-xs text-emerald-600 transition-colors hover:text-emerald-500 disabled:opacity-50">
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                      </button>
                      <button onClick={() => handleReject(app.id)} disabled={isLoading} className="px-3 py-1.5 text-xs text-red-600 transition-colors hover:text-red-500 disabled:opacity-50">Reject</button>
                    </>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-zinc-200 px-6 py-5">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 flex flex-col gap-5">
                      <div>
                        <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Description</p>
                        <p className="text-sm font-normal leading-relaxed text-zinc-500">{app.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                          ["Token", `${app.tokenName} (${app.tokenTicker})`],
                          ["Chain", app.chain],
                          ["Website", app.projectWebsite],
                          ["Contact", app.contactTelegram || app.contactEmail],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <p className="text-xs uppercase tracking-widest text-zinc-500">{l}</p>
                            {l === "Website" && v ? (
                              <a href={v} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-normal text-violet-600 hover:text-violet-500">
                                Visit <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <p className="mt-0.5 text-sm font-normal text-zinc-600">{v}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Scoring */}
                      <div>
                        <p className="mb-3 text-xs uppercase tracking-widest text-zinc-500">Scoring</p>
                        {isEditingScore ? (
                          <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                              {(["teamScore", "productScore", "tokenomicsScore", "tractionScore"] as const).map((k) => (
                                <ScoreBar key={k} score={editingScores[app.id][k]} label={k.replace("Score", "")} editable
                                  onChange={(v) => setEditingScores((prev) => ({ ...prev, [app.id]: { ...prev[app.id], [k]: v } }))} />
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleSubmitScores(app.id)} disabled={isScoringLoading}
                                className="border border-violet-200 px-4 py-1.5 text-xs text-violet-600 transition-colors hover:bg-violet-50 disabled:opacity-50">
                                {isScoringLoading && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}Save
                              </button>
                              <button onClick={() => setEditingScores((prev) => { const c = { ...prev }; delete c[app.id]; return c; })}
                                className="px-4 py-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-700">Cancel</button>
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
                            <button onClick={() => startScoring(app)} className="w-fit text-xs text-zinc-500 transition-colors hover:text-zinc-700">
                              {scoreData ? "Edit Scores" : "Add Scores"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Action Notes</p>
                        <textarea rows={2} value={actionNotes[app.id] || ""} onChange={(e) => setActionNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                          placeholder="Add notes or reason..."
                          className="w-full border border-zinc-200 bg-transparent px-3 py-2 text-sm font-normal text-zinc-700 outline-none placeholder:text-zinc-300 focus:border-zinc-400" />
                        <div className="mt-2 flex items-center gap-2">
                          {(app.status === "SUBMITTED" || app.status === "UNDER_REVIEW" || app.status === "DUE_DILIGENCE") && (
                            <>
                              <button onClick={() => handleApprove(app.id)} disabled={isLoading} className="border border-emerald-200 px-3 py-1.5 text-xs text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50">Approve</button>
                              <button onClick={() => handleReject(app.id)} disabled={isLoading} className="border border-red-200 px-3 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50">Reject</button>
                              <button onClick={() => handleRequestChanges(app.id)} disabled={isLoading} className="border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-700 disabled:opacity-50">Request Changes</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: documents & notes */}
                    <div className="flex flex-col gap-4">
                      <p className="text-xs uppercase tracking-widest text-zinc-500">Documents</p>
                      {[
                        { label: "Pitch Deck", url: app.pitchDeckUrl },
                        { label: "Whitepaper", url: app.whitepaperUrl },
                        { label: "Audit Report", url: app.auditReportUrl },
                      ].filter((d) => d.url).map((d) => (
                        <a key={d.label} href={d.url!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-normal text-violet-600 hover:text-violet-500">
                          {d.label} <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                      {!app.pitchDeckUrl && !app.whitepaperUrl && !app.auditReportUrl && (
                        <p className="text-xs font-normal text-zinc-400">No documents attached</p>
                      )}
                      {app.rejectionReason && (
                        <div className="mt-2 border border-red-200 p-3">
                          <p className="text-xs uppercase tracking-widest text-red-600">Rejection Reason</p>
                          <p className="mt-1 text-sm font-normal text-zinc-500">{app.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
