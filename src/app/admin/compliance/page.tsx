"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Shield,
  Search,
  FileWarning,
  Activity,
  ChevronDown,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Clock,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
/*  Flagged Transactions data                                                 */
/* -------------------------------------------------------------------------- */

const flaggedTransactions = [
  {
    id: "ft-1",
    wallet: "0x9876543210FeDcBa9876543210FeDcBa98765432",
    deal: "MetaVault",
    amount: 49_900,
    reason: "Structuring",
    severity: "High" as const,
    date: "2026-02-12T08:15:00Z",
    status: "Open",
  },
  {
    id: "ft-2",
    wallet: "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01",
    deal: "Nexus Protocol",
    amount: 250_000,
    reason: "Unusual Volume",
    severity: "High" as const,
    date: "2026-02-11T22:30:00Z",
    status: "Open",
  },
  {
    id: "ft-3",
    wallet: "0x1111222233334444555566667777888899990000",
    deal: "ZeroLayer",
    amount: 15_000,
    reason: "Sanctioned Jurisdiction",
    severity: "High" as const,
    date: "2026-02-11T14:00:00Z",
    status: "Under Review",
  },
  {
    id: "ft-4",
    wallet: "0xAAAABBBBCCCCDDDD1111222233334444AAAABBBB",
    deal: "Prism Finance",
    amount: 9_999,
    reason: "Structuring",
    severity: "Medium" as const,
    date: "2026-02-10T16:45:00Z",
    status: "Open",
  },
  {
    id: "ft-5",
    wallet: "0x5555666677778888999900001111222233334444",
    deal: "Nexus Protocol",
    amount: 75_000,
    reason: "Velocity Alert",
    severity: "Medium" as const,
    date: "2026-02-10T10:20:00Z",
    status: "Resolved",
  },
  {
    id: "ft-6",
    wallet: "0xDDDDEEEEFFFF00001111222233334444EEEEFFFF",
    deal: "ZeroLayer",
    amount: 5_200,
    reason: "New Wallet Pattern",
    severity: "Low" as const,
    date: "2026-02-09T19:00:00Z",
    status: "Open",
  },
  {
    id: "ft-7",
    wallet: "0x8888999900001111AAAABBBBCCCCDDDDEEEE0000",
    deal: "MetaVault",
    amount: 12_500,
    reason: "Wallet Mixer Link",
    severity: "High" as const,
    date: "2026-02-09T08:00:00Z",
    status: "Escalated",
  },
  {
    id: "ft-8",
    wallet: "0x2222333344445555666677778888AAAA0000BBBB",
    deal: "Prism Finance",
    amount: 3_000,
    reason: "Multiple Wallets",
    severity: "Low" as const,
    date: "2026-02-08T14:30:00Z",
    status: "Resolved",
  },
  {
    id: "ft-9",
    wallet: "0xCCCCDDDDEEEE000011112222AAAA4444BBBB5555",
    deal: "Onchain Labs",
    amount: 28_000,
    reason: "Unusual Volume",
    severity: "Medium" as const,
    date: "2026-02-07T11:15:00Z",
    status: "Open",
  },
  {
    id: "ft-10",
    wallet: "0x6666777788889999AAAA0000BBBB1111CCCC2222",
    deal: "Nexus Protocol",
    amount: 100_000,
    reason: "PEP Match",
    severity: "High" as const,
    date: "2026-02-06T09:45:00Z",
    status: "Under Review",
  },
];

/* -------------------------------------------------------------------------- */
/*  KYC Queue data                                                            */
/* -------------------------------------------------------------------------- */

