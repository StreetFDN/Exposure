"use client";

import { useState } from "react";
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
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Application {
  id: string;
  projectName: string;
  category: string;
  targetRaise: number;
  submittedDate: string;
  applicantWallet: string;
  contactEmail: string;
  contactTelegram: string;
  status: "Pending" | "Under DD" | "Approved" | "Rejected" | "Changes Requested";
  internalScore: number | null;
  teamScore: number;
  productScore: number;
  tokenomicsScore: number;
  tractionScore: number;
  description: string;
  website: string;
  tokenName: string;
  ticker: string;
  chain: string;
  notes: { author: string; text: string; date: string }[];
}

/* -------------------------------------------------------------------------- */
/*  Placeholder data                                                          */
/* -------------------------------------------------------------------------- */

const applications: Application[] = [
  {
    id: "app-1",
    projectName: "Lumina Chain",
    category: "Infrastructure",
    targetRaise: 5_000_000,
    submittedDate: "2026-02-10",
    applicantWallet: "0x9a3f8c2d1e5b7a4f6c8d9e0f1a2b3c4d5e6f7a8b",
    contactEmail: "team@luminachain.io",
    contactTelegram: "@luminachain",
    status: "Pending",
    internalScore: null,
    teamScore: 0,
    productScore: 0,
    tokenomicsScore: 0,
    tractionScore: 0,
    description: "Next-generation L1 blockchain with parallel execution engine and sub-second finality. Targeting enterprise DeFi adoption.",
    website: "https://luminachain.io",
    tokenName: "Lumina",
    ticker: "LMN",
    chain: "Ethereum",
    notes: [],
  },
  {
    id: "app-2",
    projectName: "DefiYield Pro",
    category: "DeFi",
    targetRaise: 2_000_000,
    submittedDate: "2026-02-08",
    applicantWallet: "0x4b7c9d2e8f1a3b5c6d7e0f9a8b1c2d3e4f5a6b7c",
    contactEmail: "founders@defiyieldpro.com",
    contactTelegram: "@defiyieldpro",
    status: "Under DD",
    internalScore: 7.2,
    teamScore: 8,
    productScore: 7,
    tokenomicsScore: 6,
    tractionScore: 8,
    description: "Automated yield aggregation protocol leveraging cross-chain liquidity for optimized returns. Live on 4 chains with $12M TVL.",
    website: "https://defiyieldpro.com",
    tokenName: "DYP Token",
    ticker: "DYP",
    chain: "Arbitrum",
    notes: [
      {
        author: "Sarah K.",
        text: "Strong team background — 2 ex-Aave devs. Product already live with decent traction.",
        date: "2026-02-09T14:30:00Z",
      },
    ],
  },
  {
    id: "app-3",
    projectName: "GameVerse Studios",
    category: "Gaming",
    targetRaise: 8_000_000,
    submittedDate: "2026-02-05",
    applicantWallet: "0xd8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7",
    contactEmail: "biz@gameverse.gg",
    contactTelegram: "@gameverse_gg",
    status: "Under DD",
    internalScore: 6.5,
    teamScore: 7,
    productScore: 7,
    tokenomicsScore: 5,
    tractionScore: 7,
    description: "AAA-quality blockchain gaming studio building an open-world MMORPG with player-owned economies. Backed by Animoca.",
    website: "https://gameverse.gg",
    tokenName: "GVERSE",
    ticker: "GVS",
    chain: "Polygon",
    notes: [
      {
        author: "Mike T.",
        text: "Tokenomics need revision — too much team allocation. Game demo is impressive though.",
        date: "2026-02-06T10:00:00Z",
      },
      {
        author: "Sarah K.",
        text: "Requested updated tokenomics doc from team. Waiting for response.",
        date: "2026-02-07T16:45:00Z",
      },
    ],
  },
  {
    id: "app-4",
    projectName: "NeuralDAO",
    category: "AI",
    targetRaise: 3_500_000,
    submittedDate: "2026-01-28",
    applicantWallet: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    contactEmail: "hello@neuraldao.ai",
    contactTelegram: "@neuraldao",
    status: "Approved",
    internalScore: 8.5,
    teamScore: 9,
    productScore: 8,
    tokenomicsScore: 8,
    tractionScore: 9,
    description: "Decentralized AI model marketplace enabling permissionless training and inference. Partnership with Bittensor ecosystem.",
    website: "https://neuraldao.ai",
    tokenName: "NEURAL",
    ticker: "NRL",
    chain: "Ethereum",
    notes: [
      {
        author: "Sarah K.",
        text: "Exceptional team — PhD researchers from DeepMind and OpenAI. Strong product-market fit.",
        date: "2026-01-30T09:00:00Z",
      },
      {
        author: "James L.",
        text: "Legal review complete. Green light for listing.",
        date: "2026-02-02T11:30:00Z",
      },
    ],
  },
  {
    id: "app-5",
    projectName: "QuickSwap V4",
    category: "DeFi",
    targetRaise: 1_500_000,
    submittedDate: "2026-01-22",
    applicantWallet: "0xf1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0",
    contactEmail: "dev@quickswapv4.xyz",
    contactTelegram: "@qsv4",
    status: "Rejected",
    internalScore: 3.8,
    teamScore: 3,
    productScore: 5,
    tokenomicsScore: 2,
    tractionScore: 5,
    description: "Fork of Uniswap V4 with minor UI changes. Anonymous team claiming to be ex-QuickSwap but unverifiable.",
    website: "https://quickswapv4.xyz",
    tokenName: "QSV4",
    ticker: "QSV4",
    chain: "Polygon",
    notes: [
      {
        author: "Sarah K.",
        text: "Unable to verify team identity. Product is a straight fork with no meaningful innovation.",
        date: "2026-01-24T14:00:00Z",
      },
      {
        author: "James L.",
        text: "Potential trademark issues with QuickSwap branding. Rejecting.",
        date: "2026-01-25T10:00:00Z",
      },
    ],
  },
  {
    id: "app-6",
    projectName: "SolBridge",
    category: "Infrastructure",
    targetRaise: 4_000_000,
    submittedDate: "2026-02-11",
    applicantWallet: "0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    contactEmail: "contact@solbridge.network",
    contactTelegram: "@solbridge",
    status: "Changes Requested",
    internalScore: 6.0,
    teamScore: 7,
    productScore: 6,
    tokenomicsScore: 5,
    tractionScore: 6,
    description: "Cross-chain bridge connecting Solana ecosystem to EVM chains with zk-proof verification. Testnet live with 2,000 users.",
    website: "https://solbridge.network",
    tokenName: "SBRIDGE",
    ticker: "SBR",
    chain: "Base",
    notes: [
      {
        author: "Mike T.",
        text: "Audit not yet completed. Requested completion of Certik audit before proceeding.",
        date: "2026-02-11T16:00:00Z",
      },
    ],
  },
];

