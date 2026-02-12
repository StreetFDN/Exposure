import Link from "next/link";
import { Twitter, MessageCircle, Send } from "lucide-react";

// ---------------------------------------------------------------------------
// Footer link config
// ---------------------------------------------------------------------------

const FOOTER_LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/support", label: "Support" },
] as const;

const SOCIAL_LINKS = [
  { href: "https://twitter.com", label: "Twitter / X", icon: Twitter },
  { href: "https://discord.gg", label: "Discord", icon: MessageCircle },
  { href: "https://t.me", label: "Telegram", icon: Send },
] as const;

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        {/* Left — copyright */}
        <p className="text-sm text-zinc-400">
          &copy; 2025 Exposure. All rights reserved.
        </p>

        {/* Center — links */}
        <nav className="flex items-center gap-6">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right — socials */}
        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.href}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-50"
              aria-label={social.label}
            >
              <social.icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
