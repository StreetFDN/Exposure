"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Shield,
  Lock,
  TrendingUp,
  Briefcase,
  KeyRound,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Scroll animation hook
// ---------------------------------------------------------------------------

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

// Wrapper component for animated sections
function Animate({
  children,
  className = "fade-in-up",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  const ref = useScrollAnimation();
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURED_DEALS = [
  {
    name: "Meridian Protocol",
    category: "DeFi",
    raised: "$2.4M",
    target: "$3.0M",
    lead: "Framework Ventures",
    status: "Live",
  },
  {
    name: "Arcana Network",
    category: "Infrastructure",
    raised: "$1.8M",
    target: "$2.5M",
    lead: "Delphi Digital",
    status: "Live",
  },
  {
    name: "Vaultis",
    category: "Security",
    raised: "$4.0M",
    target: "$4.0M",
    lead: "a16z Scout",
    status: "Closed",
  },
];

const INVESTOR_BENEFITS = [
  "Access private rounds alongside verified lead investors",
  "Co-invest on identical terms — no hidden fees or side deals",
  "USDC settlement on Base with smart contract guarantees",
  "Non-custodial token claims — you hold your own keys",
  "Full transparency on carry, vesting, and deal structure",
];

const PROJECT_BENEFITS = [
  "Raise from 8,400+ verified crypto-native investors",
  "Trusted leads champion your project to their communities",
  "Institutional-grade compliance and legal structure",
  "Built-in distribution — no cold outreach required",
  "Aligned incentives through lead investor carry model",
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ================================================================= */}
      {/* Hero                                                              */}
      {/* ================================================================= */}
      <section className="relative flex min-h-[100vh] flex-col items-center justify-center px-4 text-center">
        {/* Content */}
        <div className="fade-in-up visible" style={{ animationDelay: "0ms" }}>
          <p className="mb-8 text-[11px] font-normal uppercase tracking-[0.3em] text-zinc-500">
            Private capital markets on-chain
          </p>
        </div>

        <h1 className="text-hero max-w-5xl text-zinc-800">
          Institutional-Grade Access
          <br />
          <span className="text-zinc-500">to Private Markets</span>
        </h1>

        <p className="mt-10 max-w-xl text-lg font-normal leading-relaxed text-zinc-500">
          Co-invest alongside professional syndicates in early-stage crypto
          rounds. On-chain settlement. Aligned incentives. No intermediaries.
        </p>

        <div className="mt-14">
          <Link href="/deals">
            <button className="group inline-flex items-center gap-3 rounded-sm bg-zinc-900 px-10 py-4 text-[15px] font-medium tracking-wide text-white transition-all duration-300 hover:bg-zinc-800 hover:shadow-[0_0_40px_rgba(0,0,0,0.06)]">
              Start Investing
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </Link>
        </div>

        {/* Stat bar */}
        <div className="mt-20 flex items-center gap-8 sm:gap-12">
          {[
            { value: "$200M+", label: "Raised" },
            { value: "300+", label: "Deals" },
            { value: "8,400+", label: "Investors" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-8 sm:gap-12">
              {i > 0 && <div className="h-4 w-px bg-zinc-200" />}
              <div className="flex flex-col items-center gap-1">
                <span className="font-mono text-sm font-normal tabular-nums text-zinc-500">
                  {stat.value}
                </span>
                <span className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-400">
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="h-8 w-px animate-pulse bg-gradient-to-b from-zinc-300 to-transparent" />
        </div>
      </section>

      {/* ================================================================= */}
      {/* How It Works                                                      */}
      {/* ================================================================= */}
      <section className="border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-32 sm:py-40">
          <Animate>
            <div className="mb-20">
              <p className="mb-4 text-[11px] font-normal uppercase tracking-[0.3em] text-zinc-500">
                Process
              </p>
              <h2 className="text-section-heading max-w-lg text-zinc-800">
                Three steps to your first investment
              </h2>
            </div>
          </Animate>

          <Animate className="fade-in-up">
            <div className="grid gap-0 border-t border-zinc-200 md:grid-cols-3">
              {[
                {
                  num: "01",
                  title: "Connect & Verify",
                  desc: "Sign in via X or Farcaster. Complete a quick KYC check to meet regulatory requirements. Your identity stays private.",
                },
                {
                  num: "02",
                  title: "Browse Curated Deals",
                  desc: "Explore investment opportunities sourced by verified lead investors with proven track records and aligned incentives.",
                },
                {
                  num: "03",
                  title: "Invest On-Chain",
                  desc: "Commit capital with USDC on Base. Smart contracts handle settlement and token distribution. No intermediaries.",
                },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className={`flex flex-col gap-6 border-b border-zinc-200 py-12 pr-12 ${
                    i < 2 ? "md:border-r" : ""
                  } ${i > 0 ? "md:pl-12" : ""}`}
                >
                  <span className="font-mono text-sm text-zinc-400">
                    {step.num}
                  </span>
                  <h3 className="font-serif text-2xl font-light text-zinc-800">
                    {step.title}
                  </h3>
                  <p className="text-[15px] font-normal leading-relaxed text-zinc-500">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </Animate>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Featured Deals                                                    */}
      {/* ================================================================= */}
      <section className="border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-32 sm:py-40">
          <Animate>
            <div className="mb-20 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="mb-4 text-[11px] font-normal uppercase tracking-[0.3em] text-zinc-500">
                  Live Deals
                </p>
                <h2 className="text-section-heading text-zinc-800">
                  Current opportunities
                </h2>
              </div>
              <Link
                href="/deals"
                className="group flex items-center gap-2 text-sm font-normal text-zinc-500 transition-colors duration-300 hover:text-zinc-700"
              >
                View all deals
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Animate>

          <Animate className="fade-in-up">
            <div className="grid gap-6 md:grid-cols-3">
              {FEATURED_DEALS.map((deal) => (
                <Link href="/deals" key={deal.name}>
                  <div className="group flex h-full flex-col justify-between border border-zinc-200 p-8 transition-colors duration-500 hover:border-zinc-300">
                    {/* Top */}
                    <div>
                      <div className="mb-8 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-normal uppercase tracking-[0.2em] ${
                            deal.status === "Live"
                              ? "text-emerald-500"
                              : "text-zinc-400"
                          }`}
                        >
                          {deal.status}
                        </span>
                        <span className="rounded-full border border-zinc-200 px-3 py-1 text-[10px] font-normal uppercase tracking-[0.15em] text-zinc-500">
                          {deal.category}
                        </span>
                      </div>

                      <h3 className="font-serif text-xl font-normal text-zinc-800 transition-colors duration-300 group-hover:text-zinc-900">
                        {deal.name}
                      </h3>

                      <p className="mt-3 text-sm font-normal text-zinc-400">
                        Led by {deal.lead}
                      </p>
                    </div>

                    {/* Bottom */}
                    <div className="mt-12 flex items-end justify-between border-t border-zinc-200 pt-6">
                      <div>
                        <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-400">
                          Raised
                        </p>
                        <p className="mt-1 font-serif text-2xl font-light tabular-nums text-zinc-700">
                          {deal.raised}
                        </p>
                      </div>
                      <p className="text-sm font-normal tabular-nums text-zinc-400">
                        of {deal.target}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Animate>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Stats / Trust                                                     */}
      {/* ================================================================= */}
      <section className="border-t border-zinc-200 bg-white">
        <Animate>
          <div className="mx-auto max-w-6xl px-4 py-28 sm:py-36">
            <div className="grid grid-cols-2 gap-y-16 md:grid-cols-4">
              {[
                { value: "$200M+", label: "Total Capital Raised" },
                { value: "120+", label: "Verified Lead Investors" },
                { value: "94%", label: "Deal Completion Rate" },
                { value: "40+", label: "Countries Represented" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <span className="font-serif text-4xl font-light tabular-nums text-zinc-800 sm:text-5xl">
                    {stat.value}
                  </span>
                  <span className="max-w-[140px] text-[10px] font-normal uppercase leading-relaxed tracking-[0.2em] text-zinc-500">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Animate>
      </section>

      {/* ================================================================= */}
      {/* For Investors / For Projects                                      */}
      {/* ================================================================= */}
      <section className="border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-32 sm:py-40">
          <Animate>
            <div className="mb-20">
              <p className="mb-4 text-[11px] font-normal uppercase tracking-[0.3em] text-zinc-500">
                Platform
              </p>
              <h2 className="text-section-heading max-w-lg text-zinc-800">
                Two sides, one infrastructure
              </h2>
            </div>
          </Animate>

          <div className="grid gap-px border border-zinc-200 md:grid-cols-2">
            {/* For Investors */}
            <Animate>
              <div className="flex h-full flex-col p-10 sm:p-14">
                <div className="mb-10 flex items-center gap-4">
                  <TrendingUp className="h-4 w-4 text-zinc-500" />
                  <span className="text-[11px] font-normal uppercase tracking-[0.3em] text-zinc-500">
                    For Investors
                  </span>
                </div>

                <h3 className="font-serif text-3xl font-light text-zinc-800">
                  Private round access, <br className="hidden sm:block" />
                  without the gatekeeping
                </h3>

                <ul className="mt-10 flex flex-col gap-5">
                  {INVESTOR_BENEFITS.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-4 text-[15px] font-normal leading-relaxed text-zinc-500"
                    >
                      <Check className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="mt-12">
                  <Link href="/deals">
                    <button className="group inline-flex items-center gap-2 text-sm font-normal text-zinc-500 transition-colors duration-300 hover:text-zinc-700">
                      Browse deals
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </Link>
                </div>
              </div>
            </Animate>

            {/* For Projects */}
            <Animate>
              <div className="flex h-full flex-col border-t border-zinc-200 p-10 sm:p-14 md:border-l md:border-t-0">
                <div className="mb-10 flex items-center gap-4">
                  <Briefcase className="h-4 w-4 text-zinc-500" />
                  <span className="text-[11px] font-normal uppercase tracking-[0.3em] text-zinc-500">
                    For Projects
                  </span>
                </div>

                <h3 className="font-serif text-3xl font-light text-zinc-800">
                  Raise from verified <br className="hidden sm:block" />
                  crypto-native capital
                </h3>

                <ul className="mt-10 flex flex-col gap-5">
                  {PROJECT_BENEFITS.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-4 text-[15px] font-normal leading-relaxed text-zinc-500"
                    >
                      <Check className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="mt-12">
                  <Link href="/apply">
                    <button className="group inline-flex items-center gap-2 text-sm font-normal text-zinc-500 transition-colors duration-300 hover:text-zinc-700">
                      Apply to raise
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </Link>
                </div>
              </div>
            </Animate>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Trust & Security                                                  */}
      {/* ================================================================= */}
      <section className="border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-32 sm:py-40">
          <Animate>
            <div className="mb-20">
              <p className="mb-4 text-[11px] font-normal uppercase tracking-[0.3em] text-zinc-500">
                Security
              </p>
              <h2 className="text-section-heading max-w-lg text-zinc-800">
                Built on trust, enforced by code
              </h2>
            </div>
          </Animate>

          <Animate className="fade-in-up">
            <div className="grid gap-0 border-t border-zinc-200 md:grid-cols-3">
              {[
                {
                  icon: <Shield className="h-5 w-5" />,
                  title: "Regulated custody",
                  desc: "Funds held in a compliant legal structure operated by Exposure. Not by leads, not by projects.",
                },
                {
                  icon: <Lock className="h-5 w-5" />,
                  title: "Zero lead access",
                  desc: "Smart contracts ensure lead investors can never touch, redirect, or withdraw follower funds at any point.",
                },
                {
                  icon: <KeyRound className="h-5 w-5" />,
                  title: "Non-custodial claims",
                  desc: "Tokens distribute directly to your wallet. You hold the keys. No lock-ups beyond the vesting schedule.",
                },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className={`flex flex-col gap-6 border-b border-zinc-200 py-12 pr-12 ${
                    i < 2 ? "md:border-r" : ""
                  } ${i > 0 ? "md:pl-12" : ""}`}
                >
                  <span className="text-zinc-500">{item.icon}</span>
                  <h3 className="font-serif text-xl font-normal text-zinc-800">
                    {item.title}
                  </h3>
                  <p className="text-[15px] font-normal leading-relaxed text-zinc-500">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </Animate>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Final CTA                                                         */}
      {/* ================================================================= */}
      <section className="border-t border-zinc-200">
        <Animate>
          <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-36 text-center sm:py-44">
            <div className="accent-line mx-auto mb-10" />

            <h2 className="text-section-heading text-zinc-800">
              The next generation of
              <br />
              private capital markets
            </h2>

            <p className="mt-8 max-w-md text-lg font-normal leading-relaxed text-zinc-500">
              Join thousands of verified investors accessing institutional-quality
              deal flow through trusted lead investors.
            </p>

            <div className="mt-14">
              <Link href="/deals">
                <button className="group inline-flex items-center gap-3 rounded-sm bg-zinc-900 px-10 py-4 text-[15px] font-medium tracking-wide text-white transition-all duration-300 hover:bg-zinc-800 hover:shadow-[0_0_40px_rgba(0,0,0,0.06)]">
                  Start Investing
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </Link>
            </div>

            <p className="mt-10 text-xs font-normal text-zinc-400">
              Investments involve risk. Past performance is not indicative of
              future results.
            </p>
          </div>
        </Animate>
      </section>
    </div>
  );
}