const kycQueue = [
  {
    id: "kyc-1",
    wallet: "0xF9e8D7c6B5a4F3E2d1C0b9A8f7E6d5C4b3A2f1E0",
    displayName: "TokenCollector",
    email: "tokens@yahoo.com",
    submittedDate: "2026-02-08T12:00:00Z",
    documentType: "Passport",
    country: "US",
  },
  {
    id: "kyc-2",
    wallet: "0xDDDDEEEEFFFF00001111222233334444555566667",
    displayName: "PassiveIncome",
    email: "passive@gmail.com",
    submittedDate: "2026-02-05T08:00:00Z",
    documentType: "Driver License",
    country: "UK",
  },
  {
    id: "kyc-3",
    wallet: "0x3333444455556666777788889999AAAABBBBCCCC",
    displayName: "CryptoNomad",
    email: "nomad@proton.me",
    submittedDate: "2026-02-04T16:30:00Z",
    documentType: "National ID",
    country: "DE",
  },
  {
    id: "kyc-4",
    wallet: "0xEEEEFFFF00001111222233334444555566667777",
    displayName: "BlockBuilder",
    email: "builder@gmail.com",
    submittedDate: "2026-02-03T10:00:00Z",
    documentType: "Passport",
    country: "SG",
  },
  {
    id: "kyc-5",
    wallet: "0x0000111122223333AAAABBBBCCCCDDDDEEEEFFFF",
    displayName: "InvestNow",
    email: "invest@outlook.com",
    submittedDate: "2026-02-02T14:00:00Z",
    documentType: "Passport",
    country: "JP",
  },
];

/* -------------------------------------------------------------------------- */
/*  Sanctions alerts data                                                     */
/* -------------------------------------------------------------------------- */

