"use client";

import { useState, useEffect, useCallback } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
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
];

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CHAIN_LABELS: Record<string, string> = {
  ETHEREUM: "Ethereum",
  BASE: "Base",
  ARBITRUM: "Arbitrum",
};

const DIGEST_OPTIONS = [
  { value: "immediate", label: "Immediate" },
  { value: "daily", label: "Daily Digest" },
  { value: "weekly", label: "Weekly Digest" },
];

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
      <div className="mb-16">
        <div className="h-8 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-64 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="space-y-6">
        <div className="h-12 w-full animate-pulse rounded bg-zinc-200" />
        <div className="h-12 w-full animate-pulse rounded bg-zinc-200" />
        <div className="h-12 w-full animate-pulse rounded bg-zinc-200" />
        <div className="h-12 w-full animate-pulse rounded bg-zinc-200" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [wallets, setWallets] = useState<ApiWallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [unlinkingWalletId, setUnlinkingWalletId] = useState<string | null>(
    null
  );

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

  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [activeSection, setActiveSection] = useState<
    "profile" | "wallets" | "notifications" | "security"
  >("profile");

  // -------------------------------------------------------------------------
  // Fetch profile
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
      if (user.wallets) {
        setWallets(user.wallets);
        setWalletsLoading(false);
      }
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to load profile"
      );
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      setPrefsLoading(true);
      const res = await fetch("/api/users/me/preferences");
      const json = await res.json();
      if (json.success) {
        setPreferences(json.data.preferences);
      }
    } catch {
      // Keep defaults
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
  }, [fetchProfile, fetchPreferences]);

  // -------------------------------------------------------------------------
  // Save profile
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
      const updated = json.data.user;
      setProfile(updated);
      setDisplayName(updated.displayName || "");
      setEmail(updated.email || "");
      setProfileMessage("Profile saved");
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      setProfileMessage(
        err instanceof Error ? err.message : "Failed to save profile"
      );
    } finally {
      setProfileSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Unlink wallet
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
  // Save preferences
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
        setPrefsMessage("Preferences saved");
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
  // Export
  // -------------------------------------------------------------------------

  async function handleExportPortfolio() {
    try {
      setExporting(true);
      const res = await fetch("/api/users/me/portfolio/export?format=csv");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      link.download =
        filenameMatch?.[1] ||
        `portfolio-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silently handle
    } finally {
      setExporting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Preference helpers
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

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (profileLoading) return <SettingsSkeleton />;

  const primaryWallet =
    profile?.walletAddress ||
    wallets.find((w) => w.isPrimary)?.address ||
    "";

  const sections: {
    key: "profile" | "wallets" | "notifications" | "security";
    label: string;
  }[] = [
    { key: "profile", label: "Profile" },
    { key: "wallets", label: "Wallets" },
    { key: "notifications", label: "Notifications" },
    { key: "security", label: "Security" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
      {/* Header */}
      <div className="mb-16">
        <h1 className="font-serif text-3xl font-light text-zinc-900">
          Settings
        </h1>
        <p className="mt-2 text-sm font-normal text-zinc-500">
          Manage your account, wallets, notifications, and security.
        </p>
      </div>

      {/* Section Tabs */}
      <div className="mb-12 flex items-center gap-6 border-b border-zinc-200">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={cn(
              "pb-3 text-sm font-normal transition-colors",
              activeSection === s.key
                ? "border-b border-zinc-900 text-zinc-900"
                : "text-zinc-500 hover:text-zinc-600"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ================================================================== */}
      {/* PROFILE                                                            */}
      {/* ================================================================== */}
      {activeSection === "profile" && (
        <div className="space-y-8">
          {profileError && (
            <p className="text-sm font-normal text-zinc-500">{profileError}</p>
          )}

          {/* Display Name */}
          <div>
            <label className="mb-2 block text-xs font-normal uppercase tracking-widest text-zinc-500">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
              className="w-full border border-zinc-200 bg-transparent px-4 py-3 text-sm font-normal text-zinc-700 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-xs font-normal uppercase tracking-widest text-zinc-500">
              Email (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full border border-zinc-200 bg-transparent px-4 py-3 text-sm font-normal text-zinc-700 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400"
            />
            <p className="mt-1 text-xs font-normal text-zinc-400">
              Used for email notifications only. Never shared.
            </p>
          </div>

          {/* Primary Wallet (read-only) */}
          <div>
            <label className="mb-2 block text-xs font-normal uppercase tracking-widest text-zinc-500">
              Primary Wallet
            </label>
            <div className="border border-zinc-200 px-4 py-3">
              <code className="font-mono text-sm font-normal text-zinc-500">
                {primaryWallet}
              </code>
            </div>
          </div>

          {/* Save */}
          {profileMessage && (
            <p
              className={cn(
                "text-sm font-normal",
                profileMessage.includes("saved") ||
                  profileMessage.includes("No changes")
                  ? "text-zinc-500"
                  : "text-zinc-500"
              )}
            >
              {profileMessage}
            </p>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={profileSaving}
            className="border border-violet-500 bg-violet-500 px-6 py-2.5 text-sm font-normal text-white transition-colors hover:bg-violet-600 disabled:opacity-40"
          >
            {profileSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* WALLETS                                                            */}
      {/* ================================================================== */}
      {activeSection === "wallets" && (
        <div className="space-y-6">
          {walletError && (
            <p className="text-sm font-normal text-zinc-500">{walletError}</p>
          )}

          {walletsLoading && wallets.length === 0 ? (
            <p className="py-12 text-center text-sm font-normal text-zinc-400">
              Loading wallets...
            </p>
          ) : wallets.length === 0 ? (
            <p className="py-12 text-center font-serif text-sm font-normal text-zinc-400">
              No wallets linked yet.
            </p>
          ) : (
            <div>
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between border-b border-zinc-200 py-6"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="border border-zinc-200 px-2 py-0.5 text-xs font-normal text-zinc-500">
                        {CHAIN_LABELS[wallet.chain] || wallet.chain}
                      </span>
                      {wallet.isPrimary && (
                        <span className="border border-zinc-300 px-2 py-0.5 text-xs font-normal text-zinc-500">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-mono text-sm font-normal text-zinc-600">
                      {formatAddress(wallet.address, 8)}
                    </p>
                    <p className="mt-1 text-xs font-normal text-zinc-400">
                      Linked {formatDate(wallet.linkedAt)}
                    </p>
                  </div>
                  {!wallet.isPrimary && (
                    <button
                      onClick={() => handleUnlinkWallet(wallet.id)}
                      disabled={unlinkingWalletId === wallet.id}
                      className="text-xs font-normal text-zinc-400 transition-colors hover:text-zinc-600"
                    >
                      {unlinkingWalletId === wallet.id
                        ? "Unlinking..."
                        : "Unlink"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* NOTIFICATIONS                                                      */}
      {/* ================================================================== */}
      {activeSection === "notifications" && (
        <div className="space-y-8">
          {prefsLoading ? (
            <p className="py-12 text-center text-sm font-normal text-zinc-400">
              Loading preferences...
            </p>
          ) : (
            <>
              {/* Channel Toggles */}
              <div>
                <p className="mb-4 text-xs font-normal uppercase tracking-widest text-zinc-500">
                  Channels
                </p>
                <div className="space-y-0">
                  <div className="flex items-center justify-between border-b border-zinc-200 py-5">
                    <div>
                      <p className="text-sm font-normal text-zinc-700">
                        Email Notifications
                      </p>
                      <p className="mt-0.5 text-xs font-normal text-zinc-400">
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
                  <div className="flex items-center justify-between border-b border-zinc-200 py-5">
                    <div>
                      <p className="text-sm font-normal text-zinc-700">
                        Push Notifications
                      </p>
                      <p className="mt-0.5 text-xs font-normal text-zinc-400">
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
              </div>

              {/* Categories */}
              <div>
                <p className="mb-4 text-xs font-normal uppercase tracking-widest text-zinc-500">
                  Categories
                </p>
                <div className="space-y-0">
                  {[
                    {
                      key: "dealAlerts" as const,
                      title: "Deal Alerts",
                      desc: "New listings, opening and closing reminders",
                    },
                    {
                      key: "vestingAlerts" as const,
                      title: "Vesting Alerts",
                      desc: "Token unlock notifications and claim reminders",
                    },
                    {
                      key: "accountAlerts" as const,
                      title: "Account Alerts",
                      desc: "Contributions, stakes, claims, security events",
                    },
                    {
                      key: "marketingEmails" as const,
                      title: "Marketing Emails",
                      desc: "Product updates, newsletters, promotional content",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between border-b border-zinc-200 py-5"
                    >
                      <div>
                        <p className="text-sm font-normal text-zinc-700">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs font-normal text-zinc-400">
                          {item.desc}
                        </p>
                      </div>
                      <Toggle
                        checked={preferences[item.key]}
                        onCheckedChange={(v) =>
                          updatePreference(item.key, v)
                        }
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Digest Mode */}
              <div>
                <label className="mb-2 block text-xs font-normal uppercase tracking-widest text-zinc-500">
                  Digest Mode
                </label>
                <div className="flex gap-px border border-zinc-200">
                  {DIGEST_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        updatePreference(
                          "digestMode",
                          opt.value as "immediate" | "daily" | "weekly"
                        )
                      }
                      className={cn(
                        "flex-1 py-3 text-sm font-normal transition-colors",
                        preferences.digestMode === opt.value
                          ? "bg-zinc-100 text-zinc-800"
                          : "text-zinc-500 hover:text-zinc-600"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save */}
              {prefsMessage && (
                <p
                  className={cn(
                    "text-sm font-normal",
                    prefsMessage.includes("saved")
                      ? "text-zinc-500"
                      : "text-zinc-500"
                  )}
                >
                  {prefsMessage}
                </p>
              )}
              <button
                onClick={handleSavePreferences}
                disabled={prefsSaving}
                className="border border-violet-500 bg-violet-500 px-6 py-2.5 text-sm font-normal text-white transition-colors hover:bg-violet-600 disabled:opacity-40"
              >
                {prefsSaving ? "Saving..." : "Save Preferences"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* SECURITY                                                           */}
      {/* ================================================================== */}
      {activeSection === "security" && (
        <div className="space-y-12">
          {/* KYC */}
          <div>
            <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
              KYC Verification
            </h2>
            <div className="flex items-center justify-between border border-zinc-200 p-6">
              <div>
                <p className="text-sm font-normal text-zinc-700">
                  Verification Status
                </p>
                <p className="mt-1 text-xs font-normal text-zinc-400">
                  {kycStatus === "APPROVED"
                    ? "Your identity has been verified"
                    : kycStatus === "PENDING"
                    ? "Documents under review"
                    : "Complete KYC to access regulated deals"}
                </p>
              </div>
              <span className="border border-zinc-200 px-2 py-0.5 text-xs font-normal text-zinc-500">
                {kycDisplayStatus(kycStatus)}
              </span>
            </div>
          </div>

          {/* Sessions */}
          <div>
            <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
              Active Sessions
            </h2>
            {SESSIONS.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between border-b border-zinc-200 py-5"
              >
                <div className="flex items-center gap-4">
                  {session.deviceIcon === "desktop" ? (
                    <Monitor className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <Smartphone className="h-4 w-4 text-zinc-400" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-normal text-zinc-700">
                        {session.device}
                      </p>
                      {session.isCurrent && (
                        <span className="border border-zinc-300 px-1.5 py-px text-[10px] font-normal text-zinc-500">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-normal text-zinc-400">
                      {session.browser} &middot; {session.ip} &middot;{" "}
                      {session.location}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button className="text-xs font-normal text-zinc-400 transition-colors hover:text-zinc-600">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Data & Account */}
          <div>
            <h2 className="mb-6 font-serif text-lg font-normal text-zinc-900">
              Data & Account
            </h2>
            <div className="space-y-0">
              <div className="flex items-center justify-between border-b border-zinc-200 py-5">
                <div>
                  <p className="text-sm font-normal text-zinc-700">
                    Export Portfolio
                  </p>
                  <p className="mt-0.5 text-xs font-normal text-zinc-400">
                    Download your portfolio as CSV
                  </p>
                </div>
                <button
                  onClick={handleExportPortfolio}
                  disabled={exporting}
                  className="text-xs font-normal text-zinc-500 transition-colors hover:text-zinc-600 disabled:opacity-50"
                >
                  {exporting ? "Exporting..." : "Export CSV"}
                </button>
              </div>
              <div className="flex items-center justify-between py-5">
                <div>
                  <p className="text-sm font-normal text-zinc-700">
                    Delete Account
                  </p>
                  <p className="mt-0.5 text-xs font-normal text-zinc-400">
                    Permanently delete your account and all data
                  </p>
                </div>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs font-normal text-zinc-500 transition-colors hover:text-zinc-600"
                  >
                    Delete Account
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-xs font-normal text-zinc-400 transition-colors hover:text-zinc-600"
                    >
                      Cancel
                    </button>
                    <button className="text-xs font-normal text-zinc-500 transition-colors hover:text-zinc-700">
                      Confirm Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
