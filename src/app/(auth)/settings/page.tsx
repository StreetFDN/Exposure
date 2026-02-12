"use client";

import { useState } from "react";
import {
  User,
  Wallet,
  Bell,
  Shield,
  Camera,
  Link2,
  Unlink,
  Monitor,
  Smartphone,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { formatAddress, formatDate } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Placeholder Data
// ---------------------------------------------------------------------------

const PROFILE = {
  displayName: "cryptowhale.eth",
  email: "whale@proton.me",
  avatar: null as string | null,
  walletAddress: "0x7a3B1c2D8e5F6a9B0c1D2e3F4a5B6c7D8e9f4E",
};

interface LinkedWallet {
  id: string;
  chain: string;
  chainColor: string;
  address: string;
  isPrimary: boolean;
}

const LINKED_WALLETS: LinkedWallet[] = [
  {
    id: "1",
    chain: "Ethereum",
    chainColor: "text-sky-400",
    address: "0x7a3B1c2D8e5F6a9B0c1D2e3F4a5B6c7D8e9f4E",
    isPrimary: true,
  },
  {
    id: "2",
    chain: "Arbitrum",
    chainColor: "text-blue-400",
    address: "0x9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8D",
    isPrimary: false,
  },
  {
    id: "3",
    chain: "Solana",
    chainColor: "text-violet-400",
    address: "7K9pDQ...vRmNx",
    isPrimary: false,
  },
];

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  inApp: boolean;
  push: boolean;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: "deal_alerts",
    label: "Deal Alerts",
    description: "New deal listings, opening announcements, and closing reminders",
    email: true,
    inApp: true,
    push: true,
  },
  {
    id: "vesting_updates",
    label: "Vesting Updates",
    description: "Token unlock notifications and claim reminders",
    email: true,
    inApp: true,
    push: false,
  },
  {
    id: "account_activity",
    label: "Account Activity",
    description: "Contributions, stakes, claims, and security events",
    email: true,
    inApp: true,
    push: true,
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Product updates, newsletters, and promotional content",
    email: false,
    inApp: false,
    push: false,
  },
];