const statusCounts = {
  all: applications.length,
  pending: applications.filter((a) => a.status === "Pending").length,
  dd: applications.filter((a) => a.status === "Under DD").length,
  approved: applications.filter((a) => a.status === "Approved").length,
  rejected: applications.filter((a) => a.status === "Rejected").length,
};

const statusVariant: Record<string, "default" | "info" | "success" | "warning" | "error" | "outline"> = {
  Pending: "warning",
  "Under DD": "info",
  Approved: "success",
  Rejected: "error",
  "Changes Requested": "outline",
};

/* -------------------------------------------------------------------------- */
/*  Score bar component                                                       */
/* -------------------------------------------------------------------------- */

function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = (score / 10) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="text-xs font-medium text-zinc-300">{score}/10</span>
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
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ApplicationReviewPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");

  const filtered = applications.filter((app) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return app.status === "Pending";
    if (activeTab === "dd") return app.status === "Under DD";
    if (activeTab === "approved") return app.status === "Approved";
    if (activeTab === "rejected") return app.status === "Rejected";
    return true;
  });

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
            {filtered.map((app) => {
              const isExpanded = expandedId === app.id;
              const avgScore =
                app.internalScore ??
                (app.teamScore + app.productScore + app.tokenomicsScore + app.tractionScore > 0
                  ? (app.teamScore + app.productScore + app.tokenomicsScore + app.tractionScore) / 4
                  : null);

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
                        <Badge variant={statusVariant[app.status]}>{app.status}</Badge>
                        <Badge variant="outline">{app.category}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                        <span>Target: {formatCurrency(app.targetRaise)}</span>
                        <span>Submitted: {formatDate(app.submittedDate)}</span>
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
                        <Button size="sm" variant="secondary">
                          Review
                        </Button>
                        {app.status === "Pending" && (
                          <Button size="sm" variant="secondary">Score</Button>
                        )}
                        {(app.status === "Pending" || app.status === "Under DD") && (
                          <>
                            <Button size="sm">Approve</Button>
                            <Button size="sm" variant="destructive">
                              Reject
                            </Button>
                          </>
                        )}
                        {app.status !== "Changes Requested" &&
                          app.status !== "Approved" &&
                          app.status !== "Rejected" && (
                            <Button size="sm" variant="outline">
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
                                {app.tokenName} ({app.ticker})
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
                                href={app.website}
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
                                {app.contactTelegram}
                              </p>
                            </div>
                          </div>

                          {/* Scoring */}
                          <div>
                            <h4 className="mb-3 text-sm font-semibold text-zinc-300">
                              Internal Scoring
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <ScoreBar score={app.teamScore} label="Team" />
                              <ScoreBar score={app.productScore} label="Product" />
                              <ScoreBar score={app.tokenomicsScore} label="Tokenomics" />
                              <ScoreBar score={app.tractionScore} label="Traction" />
                            </div>
                          </div>

                          {/* Action with reason */}
                          <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
                            <label className="text-sm font-medium text-zinc-300">
                              Action Notes / Reason
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Add notes or reason for your decision..."
                              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                            />
                            <div className="flex items-center gap-2">
                              <Button size="sm">Approve</Button>
                              <Button size="sm" variant="destructive">Reject</Button>
                              <Button size="sm" variant="outline">Request Changes</Button>
                            </div>
                          </div>
                        </div>

                        {/* Right: Notes feed */}
                        <div className="flex flex-col gap-4">
                          <h4 className="text-sm font-semibold text-zinc-300">
                            Internal Notes
                          </h4>

                          {/* Add note */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a note..."
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              leftIcon={<Send className="h-3.5 w-3.5" />}
                              onClick={() => setNewNote("")}
                            >
                              Send
                            </Button>
                          </div>

                          {/* Notes list */}
                          <div className="flex flex-col gap-3">
                            {app.notes.length === 0 && (
                              <p className="text-sm text-zinc-600">
                                No notes yet
                              </p>
                            )}
                            {app.notes.map((note, i) => (
                              <div
                                key={i}
                                className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3"
                              >
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-xs font-medium text-violet-400">
                                    {note.author}
                                  </span>
                                  <span className="text-xs text-zinc-600">
                                    {formatDate(note.date)}
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-400">
                                  {note.text}
                                </p>
                              </div>
                            ))}
                          </div>
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
