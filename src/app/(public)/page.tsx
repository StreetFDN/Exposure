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
    <div className="border-b border-zinc-800/40 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-zinc-200"
        aria-expanded={isOpen}
      >
        <span className="text-base font-normal text-zinc-200">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-200 ${
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
          <p className="text-sm font-light leading-relaxed text-zinc-500">{answer}</p>
        </div>
      </div>
    </div>
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
      <section className="relative flex flex-col items-center justify-center px-4 pb-24 pt-32 text-center sm:pb-32 sm:pt-40">
        <p className="mb-6 text-xs font-light uppercase tracking-[0.2em] text-zinc-500">
          Private capital rounds on Base
        </p>

        <h1 className="text-hero max-w-4xl text-zinc-100">
          Early-stage investing for{" "}
          <span className="text-zinc-400">
            experienced investors
          </span>
        </h1>

        <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-zinc-500 sm:text-xl">
          Join private funding rounds alongside professional investing
          communities. Co-invest with vetted leads on identical terms, settled
          on-chain with USDC.
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link href="/deals">
            <button className="inline-flex items-center gap-2 rounded-md bg-zinc-50 px-8 py-3.5 text-base font-medium text-zinc-900 hover:bg-zinc-200">
              Start Investing
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
          <Link href="/apply">
            <button className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-8 py-3.5 text-base font-light text-zinc-300 hover:border-zinc-600 hover:text-zinc-100">
              Apply as a Lead
            </button>
          </Link>
        </div>

        <p className="mt-8 text-xs font-light text-zinc-600">
          KYC required. Available to eligible investors in supported
          jurisdictions.
        </p>
      </section>

      {/* ================================================================= */}
      {/* Stats Bar                                                         */}
      {/* ================================================================= */}
      <section className="border-y border-zinc-800/30">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-12 px-4 py-12 sm:gap-16 lg:justify-between">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
              <span className="font-serif text-3xl font-light tabular-nums text-zinc-100 sm:text-4xl">
                {stat.value}
              </span>
              <span className="text-xs font-light uppercase tracking-wider text-zinc-600">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* Two Audience Segments                                             */}
      {/* ================================================================= */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <div className="mb-16 text-center">
            <h2 className="text-section-heading text-zinc-100">
              Two sides. One platform.
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-light text-zinc-500">
              Whether you are deploying capital or raising it, Exposure aligns
              incentives between investors and founders through trusted lead
              investors.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-xl border border-zinc-800/40 bg-zinc-800/40 lg:grid-cols-2">
            {/* FOR INVESTORS */}
            <div className="bg-zinc-950 p-10">
              <div className="mb-6 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-zinc-500" />
                <span className="text-xs font-light uppercase tracking-wider text-zinc-500">
                  For Investors
                </span>
              </div>

              <h3 className="font-serif text-2xl font-light text-zinc-100">
                Private group investing
              </h3>
              <p className="mt-3 text-sm font-light leading-relaxed text-zinc-500">
                Access early-stage rounds that were previously reserved for
                VCs and insiders. Invest alongside trusted leads on the exact
                same terms.
              </p>

              <ul className="mt-8 flex flex-col gap-4">
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
                    className="flex items-start gap-3 text-sm font-light text-zinc-400"
                  >
                    <span className="mt-0.5 shrink-0 text-zinc-600">
                      {item.icon}
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link href="/deals">
                  <button className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100">
                    Browse Deals
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>

            {/* FOR FOUNDERS */}
            <div className="bg-zinc-950 p-10">
              <div className="mb-6 flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-zinc-500" />
                <span className="text-xs font-light uppercase tracking-wider text-zinc-500">
                  For Founders
                </span>
              </div>

              <h3 className="font-serif text-2xl font-light text-zinc-100">
                Raise with us
              </h3>
              <p className="mt-3 text-sm font-light leading-relaxed text-zinc-500">
                Get in front of thousands of verified investors through
                trusted lead investors who champion your project to their
                communities.
              </p>

              <ul className="mt-8 flex flex-col gap-4">
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
                    className="flex items-start gap-3 text-sm font-light text-zinc-400"
                  >
                    <span className="mt-0.5 shrink-0 text-zinc-600">
                      {item.icon}
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link href="/apply">
                  <button className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-zinc-100">
                    Apply to Raise
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Trust & Safety                                                    */}
      {/* ================================================================= */}
      <section className="border-y border-zinc-800/30">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <div className="mb-16 text-center">
            <h2 className="text-section-heading text-zinc-100">
              Built on trust, enforced by code
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-light text-zinc-500">
              Every dollar invested on Exposure is protected by smart contract
              guarantees. Not promises — code.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-xl border border-zinc-800/40 bg-zinc-800/40 sm:grid-cols-3">
            {/* Trust card 1 */}
            <div className="bg-zinc-950 p-8">
              <Shield className="mb-5 h-5 w-5 text-zinc-500" />
              <h3 className="text-base font-medium text-zinc-200">
                Exposure holds your investment legally
              </h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-zinc-500">
                Your funds are held in a regulated legal structure operated by
                Exposure — not by the lead investor, not by the project.
                Institutional-grade custody for every participant.
              </p>
            </div>

            {/* Trust card 2 */}
            <div className="bg-zinc-950 p-8">
              <Lock className="mb-5 h-5 w-5 text-zinc-500" />
              <h3 className="text-base font-medium text-zinc-200">
                Leads have zero access to your USDC
              </h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-zinc-500">
                Smart contracts ensure that lead investors can never touch,
                redirect, or withdraw follower funds. The contract enforces
                separation at the protocol level.
              </p>
            </div>

            {/* Trust card 3 */}
            <div className="bg-zinc-950 p-8">
              <KeyRound className="mb-5 h-5 w-5 text-zinc-500" />
              <h3 className="text-base font-medium text-zinc-200">
                You control when you sell
              </h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-zinc-500">
                Token claims are non-custodial. Once tokens are distributed to
                your wallet, you hold the keys. No lock-ups beyond the
                project's vesting schedule.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* How It Works                                                      */}
      {/* ================================================================= */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <div className="mb-16 text-center">
            <h2 className="text-section-heading text-zinc-100">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-light text-zinc-500">
              From sign-up to your first investment in four steps. No wallet
              required to start.
            </p>
          </div>

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.title}
                className="flex flex-col items-center gap-5 text-center"
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif text-4xl font-light text-zinc-700">
                    {step.step}
                  </span>
                </div>

                <h3 className="text-base font-medium text-zinc-200">
                  {step.title}
                </h3>
                <p className="max-w-xs text-sm font-light leading-relaxed text-zinc-500">
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
      <section className="border-y border-zinc-800/30">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <div className="mb-16 text-center">
            <h2 className="text-section-heading text-zinc-100">
              Trusted by leads, backed by results
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-light text-zinc-500">
              Our lead investors are VCs, syndicates, and community builders who
              have been vetted for track record, integrity, and alignment.
            </p>
          </div>

          <div className="grid gap-12 sm:grid-cols-3">
            {[
              {
                stat: "120+",
                label: "Verified Lead Investors",
                description:
                  "Every lead is vetted before they can present deals on the platform.",
              },
              {
                stat: "40+",
                label: "Countries Represented",
                description:
                  "A global network of investors and founders building the future of crypto.",
              },
              {
                stat: "94%",
                label: "Deal Completion Rate",
                description:
                  "Nearly every deal presented on Exposure reaches its funding target.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 text-center"
              >
                <span className="font-serif text-5xl font-light text-zinc-100">
                  {item.stat}
                </span>
                <span className="text-xs font-light uppercase tracking-wider text-zinc-600">
                  {item.label}
                </span>
                <p className="mt-2 max-w-xs text-sm font-light text-zinc-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FAQ                                                               */}
      {/* ================================================================= */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-24 sm:py-32">
          <div className="mb-12 text-center">
            <h2 className="text-section-heading text-zinc-100">
              Frequently asked questions
            </h2>
            <p className="mt-4 font-light text-zinc-500">
              Security, compliance, and how Exposure protects your capital.
            </p>
          </div>

          <div className="border-t border-zinc-800/40">
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
      <section className="border-t border-zinc-800/30">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-28 text-center sm:py-36">
          <h2 className="text-section-heading text-zinc-100">
            Ready to invest alongside the best?
          </h2>
          <p className="max-w-lg font-light text-zinc-500">
            Join 8,400+ verified investors accessing private crypto rounds
            through trusted lead investors. On-chain, compliant, and
            transparent.
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link href="/deals">
              <button className="inline-flex items-center gap-2 rounded-md bg-zinc-50 px-8 py-3.5 text-base font-medium text-zinc-900 hover:bg-zinc-200">
                Start Investing
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/apply">
              <button className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-8 py-3.5 text-base font-light text-zinc-300 hover:border-zinc-600 hover:text-zinc-100">
                Apply as a Lead
              </button>
            </Link>
          </div>

          <p className="mt-6 text-xs font-light text-zinc-600">
            Investments involve risk. Past performance is not indicative of
            future results.
          </p>
        </div>
      </section>
    </div>
  );
}
