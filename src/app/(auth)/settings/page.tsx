"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  RefreshCw,
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
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils/cn";
import { formatAddress, formatDate } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiWallet {
  id: string;
  address: string;
  chain: "ETHEREUM" | "BASE" | "ARBITRUM";
  isPrimary: boolean;
  linkedAt: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  dealAlerts: boolean;
  vestingAlerts: boolean;
  accountAlerts: boolean;
  marketingEmails: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  digestMode: "immediate" | "daily" | "weekly";
}

interface UserProfile {
  id: string;
  walletAddress: string;
  displayName: string | null;
  email: string | null;
  role: string;
  kycStatus: string;
  kycTier: string | null;
  kycApprovedAt: string | null;
  tierLevel: string;
  referralCode: string | null;
  avatarUrl: string | null;
  createdAt: string;
  wallets: ApiWallet[];
}

interface SessionEntry {
  id: string;
  device: string;
  deviceIcon: "desktop" | "mobile";
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

// Sessions are still placeholder until a sessions API exists
const SESSIONS: SessionEntry[] = [
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

// ---------------------------------------------------------------------------
// Chain display helpers
// ---------------------------------------------------------------------------

const CHAIN_LABELS: Record<string, string> = {
  ETHEREUM: "Ethereum",
  BASE: "Base",
  ARBITRUM: "Arbitrum",
};

const CHAIN_COLORS: Record<string, string> = {
  ETHEREUM: "text-sky-400",
  BASE: "text-blue-400",
  ARBITRUM: "text-orange-400",
};

// ---------------------------------------------------------------------------
// Digest mode options
// ---------------------------------------------------------------------------

const DIGEST_OPTIONS = [
  { value: "immediate", label: "Immediate -- send notifications in real time" },
  { value: "daily", label: "Daily Digest -- one email per day" },
  { value: "weekly", label: "Weekly Digest -- one email per week" },
];

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" className="h-16 w-16" />
        <Skeleton variant="text" className="h-8 w-32" />
      </div>
      <Skeleton variant="rect" className="h-10 w-full" />
      <Skeleton variant="rect" className="h-10 w-full" />
      <Skeleton variant="rect" className="h-10 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Wallet state
  const [wallets, setWallets] = useState<ApiWallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [unlinkingWalletId, setUnlinkingWalletId] = useState<string | null>(null);
  const [linkingWallet, setLinkingWallet] = useState(false);

  // Notification preferences state
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    dealAlerts: true,
    vestingAlerts: true,
    accountAlerts: true,
    marketingEmails: false,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    digestMode: "immediate",
  });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Security state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch user profile from GET /api/users/me
  // -------------------------------------------------------------------------

  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);

      const res = await fetch("/api/users/me");
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load profile");
      }

      const user = json.data.user;
      setProfile(user);
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");

      // Also populate wallets from the user profile response
      if (user.wallets) {
        setWallets(user.wallets);
        setWalletsLoading(false);
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Fetch linked wallets (standalone refresh)
  // -------------------------------------------------------------------------

  const fetchWallets = useCallback(async () => {
    try {
      setWalletsLoading(true);
      setWalletError(null);
      const res = await fetch("/api/users/me/wallets");
      const json = await res.json();
      if (json.success) {
        setWallets(json.data.wallets);
      } else {
        setWalletError(json.error?.message || "Failed to load wallets");
      }
    } catch {
      setWalletError("Failed to load wallets");
    } finally {
      setWalletsLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Fetch notification preferences
  // -------------------------------------------------------------------------

  const fetchPreferences = useCallback(async () => {
    try {
      setPrefsLoading(true);
      const res = await fetch("/api/users/me/preferences");
      const json = await res.json();
      if (json.success) {
        setPreferences(json.data.preferences);
      }
    } catch {
      // Keep defaults on error
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
  }, [fetchProfile, fetchPreferences]);

  // -------------------------------------------------------------------------
  // Save profile handler — PATCH /api/users/me
  // -------------------------------------------------------------------------

  async function handleSaveProfile() {
    try {
      setProfileSaving(true);
      setProfileMessage(null);

      const body: Record<string, string | null> = {};
      if (displayName !== (profile?.displayName || "")) {
        body.displayName = displayName;
      }
      if (email !== (profile?.email || "")) {
        body.email = email || null;
      }

      // Only call API if there are changes
      if (Object.keys(body).length === 0) {
        setProfileMessage("No changes to save");
        setTimeout(() => setProfileMessage(null), 3000);
        return;
      }

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to save profile");
      }

      // Update local profile state
      const updated = json.data.user;
      setProfile(updated);
      setDisplayName(updated.displayName || "");
      setEmail(updated.email || "");
      setProfileMessage("Profile saved successfully");
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      setProfileMessage(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Unlink wallet handler
  // -------------------------------------------------------------------------

  async function handleUnlinkWallet(walletId: string) {
    try {
      setUnlinkingWalletId(walletId);
      setWalletError(null);
      const res = await fetch("/api/users/me/wallets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId }),
      });
      const json = await res.json();
      if (json.success) {
        setWallets((prev) => prev.filter((w) => w.id !== walletId));
      } else {
        setWalletError(json.error?.message || "Failed to unlink wallet");
      }
    } catch {
      setWalletError("Failed to unlink wallet");
    } finally {
      setUnlinkingWalletId(null);
    }
  }

  // -------------------------------------------------------------------------
  // Link wallet handler (triggers wallet signature flow)
  // -------------------------------------------------------------------------

  async function handleLinkWallet() {
    // In a real implementation this would open a wallet connect modal,
    // request a signature, then POST to /api/users/me/wallets.
    // For now, we set a flag to indicate the flow is active.
    setLinkingWallet(true);
    setWalletError(null);

    // Placeholder: show a message that the wallet connection modal should appear
    setTimeout(() => {
      setLinkingWallet(false);
      setWalletError("Wallet connection UI not yet integrated. Use a web3 provider to sign and link.");
    }, 1500);
  }

  // -------------------------------------------------------------------------
  // Save notification preferences
  // -------------------------------------------------------------------------

  async function handleSavePreferences() {
    try {
      setPrefsSaving(true);
      setPrefsMessage(null);
      const res = await fetch("/api/users/me/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const json = await res.json();
      if (json.success) {
        setPrefsMessage("Preferences saved successfully");
        setTimeout(() => setPrefsMessage(null), 3000);
      } else {
        setPrefsMessage(json.error?.message || "Failed to save preferences");
      }
    } catch {
      setPrefsMessage("Failed to save preferences");
    } finally {
      setPrefsSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Export portfolio as CSV
  // -------------------------------------------------------------------------

  async function handleExportPortfolio() {
    try {
      setExporting(true);
      const res = await fetch("/api/users/me/portfolio/export?format=csv");
      if (!res.ok) {
        throw new Error("Export failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      link.download = filenameMatch?.[1] || `portfolio-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Could show an error toast here
    } finally {
      setExporting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Notification preference helpers
  // -------------------------------------------------------------------------

  function updatePreference<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  // -------------------------------------------------------------------------
  // KYC helpers
  // -------------------------------------------------------------------------

  const kycStatus = profile?.kycStatus || "NONE";

  function kycDisplayStatus(status: string): string {
    switch (status) {
      case "APPROVED":
        return "Approved";
      case "PENDING":
        return "Pending";
      case "REJECTED":
        return "Rejected";
      case "EXPIRED":
        return "Expired";
      default:
        return "Not Started";
    }
  }

  function kycBadgeVariant(status: string): "default" | "success" | "warning" | "error" | "info" | "outline" {
    switch (status) {
      case "APPROVED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
      case "EXPIRED":
        return "error";
      default:
        return "outline";
    }
  }

  function kycIcon(status: string) {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-amber-400" />;
      case "REJECTED":
      case "EXPIRED":
        return <XCircle className="h-5 w-5 text-rose-400" />;
      default:
        return <Shield className="h-5 w-5 text-zinc-400" />;
    }
  }

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const primaryWallet = profile?.walletAddress || wallets.find((w) => w.isPrimary)?.address || "";
  const kycDisplayLabel = kycDisplayStatus(kycStatus);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

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
              {profileLoading ? (
                <ProfileSkeleton />
              ) : profileError ? (
                <Alert variant="error">{profileError}</Alert>
              ) : (
                <>
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={profile?.avatarUrl ?? null}
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
                        {primaryWallet}
                      </code>
                    </div>
                  </div>

                  {/* Save status message */}
                  {profileMessage && (
                    <Alert
                      variant={
                        profileMessage.includes("success") || profileMessage.includes("No changes")
                          ? "success"
                          : "error"
                      }
                    >
                      {profileMessage}
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSaveProfile}
                disabled={profileSaving || profileLoading}
              >
                {profileSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchWallets}
                  disabled={walletsLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", walletsLoading && "animate-spin")} />
                </Button>
                <Button
                  size="sm"
                  leftIcon={<Link2 className="h-4 w-4" />}
                  onClick={handleLinkWallet}
                  disabled={linkingWallet}
                >
                  {linkingWallet ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Link New Wallet"
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {walletError && (
                <Alert variant="error">
                  {walletError}
                </Alert>
              )}

              {walletsLoading && wallets.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-zinc-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading wallets...
                </div>
              ) : wallets.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500">
                  No wallets linked yet. Link a wallet to get started.
                </div>
              ) : (
                wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                        <Wallet
                          className={cn(
                            "h-5 w-5",
                            CHAIN_COLORS[wallet.chain] || "text-zinc-400"
                          )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" size="sm">
                            {CHAIN_LABELS[wallet.chain] || wallet.chain}
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
                        <p className="text-xs text-zinc-600">
                          Linked {formatDate(wallet.linkedAt)}
                        </p>
                      </div>
                    </div>
                    {!wallet.isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-rose-400"
                        onClick={() => handleUnlinkWallet(wallet.id)}
                        disabled={unlinkingWalletId === wallet.id}
                      >
                        {unlinkingWalletId === wallet.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlink className="h-4 w-4" />
                        )}
                        {unlinkingWalletId === wallet.id ? "Unlinking..." : "Unlink"}
                      </Button>
                    )}
                  </div>
                ))
              )}
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
              {prefsLoading ? (
                <div className="flex items-center justify-center py-8 text-zinc-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading preferences...
                </div>
              ) : (
                <>
                  {/* Global Channel Toggles */}
                  <div className="space-y-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Notification Channels
                    </p>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          Email Notifications
                        </p>
                        <p className="text-xs text-zinc-500">
                          Receive notifications via email
                        </p>
                      </div>
                      <Toggle
                        checked={preferences.emailNotifications}
                        onCheckedChange={(v) =>
                          updatePreference("emailNotifications", v)
                        }
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          Push Notifications
                        </p>
                        <p className="text-xs text-zinc-500">
                          Receive browser push notifications
                        </p>
                      </div>
                      <Toggle
                        checked={preferences.pushNotifications}
                        onCheckedChange={(v) =>
                          updatePreference("pushNotifications", v)
                        }
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Category Toggles */}
                  <div className="space-y-4 border-t border-zinc-800 pt-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Notification Categories
                    </p>

                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          Deal Alerts
                        </p>
                        <p className="text-xs text-zinc-500">
                          New deal listings, opening announcements, and closing
                          reminders
                        </p>
                      </div>
                      <Toggle
                        checked={preferences.dealAlerts}
                        onCheckedChange={(v) =>
                          updatePreference("dealAlerts", v)
                        }
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          Vesting Alerts
                        </p>
                        <p className="text-xs text-zinc-500">
                          Token unlock notifications and claim reminders
                        </p>
                      </div>
                      <Toggle
                        checked={preferences.vestingAlerts}
                        onCheckedChange={(v) =>
                          updatePreference("vestingAlerts", v)
                        }
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          Account Alerts
                        </p>
                        <p className="text-xs text-zinc-500">
                          Contributions, stakes, claims, and security events
                        </p>
                      </div>
                      <Toggle
                        checked={preferences.accountAlerts}
                        onCheckedChange={(v) =>
                          updatePreference("accountAlerts", v)
                        }
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          Marketing Emails
                        </p>
                        <p className="text-xs text-zinc-500">
                          Product updates, newsletters, and promotional content
                        </p>
                      </div>
                      <Toggle
                        checked={preferences.marketingEmails}
                        onCheckedChange={(v) =>
                          updatePreference("marketingEmails", v)
                        }
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Digest Mode Selector */}
                  <div className="border-t border-zinc-800 pt-6">
                    <Select
                      label="Digest Mode"
                      value={preferences.digestMode}
                      onChange={(e) =>
                        updatePreference(
                          "digestMode",
                          e.target.value as "immediate" | "daily" | "weekly"
                        )
                      }
                      options={DIGEST_OPTIONS}
                      helperText="Control how frequently you receive notification emails"
                    />
                  </div>

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
                        checked={preferences.quietHoursEnabled}
                        onCheckedChange={(v) =>
                          updatePreference("quietHoursEnabled", v)
                        }
                        size="sm"
                      />
                    </div>
                    {preferences.quietHoursEnabled && (
                      <div className="mt-4 flex items-center gap-3">
                        <Input
                          type="time"
                          value={preferences.quietHoursStart}
                          onChange={(e) =>
                            updatePreference("quietHoursStart", e.target.value)
                          }
                          className="w-32"
                        />
                        <span className="text-sm text-zinc-500">to</span>
                        <Input
                          type="time"
                          value={preferences.quietHoursEnd}
                          onChange={(e) =>
                            updatePreference("quietHoursEnd", e.target.value)
                          }
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>

                  {/* Save status message */}
                  {prefsMessage && (
                    <Alert
                      variant={
                        prefsMessage.includes("success") ? "success" : "error"
                      }
                    >
                      {prefsMessage}
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSavePreferences}
                disabled={prefsSaving || prefsLoading}
              >
                {prefsSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
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
                    {kycIcon(kycStatus)}
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        Verification Status
                      </p>
                      <p className="text-xs text-zinc-500">
                        {kycStatus === "APPROVED"
                          ? "Your identity has been verified successfully"
                          : kycStatus === "PENDING"
                          ? "Your documents are being reviewed"
                          : kycStatus === "REJECTED"
                          ? "Your verification was rejected. Please resubmit."
                          : kycStatus === "EXPIRED"
                          ? "Your verification has expired. Please re-verify."
                          : "Complete KYC to access regulated deals"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={kycBadgeVariant(kycStatus)}
                      size="md"
                    >
                      {kycDisplayLabel}
                    </Badge>
                    {kycStatus !== "APPROVED" && kycStatus !== "PENDING" && (
                      <Button size="sm">
                        {kycStatus === "REJECTED" || kycStatus === "EXPIRED"
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
                {/* Export Portfolio CSV */}
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Export Portfolio
                    </p>
                    <p className="text-xs text-zinc-500">
                      Download your portfolio as a CSV file with all
                      contributions, allocations, and PnL data
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={
                      exporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )
                    }
                    onClick={handleExportPortfolio}
                    disabled={exporting}
                  >
                    {exporting ? "Exporting..." : "Export CSV"}
                  </Button>
                </div>

                {/* Export All Data */}
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