const sanctionsAlerts = [
  {
    id: "sa-1",
    wallet: "0x9876543210FeDcBa9876543210FeDcBa98765432",
    matchedEntity: "OFAC SDN — Lazarus Group Linked Address",
    confidence: 94,
    status: "Confirmed",
    date: "2026-01-20T09:00:00Z",
  },
  {
    id: "sa-2",
    wallet: "0x1111222233334444555566667777888899990000",
    matchedEntity: "EU Sanctions List — Iranian Entity Alpha",
    confidence: 72,
    status: "Pending Review",
    date: "2026-02-11T14:00:00Z",
  },
  {
    id: "sa-3",
    wallet: "0x6666777788889999AAAA0000BBBB1111CCCC2222",
    matchedEntity: "UN Consolidated List — PEP Associate (Russia)",
    confidence: 58,
    status: "Pending Review",
    date: "2026-02-06T09:45:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/*  Audit log data                                                            */
/* -------------------------------------------------------------------------- */

const auditLog = [
  { id: "al-1", timestamp: "2026-02-12T11:45:00Z", user: "sarah@exposure.io", action: "user.ban", resource: "user:0x9876...5432", ip: "192.168.1.42", details: '{"reason":"Sanctions match confirmed","flagId":"ft-1"}' },
  { id: "al-2", timestamp: "2026-02-12T11:30:00Z", user: "sarah@exposure.io", action: "flag.review", resource: "flag:ft-2", ip: "192.168.1.42", details: '{"status":"Under Review","notes":"Large contribution needs additional verification"}' },
  { id: "al-3", timestamp: "2026-02-12T10:15:00Z", user: "mike@exposure.io", action: "kyc.approve", resource: "kyc:kyc-1", ip: "10.0.0.15", details: '{"documentType":"Passport","country":"US"}' },
  { id: "al-4", timestamp: "2026-02-12T09:00:00Z", user: "system", action: "flag.create", resource: "flag:ft-1", ip: "internal", details: '{"reason":"Structuring","severity":"High","amount":49900}' },
  { id: "al-5", timestamp: "2026-02-11T22:35:00Z", user: "system", action: "flag.create", resource: "flag:ft-2", ip: "internal", details: '{"reason":"Unusual Volume","severity":"High","amount":250000}' },
  { id: "al-6", timestamp: "2026-02-11T16:00:00Z", user: "mike@exposure.io", action: "application.review", resource: "app:app-6", ip: "10.0.0.15", details: '{"action":"Request Changes","reason":"Audit not completed"}' },
  { id: "al-7", timestamp: "2026-02-11T14:05:00Z", user: "system", action: "sanctions.alert", resource: "sa:sa-2", ip: "internal", details: '{"matchedEntity":"EU Sanctions List","confidence":72}' },
  { id: "al-8", timestamp: "2026-02-11T12:00:00Z", user: "sarah@exposure.io", action: "deal.pause", resource: "deal:metavault", ip: "192.168.1.42", details: '{"reason":"Compliance review pending"}' },
  { id: "al-9", timestamp: "2026-02-10T16:50:00Z", user: "system", action: "flag.create", resource: "flag:ft-4", ip: "internal", details: '{"reason":"Structuring","severity":"Medium","amount":9999}' },
  { id: "al-10", timestamp: "2026-02-10T14:00:00Z", user: "sarah@exposure.io", action: "flag.resolve", resource: "flag:ft-5", ip: "192.168.1.42", details: '{"resolution":"False positive — known institutional wallet"}' },
  { id: "al-11", timestamp: "2026-02-10T10:25:00Z", user: "system", action: "flag.create", resource: "flag:ft-5", ip: "internal", details: '{"reason":"Velocity Alert","severity":"Medium","amount":75000}' },
  { id: "al-12", timestamp: "2026-02-09T19:05:00Z", user: "system", action: "flag.create", resource: "flag:ft-6", ip: "internal", details: '{"reason":"New Wallet Pattern","severity":"Low","amount":5200}' },
  { id: "al-13", timestamp: "2026-02-09T08:10:00Z", user: "system", action: "flag.create", resource: "flag:ft-7", ip: "internal", details: '{"reason":"Wallet Mixer Link","severity":"High","amount":12500}' },
  { id: "al-14", timestamp: "2026-02-08T14:35:00Z", user: "mike@exposure.io", action: "flag.resolve", resource: "flag:ft-8", ip: "10.0.0.15", details: '{"resolution":"Multiple wallets from same user, verified via KYC"}' },
  { id: "al-15", timestamp: "2026-02-08T11:00:00Z", user: "sarah@exposure.io", action: "deal.create", resource: "deal:synapse-ai", ip: "192.168.1.42", details: '{"status":"Draft","category":"AI"}' },
  { id: "al-16", timestamp: "2026-02-07T11:20:00Z", user: "system", action: "flag.create", resource: "flag:ft-9", ip: "internal", details: '{"reason":"Unusual Volume","severity":"Medium","amount":28000}' },
  { id: "al-17", timestamp: "2026-02-06T10:00:00Z", user: "system", action: "sanctions.alert", resource: "sa:sa-3", ip: "internal", details: '{"matchedEntity":"UN PEP Associate","confidence":58}' },
  { id: "al-18", timestamp: "2026-02-05T08:05:00Z", user: "system", action: "kyc.submit", resource: "kyc:kyc-2", ip: "internal", details: '{"documentType":"Driver License","country":"UK"}' },
  { id: "al-19", timestamp: "2026-02-02T11:30:00Z", user: "james@exposure.io", action: "application.approve", resource: "app:app-4", ip: "172.16.0.8", details: '{"projectName":"NeuralDAO","legal":"Approved"}' },
  { id: "al-20", timestamp: "2026-01-25T10:00:00Z", user: "sarah@exposure.io", action: "application.reject", resource: "app:app-5", ip: "192.168.1.42", details: '{"projectName":"QuickSwap V4","reason":"Unverifiable team, trademark issues"}' },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const severityVariant: Record<string, "error" | "warning" | "info"> = {
  High: "error",
  Medium: "warning",
  Low: "info",
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ComplianceDashboardPage() {
  const [activeTab, setActiveTab] = useState("flagged");
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");

  const openFlags = flaggedTransactions.filter(
    (f) => f.status === "Open" || f.status === "Under Review" || f.status === "Escalated"
  ).length;
  const resolvedToday = flaggedTransactions.filter(
    (f) => f.status === "Resolved"
  ).length;
  const highSeverity = flaggedTransactions.filter(
    (f) => f.severity === "High" && f.status !== "Resolved"
  ).length;
  const pendingSar = flaggedTransactions.filter(
    (f) => f.status === "Escalated"
  ).length;

  const filteredAuditLog = auditLog.filter((entry) => {
    if (
      auditSearch &&
      !entry.user.toLowerCase().includes(auditSearch.toLowerCase()) &&
      !entry.action.toLowerCase().includes(auditSearch.toLowerCase()) &&
      !entry.resource.toLowerCase().includes(auditSearch.toLowerCase())
    )
      return false;
    if (auditActionFilter && !entry.action.startsWith(auditActionFilter))
      return false;
    return true;
  });

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
          value={openFlags}
          icon={<Flag className="h-5 w-5" />}
        />
        <StatCard
          label="Resolved Today"
          value={resolvedToday}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Pending SAR"
          value={pendingSar}
          icon={<FileWarning className="h-5 w-5" />}
        />
        <StatCard
          label="High Severity"
          value={highSeverity}
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

        {/* Flagged Transactions */}
        <TabsContent value="flagged">
          <div className="overflow-hidden rounded-xl border border-zinc-800">
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
                {flaggedTransactions.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <span className="font-mono text-xs text-zinc-400">
                        {formatAddress(flag.wallet)}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-200">{flag.deal}</TableCell>
                    <TableCell className="font-medium text-zinc-50">
                      {formatCurrency(flag.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{flag.reason}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityVariant[flag.severity]}>
                        {flag.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-sm",
                          flag.status === "Open" && "text-amber-400",
                          flag.status === "Under Review" && "text-sky-400",
                          flag.status === "Escalated" && "text-rose-400",
                          flag.status === "Resolved" && "text-emerald-400"
                        )}
                      >
                        {flag.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {formatDate(flag.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* KYC Queue */}
        <TabsContent value="kyc">
          <div className="flex flex-col gap-4">
            {kycQueue.map((kyc) => (
              <Card key={kyc.id}>
                <div className="flex items-center justify-between p-5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-zinc-50">
                        {kyc.displayName}
                      </span>
                      <Badge variant="outline">{kyc.documentType}</Badge>
                      <Badge variant="info">{kyc.country}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span className="font-mono text-xs">
                        {formatAddress(kyc.wallet)}
                      </span>
                      <span>{kyc.email}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Submitted {formatDate(kyc.submittedDate)}
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
        </TabsContent>

        {/* Sanctions Alerts */}
        <TabsContent value="sanctions">
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Wallet</TableHead>
                  <TableHead>Matched Entity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sanctionsAlerts.map((sa) => (
                  <TableRow key={sa.id}>
                    <TableCell>
                      <span className="font-mono text-xs text-zinc-400">
                        {formatAddress(sa.wallet)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs text-zinc-200">
                      {sa.matchedEntity}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              sa.confidence >= 80
                                ? "bg-rose-500"
                                : sa.confidence >= 50
                                  ? "bg-amber-500"
                                  : "bg-sky-500"
                            )}
                            style={{ width: `${sa.confidence}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            sa.confidence >= 80
                              ? "text-rose-400"
                              : sa.confidence >= 50
                                ? "text-amber-400"
                                : "text-sky-400"
                          )}
                        >
                          {sa.confidence}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sa.status === "Confirmed"
                            ? "error"
                            : sa.status === "Pending Review"
                              ? "warning"
                              : "success"
                        }
                      >
                        {sa.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {formatDate(sa.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="secondary">
                          Review
                        </Button>
                        <Button size="sm" variant="destructive">
                          Ban Wallet
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Audit Log */}
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
                  { value: "flag", label: "Flag Events" },
                  { value: "kyc", label: "KYC Events" },
                  { value: "user", label: "User Events" },
                  { value: "deal", label: "Deal Events" },
                  { value: "application", label: "Application Events" },
                  { value: "sanctions", label: "Sanctions Events" },
                ]}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-800">
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
                {filteredAuditLog.map((entry) => {
                  const isExpanded = expandedAuditId === entry.id;
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
                          {formatDate(entry.timestamp)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "text-sm",
                              entry.user === "system"
                                ? "text-zinc-500 italic"
                                : "text-zinc-200"
                            )}
                          >
                            {entry.user}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.action.includes("create") || entry.action.includes("submit")
                                ? "info"
                                : entry.action.includes("approve") || entry.action.includes("resolve")
                                  ? "success"
                                  : entry.action.includes("reject") || entry.action.includes("ban")
                                    ? "error"
                                    : entry.action.includes("alert") || entry.action.includes("pause")
                                      ? "warning"
                                      : "outline"
                            }
                          >
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-400">
                          {entry.resource}
                        </TableCell>
                        <TableCell className="text-zinc-500 text-xs">
                          {entry.ip}
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
                                {JSON.stringify(
                                  JSON.parse(entry.details),
                                  null,
                                  2
                                )}
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
