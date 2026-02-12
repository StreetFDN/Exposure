"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  Users,
  Briefcase,
  Shield,
  Lock,
  KeyRound,
  ChevronDown,
  CheckCircle2,
  UserCheck,
  Search,
  CircleDollarSign,
  Twitter,
  Globe,
  Scale,
  BadgeCheck,
  Handshake,
  Target,
  Megaphone,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

const STATS = [
  { label: "Total Raised", value: "$200M+" },
  { label: "Projects Supported", value: "300+" },
  { label: "Verified Investors", value: "8,400+" },
  { label: "Lead Investors", value: "120+" },
];

// ---------------------------------------------------------------------------
// How It Works steps
// ---------------------------------------------------------------------------

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: <Twitter className="h-5 w-5" />,
    title: "Connect via X or Farcaster",
    description:
      "Sign in with your existing social account. No seed phrases required to get started.",
  },
  {
    step: 2,
    icon: <UserCheck className="h-5 w-5" />,
    title: "Complete verification",
    description:
      "Quick KYC to meet regulatory requirements. Your identity stays private from other investors.",
  },
  {
    step: 3,
    icon: <Search className="h-5 w-5" />,
    title: "Browse deals from trusted leads",
    description:
      "Explore investment opportunities curated by verified lead investors with proven track records.",
  },
  {
    step: 4,
    icon: <CircleDollarSign className="h-5 w-5" />,
    title: "Invest with USDC on-chain",
    description:
      "Commit capital directly on Base network. Smart contracts handle settlement — no intermediaries.",
  },
];

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------

const FAQ_ITEMS = [
  {
    question: "Who holds my investment funds?",
    answer:
      "Exposure holds your investment in a legally compliant structure. Lead investors never have access to your USDC. Smart contracts enforce this separation at the protocol level, meaning even in a worst-case scenario, your funds cannot be redirected by a lead.",
  },
  {
    question: "Can the lead investor run off with my money?",
    answer:
      "No. Smart contracts ensure the lead has zero access to follower USDC at any point. Funds flow directly from your wallet into the Exposure escrow contract, and are only released to the project upon deal completion. The lead investor never touches your capital.",
  },
  {
    question: "What happens to my tokens after a deal closes?",
    answer:
      "Tokens are distributed directly to your wallet according to the project's vesting schedule. You hold your own keys and control when you sell. Exposure is non-custodial for token claims — your allocation is yours to manage.",
  },
  {
    question: "What is a lead investor?",
    answer:
      "A lead investor is a verified individual or entity (VC, syndicate, KOL, or community leader) who sources deals and presents them to their followers on Exposure. Leads negotiate terms, perform due diligence, and earn a percentage of their followers' profits as aligned incentive. They are vetted before being approved on the platform.",
  },
  {
    question: "Do I need to be accredited to invest?",
    answer:
      "Requirements vary by jurisdiction. All investors must complete KYC verification. Certain deals may have additional eligibility requirements based on local regulations. Exposure ensures compliance so you can invest with confidence.",
  },
  {
    question: "What networks and currencies are supported?",
    answer:
      "Investments are made with USDC on the Base network. Base offers low fees and fast confirmation times. We chose a single settlement layer to maximize security and simplify the investment experience.",
  },
  {
    question: "How do lead investors earn?",
    answer:
      "Leads earn a carry — a percentage of their followers' profits on successful deals. This means leads only make money when their investors make money, creating a strong alignment of incentives. The exact carry percentage is disclosed on every deal.",
  },
];

