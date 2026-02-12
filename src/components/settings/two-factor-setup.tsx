"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  KeyRound,
  QrCode,
  ArrowRight,
  ArrowLeft,
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
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SetupStep = "idle" | "qr" | "manual" | "verify" | "backup" | "done";

interface TwoFactorSetupProps {
  /** Whether 2FA is currently enabled for the user */
  twoFactorEnabled: boolean;
  /** Callback after 2FA state changes */
  onStateChange?: (enabled: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TwoFactorSetup({
  twoFactorEnabled: initialEnabled,
  onStateChange,
}: TwoFactorSetupProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<SetupStep>("idle");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Focus code input when entering verify step
  useEffect(() => {
    if (step === "verify" && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [step]);

  // -------------------------------------------------------------------------
  // API Calls
  // -------------------------------------------------------------------------

  const startSetup = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message || "Failed to start 2FA setup");
        return;
      }

      setSecret(json.data.secret);
      setUri(json.data.uri);
      setStep("qr");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyCode = useCallback(async () => {
    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message || "Invalid code");
        return;
      }

      setBackupCodes(json.data.backupCodes || []);
      setStep("backup");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [code]);

  const finishSetup = useCallback(() => {
    setEnabled(true);
    setStep("done");
    onStateChange?.(true);

    // Reset after a moment
    setTimeout(() => {
      setStep("idle");
      setCode("");
      setSecret("");
      setUri("");
      setBackupCodes([]);
    }, 2000);
  }, [onStateChange]);

  const disable2FA = useCallback(async () => {
    if (disableCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message || "Failed to disable 2FA");
        return;
      }

      setEnabled(false);
      setShowDisable(false);
      setDisableCode("");
      onStateChange?.(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [disableCode, onStateChange]);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadBackupCodes() {
    const content = [
      "Exposure - Two-Factor Authentication Backup Codes",
      "=" .repeat(52),
      "",
      "Keep these codes in a safe place. Each code can only",
      "be used once to access your account if you lose your",
      "authenticator device.",
      "",
      ...backupCodes.map((c, i) => `  ${i + 1}. ${c}`),
      "",
      `Generated: ${new Date().toISOString()}`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exposure-2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCodeInput(value: string) {
    // Only allow digits, max 6
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    setError("");
  }

  function handleDisableCodeInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setDisableCode(digits);
    setError("");
  }

  // -------------------------------------------------------------------------
  // Render: 2FA Enabled State
  // -------------------------------------------------------------------------

  if (enabled && step === "idle") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Your account is protected with 2FA
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" size="md">
              Enabled
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDisable ? (
            <div className="space-y-4 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <div>
                  <p className="text-sm font-medium text-rose-300">
                    Disable Two-Factor Authentication
                  </p>
                  <p className="mt-1 text-xs text-rose-400/70">
                    This will reduce the security of your account. Enter your
                    current authenticator code to confirm.
                  </p>
                </div>
              </div>

              <Input
                label="Authenticator Code"
                placeholder="000000"
                value={disableCode}
                onChange={(e) => handleDisableCodeInput(e.target.value)}
                error={error}
                className="font-mono text-center text-lg tracking-[0.5em]"
              />

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDisable(false);
                    setDisableCode("");
                    setError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  isLoading={loading}
                  onClick={disable2FA}
                >
                  <ShieldOff className="h-4 w-4" />
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <div>
                <p className="text-sm text-zinc-300">
                  Two-factor authentication adds an extra layer of security to
                  your account by requiring a code from your authenticator app
                  for sensitive actions.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        {!showDisable && (
          <CardFooter className="gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisable(true)}
            >
              <ShieldOff className="h-4 w-4" />
              Disable 2FA
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Done State (brief success flash)
  // -------------------------------------------------------------------------

  if (step === "done") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-lg font-semibold text-zinc-50">
            2FA Successfully Enabled
          </p>
          <p className="text-sm text-zinc-400">
            Your account is now protected with two-factor authentication.
          </p>
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Setup Flow (idle -> qr -> verify -> backup)
  // -------------------------------------------------------------------------

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
            <Shield className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <CardTitle>
              {step === "idle"
                ? "Enable Two-Factor Authentication"
                : step === "qr" || step === "manual"
                ? "Step 1: Scan QR Code"
                : step === "verify"
                ? "Step 2: Enter Verification Code"
                : "Step 3: Save Backup Codes"}
            </CardTitle>
            <CardDescription>
              {step === "idle"
                ? "Add an extra layer of security to protect your account and assets"
                : step === "qr"
                ? "Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)"
                : step === "manual"
                ? "Manually enter this secret key into your authenticator app"
                : step === "verify"
                ? "Enter the 6-digit code from your authenticator app"
                : "Save these backup codes -- you will need them if you lose your authenticator device"}
            </CardDescription>
          </div>
        </div>

        {/* Step indicator */}
        {step !== "idle" && (
          <div className="mt-4 flex items-center gap-2">
            {["qr", "verify", "backup"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                    step === s || step === "manual" && s === "qr"
                      ? "bg-violet-500 text-white"
                      : (step === "verify" && i === 0) ||
                        (step === "backup" && i <= 1)
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  {(step === "verify" && i === 0) ||
                  (step === "backup" && i <= 1) ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={cn(
                      "h-px w-8",
                      (step === "verify" && i === 0) ||
                        (step === "backup" && i <= 1)
                        ? "bg-emerald-500/30"
                        : "bg-zinc-800"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ---- IDLE ---- */}
        {step === "idle" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Protect sensitive actions
                    </p>
                    <p className="text-xs text-zinc-500">
                      Contributions, withdrawals, and settings changes will
                      require a verification code from your authenticator app.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      Prevent unauthorized access
                    </p>
                    <p className="text-xs text-zinc-500">
                      Even if your wallet is compromised, attackers cannot
                      perform actions without your authenticator device.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-rose-400">{error}</p>
            )}

            <Button
              onClick={startSetup}
              isLoading={loading}
              leftIcon={<Shield className="h-4 w-4" />}
            >
              Set Up 2FA
            </Button>
          </div>
        )}

        {/* ---- QR CODE ---- */}
        {step === "qr" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-lg border border-zinc-700 bg-white p-4">
                {/* QR Code placeholder - renders the URI as a visual block */}
                <div className="flex h-48 w-48 flex-col items-center justify-center gap-2">
                  <QrCode className="h-16 w-16 text-zinc-800" />
                  <p className="text-center text-[10px] leading-tight text-zinc-600 break-all px-2">
                    {uri.length > 80 ? uri.slice(0, 80) + "..." : uri}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-zinc-500">
              Scan the QR code above with your authenticator app.
              <br />
              If you cannot scan,{" "}
              <button
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
                onClick={() => setStep("manual")}
              >
                enter the key manually
              </button>
              .
            </p>
          </div>
        )}

        {/* ---- MANUAL ENTRY ---- */}
        {step === "manual" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Secret Key
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-sm text-violet-400">
                  {secret}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(secret)}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-zinc-500">
              Enter this key manually in your authenticator app. Make sure to
              select &quot;Time-based&quot; and set the issuer as
              &quot;Exposure&quot;.
            </p>

            <button
              className="text-xs text-violet-400 underline underline-offset-2 hover:text-violet-300"
              onClick={() => setStep("qr")}
            >
              Back to QR code
            </button>
          </div>
        )}

        {/* ---- VERIFY CODE ---- */}
        {step === "verify" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Enter the 6-digit code displayed in your authenticator app to
              complete the setup.
            </p>

            <div className="mx-auto max-w-xs">
              <Input
                ref={codeInputRef}
                label="Verification Code"
                placeholder="000000"
                value={code}
                onChange={(e) => handleCodeInput(e.target.value)}
                error={error}
                className="font-mono text-center text-2xl tracking-[0.5em]"
              />
            </div>
          </div>
        )}

        {/* ---- BACKUP CODES ---- */}
        {step === "backup" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <p className="text-sm text-amber-300">
                  Save these backup codes now. They will not be shown again. Each
                  code can only be used once.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-700 bg-zinc-950 p-4">
              {backupCodes.map((backupCode, i) => (
                <div
                  key={i}
                  className="rounded bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300"
                >
                  {backupCode}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  copyToClipboard(backupCodes.join("\n"))
                }
                leftIcon={
                  copied ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )
                }
              >
                {copied ? "Copied!" : "Copy All"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={downloadBackupCodes}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer with navigation */}
      {step !== "idle" && (
        <CardFooter className="justify-between">
          {/* Back button */}
          {(step === "qr" || step === "manual") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("idle");
                setError("");
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
          )}
          {step === "verify" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("qr")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {step === "backup" && <div />}

          {/* Next button */}
          {(step === "qr" || step === "manual") && (
            <Button
              size="sm"
              onClick={() => setStep("verify")}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Next
            </Button>
          )}
          {step === "verify" && (
            <Button
              size="sm"
              isLoading={loading}
              onClick={verifyCode}
              disabled={code.length !== 6}
            >
              Verify &amp; Enable
            </Button>
          )}
          {step === "backup" && (
            <Button size="sm" onClick={finishSetup}>
              I&apos;ve Saved My Codes
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