interface Session {
  id: string;
  device: string;
  deviceIcon: "desktop" | "mobile";
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const SESSIONS: Session[] = [
  {
    id: "1",
    device: "Windows PC",
    deviceIcon: "desktop",
    browser: "Chrome 121",
    ip: "192.168.1.***",
    location: "New York, US",
    lastActive: "2026-02-12T10:30:00",
    isCurrent: true,
  },
  {
    id: "2",
    device: "iPhone 15 Pro",
    deviceIcon: "mobile",
    browser: "Safari 17",
    ip: "10.0.0.***",
    location: "New York, US",
    lastActive: "2026-02-11T18:45:00",
    isCurrent: false,
  },
  {
    id: "3",
    device: "MacBook Pro",
    deviceIcon: "desktop",
    browser: "Firefox 122",
    ip: "172.16.0.***",
    location: "San Francisco, US",
    lastActive: "2026-02-09T14:20:00",
    isCurrent: false,
  },
];

const KYC_STATUS = "Approved" as "Approved" | "Pending" | "Not Started" | "Rejected";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState(PROFILE.displayName);
  const [email, setEmail] = useState(PROFILE.email);
  const [notifications, setNotifications] = useState(NOTIFICATION_SETTINGS);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("08:00");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function updateNotification(
    id: string,
    channel: "email" | "inApp" | "push",
    value: boolean
  ) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, [channel]: value } : n))
    );
  }

  function kycBadgeVariant(status: string) {
    switch (status) {
      case "Approved":
        return "success";
      case "Pending":
        return "warning";
      case "Rejected":
        return "error";
      default:
        return "outline";
    }
  }

  function kycIcon(status: string) {
    switch (status) {
      case "Approved":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case "Pending":
        return <Clock className="h-5 w-5 text-amber-400" />;
      case "Rejected":
        return <XCircle className="h-5 w-5 text-rose-400" />;
      default:
        return <Shield className="h-5 w-5 text-zinc-400" />;
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your account, wallets, notifications, and security.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> Profile
            </span>
          </TabsTrigger>
          <TabsTrigger value="wallets">
            <span className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4" /> Wallets
            </span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <span className="flex items-center gap-1.5">
              <Bell className="h-4 w-4" /> Notifications
            </span>
          </TabsTrigger>
          <TabsTrigger value="security">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Security
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* PROFILE TAB                                                       */}
        {/* ================================================================ */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your display name and contact preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar
                  src={PROFILE.avatar}
                  alt={displayName}
                  size="xl"
                />
                <div className="space-y-1">
                  <Button variant="secondary" size="sm">
                    <Camera className="h-4 w-4" />
                    Upload Avatar
                  </Button>
                  <p className="text-xs text-zinc-500">
                    JPG, PNG, or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              {/* Display Name */}
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
              />

              {/* Email */}
              <Input
                label="Email (optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                helperText="Used for email notifications only. Never shared."
              />

              {/* Wallet Address (read-only) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300">
                  Primary Wallet
                </label>
                <div className="flex h-10 items-center rounded-lg border border-zinc-800 bg-zinc-950 px-3">
                  <code className="text-sm text-zinc-400">
                    {PROFILE.walletAddress}
                  </code>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* WALLETS TAB                                                       */}
        {/* ================================================================ */}
        <TabsContent value="wallets">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Linked Wallets</CardTitle>
                <CardDescription>
                  Manage your connected wallets across chains
                </CardDescription>
              </div>
              <Button size="sm" leftIcon={<Link2 className="h-4 w-4" />}>
                Link New Wallet
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {LINKED_WALLETS.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                      <Wallet className={cn("h-5 w-5", wallet.chainColor)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" size="sm">
                          {wallet.chain}
                        </Badge>
                        {wallet.isPrimary && (
                          <Badge variant="success" size="sm">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-sm text-zinc-300">
                        {formatAddress(wallet.address, 8)}
                      </p>
                    </div>
                  </div>
                  {!wallet.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-rose-400"
                    >
                      <Unlink className="h-4 w-4" />
                      Unlink
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* NOTIFICATIONS TAB                                                 */}
        {/* ================================================================ */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what you want to be notified about and how
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Header row for channels */}
              <div className="grid grid-cols-[1fr_80px_80px_80px] items-center gap-4">
                <span />
                <span className="text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Email
                </span>
                <span className="text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                  In-App
                </span>
                <span className="text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Push
                </span>
              </div>

              {notifications.map((setting) => (
                <div
                  key={setting.id}
                  className="grid grid-cols-[1fr_80px_80px_80px] items-center gap-4 border-t border-zinc-800 pt-4"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {setting.label}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {setting.description}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Toggle
                      checked={setting.email}
                      onCheckedChange={(v) =>
                        updateNotification(setting.id, "email", v)
                      }
                      size="sm"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Toggle
                      checked={setting.inApp}
                      onCheckedChange={(v) =>
                        updateNotification(setting.id, "inApp", v)
                      }
                      size="sm"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Toggle
                      checked={setting.push}
                      onCheckedChange={(v) =>
                        updateNotification(setting.id, "push", v)
                      }
                      size="sm"
                    />
                  </div>
                </div>
              ))}

              {/* Quiet Hours */}
              <div className="border-t border-zinc-800 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Quiet Hours
                    </p>
                    <p className="text-xs text-zinc-500">
                      Pause non-critical notifications during specified hours
                    </p>
                  </div>
                  <Toggle
                    checked={quietHoursEnabled}
                    onCheckedChange={setQuietHoursEnabled}
                    size="sm"
                  />
                </div>
                {quietHoursEnabled && (
                  <div className="mt-4 flex items-center gap-3">
                    <Input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-zinc-500">to</span>
                    <Input
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* SECURITY TAB                                                      */}
        {/* ================================================================ */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* KYC Status */}
            <Card>
              <CardHeader>
                <CardTitle>KYC Verification</CardTitle>
                <CardDescription>
                  Identity verification status for regulated deal access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                  <div className="flex items-center gap-3">
                    {kycIcon(KYC_STATUS)}
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        Verification Status
                      </p>
                      <p className="text-xs text-zinc-500">
                        {KYC_STATUS === "Approved"
                          ? "Your identity has been verified successfully"
                          : KYC_STATUS === "Pending"
                          ? "Your documents are being reviewed"
                          : KYC_STATUS === "Rejected"
                          ? "Your verification was rejected. Please resubmit."
                          : "Complete KYC to access regulated deals"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={kycBadgeVariant(KYC_STATUS) as any}
                      size="md"
                    >
                      {KYC_STATUS}
                    </Badge>
                    {KYC_STATUS !== "Approved" && KYC_STATUS !== "Pending" && (
                      <Button size="sm">
                        {KYC_STATUS === "Rejected"
                          ? "Resubmit"
                          : "Complete KYC"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Devices currently logged into your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SESSIONS.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-4",
                      session.isCurrent
                        ? "border-violet-500/30 bg-violet-500/5"
                        : "border-zinc-800 bg-zinc-950/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                        {session.deviceIcon === "desktop" ? (
                          <Monitor className="h-5 w-5 text-zinc-400" />
                        ) : (
                          <Smartphone className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-200">
                            {session.device}
                          </p>
                          {session.isCurrent && (
                            <Badge variant="success" size="sm">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">
                          {session.browser} -- {session.ip} --{" "}
                          {session.location}
                        </p>
                        <p className="text-xs text-zinc-600">
                          Last active:{" "}
                          {formatDate(session.lastActive, { includeTime: true })}
                        </p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-rose-400"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Data & Account Management */}
            <Card>
              <CardHeader>
                <CardTitle>Data & Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Export Data */}
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Export My Data
                    </p>
                    <p className="text-xs text-zinc-500">
                      Download a copy of all your account data, contributions,
                      and activity
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Export
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
                  <div>
                    <p className="text-sm font-medium text-rose-300">
                      Delete Account
                    </p>
                    <p className="text-xs text-rose-400/60">
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>
                  </div>
                  {!showDeleteConfirm ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete Account
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm">
                        <AlertTriangle className="h-4 w-4" />
                        Confirm Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