// ---------------------------------------------------------------------------
// FAQ Accordion Item
// ---------------------------------------------------------------------------

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-violet-400"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-zinc-50">{question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${
          isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-zinc-400">{answer}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grain texture overlay (reused across sections)
// ---------------------------------------------------------------------------

function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="flex flex-col">
      {/* ================================================================= */}
      {/* Hero                                                              */}
      {/* ================================================================= */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-28 text-center sm:pb-28 sm:pt-36">
        {/* Background effects */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-transparent blur-3xl" />
          <GrainOverlay />
        </div>

        <Badge variant="outline" size="md" className="mb-6">
          Private capital rounds on Base
        </Badge>

        <h1 className="max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
          Early-stage investing for{" "}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            experienced crypto investors
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Join private funding rounds alongside professional investing
          communities. Co-invest with vetted leads on identical terms, settled
          on-chain with USDC.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/deals">
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Start Investing
            </Button>
          </Link>
          <Link href="/apply">
            <Button size="lg" variant="outline">
              Apply as a Lead
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          KYC required. Available to eligible investors in supported
          jurisdictions.
        </p>
      </section>

      {/* ================================================================= */}
      {/* Stats Bar                                                         */}
      {/* ================================================================= */}
      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 sm:gap-8 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl font-bold tabular-nums text-zinc-50 sm:text-3xl">
                {stat.value}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* Two Audience Segments                                             */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <GrainOverlay />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
              Two sides. One platform.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-400">
              Whether you are deploying capital or raising it, Exposure aligns
              incentives between investors and founders through trusted lead
              investors.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* FOR INVESTORS */}
            <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900/80">
              <div
                aria-hidden="true"
                className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-violet-600/10 blur-3xl"
              />
              <CardContent className="relative p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/15 text-violet-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <Badge variant="default" size="sm">
                      For Investors
                    </Badge>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-zinc-50">
                  Private group investing
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Access early-stage rounds that were previously reserved for
                  VCs and insiders. Invest alongside trusted leads on the exact
                  same terms.
                </p>

                <ul className="mt-6 flex flex-col gap-4">
                  {[
                    {
                      icon: <Users className="h-4 w-4" />,
                      text: "Join private groups led by VCs, syndicates, and community leaders",
                    },
                    {
                      icon: <Handshake className="h-4 w-4" />,
                      text: "Co-invest with group leads on identical deal terms",
                    },
                    {
                      icon: <CircleDollarSign className="h-4 w-4" />,
                      text: "USDC-based, settled on-chain via Base network",
                    },
                    {
                      icon: <KeyRound className="h-4 w-4" />,
                      text: "Non-custodial token claims — you hold your own keys",
                    },
                  ].map((item) => (
                    <li
                      key={item.text}
                      className="flex items-start gap-3 text-sm text-zinc-300"
                    >
                      <span className="mt-0.5 shrink-0 text-violet-400">
                        {item.icon}
                      </span>
                      {item.text}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link href="/deals">
                    <Button
                      size="md"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Browse Deals
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* FOR FOUNDERS */}
            <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900/80">
              <div
                aria-hidden="true"
                className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-fuchsia-600/10 blur-3xl"
              />
              <CardContent className="relative p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-600/15 text-fuchsia-400">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="border-fuchsia-500/20 text-fuchsia-400"
                    >
                      For Founders
                    </Badge>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-zinc-50">
                  Raise with us
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Get in front of thousands of verified investors through
                  trusted lead investors who champion your project to their
                  communities.
                </p>

                <ul className="mt-6 flex flex-col gap-4">
                  {[
                    {
                      icon: <Target className="h-4 w-4" />,
                      text: "Only verified leads can present your deal — quality over quantity",
                    },
                    {
                      icon: <Scale className="h-4 w-4" />,
                      text: "Founders don't choose who invests — leads bring their own network",
                    },
                    {
                      icon: <BarChart3 className="h-4 w-4" />,
                      text: "Leads earn carry on follower profits — aligned incentive structure",
                    },
                    {
                      icon: <Megaphone className="h-4 w-4" />,
                      text: "Built-in distribution to 8,400+ verified crypto investors",
                    },
                  ].map((item) => (
                    <li
                      key={item.text}
                      className="flex items-start gap-3 text-sm text-zinc-300"
                    >
                      <span className="mt-0.5 shrink-0 text-fuchsia-400">
                        {item.icon}
                      </span>
                      {item.text}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link href="/apply">
                    <Button size="md" variant="outline">
                      Apply to Raise
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Trust & Safety                                                    */}
      {/* ================================================================= */}
      <section className="border-y border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
              Built on trust, enforced by code
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-400">
              Every dollar invested on Exposure is protected by smart contract
              guarantees. Not promises — code.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Trust card 1 */}
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-50">
                  Exposure holds your investment legally
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Your funds are held in a regulated legal structure operated by
                  Exposure — not by the lead investor, not by the project.
                  Institutional-grade custody for every participant.
                </p>
              </CardContent>
            </Card>

            {/* Trust card 2 */}
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-50">
                  Leads have zero access to your USDC
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Smart contracts ensure that lead investors can never touch,
                  redirect, or withdraw follower funds. The contract enforces
                  separation at the protocol level.
                </p>
              </CardContent>
            </Card>

            {/* Trust card 3 */}
            <Card className="border-zinc-800 bg-zinc-900/60 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-50">
                  You control when you sell
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Token claims are non-custodial. Once tokens are distributed to
                  your wallet, you hold the keys. No lock-ups beyond the
                  project's vesting schedule.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* How It Works                                                      */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <GrainOverlay />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-zinc-400">
              From sign-up to your first investment in four steps. No wallet
              required to start.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.title}
                className="flex flex-col items-center gap-4 text-center"
              >
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-violet-400">
                    {step.icon}
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                    {step.step}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-zinc-50">
                  {step.title}
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Social Proof / Lead Investors                                     */}
      {/* ================================================================= */}
      <section className="border-y border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
              Trusted by leads, backed by results
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-400">
              Our lead investors are VCs, syndicates, and community builders who
              have been vetted for track record, integrity, and alignment.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <BadgeCheck className="h-6 w-6" />,
                stat: "120+",
                label: "Verified Lead Investors",
                description:
                  "Every lead is vetted before they can present deals on the platform.",
              },
              {
                icon: <Globe className="h-6 w-6" />,
                stat: "40+",
                label: "Countries Represented",
                description:
                  "A global network of investors and founders building the future of crypto.",
              },
              {
                icon: <CheckCircle2 className="h-6 w-6" />,
                stat: "94%",
                label: "Deal Completion Rate",
                description:
                  "Nearly every deal presented on Exposure reaches its funding target.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center"
              >
                <span className="text-violet-400">{item.icon}</span>
                <span className="text-3xl font-bold text-zinc-50">
                  {item.stat}
                </span>
                <span className="text-sm font-medium uppercase tracking-wider text-zinc-500">
                  {item.label}
                </span>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FAQ                                                               */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <GrainOverlay />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-20 sm:py-28">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-zinc-400">
              Security, compliance, and how Exposure protects your capital.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-6">
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem
                key={item.question}
                question={item.question}
                answer={item.answer}
                isOpen={openFAQ === i}
                onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Bottom CTA                                                        */}
      {/* ================================================================= */}
      <section className="border-t border-zinc-800">
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 overflow-hidden px-4 py-24 text-center sm:py-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-600/15 via-fuchsia-500/5 to-transparent blur-3xl" />
          </div>

          <h2 className="text-3xl font-bold text-zinc-50 sm:text-4xl">
            Ready to invest alongside the best?
          </h2>
          <p className="max-w-lg text-zinc-400">
            Join 8,400+ verified investors accessing private crypto rounds
            through trusted lead investors. On-chain, compliant, and
            transparent.
          </p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            <Link href="/deals">
              <Button
                size="lg"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Start Investing
              </Button>
            </Link>
            <Link href="/apply">
              <Button size="lg" variant="outline">
                Apply as a Lead
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Investments involve risk. Past performance is not indicative of
            future results.
          </p>
        </div>
      </section>
    </div>
  );
}
