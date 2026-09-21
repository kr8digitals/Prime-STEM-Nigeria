"use client";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronDown,
  Copy,
  Check,
  Mail,
  Menu,
  Phone,
  Sparkles,
  X,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useContent } from "@/context/content-context";

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-slate-200/80 shadow-md transition-transform duration-300 group-hover:scale-105">
        <img
          src="/images/logo-tight.png"
          alt="Prime STEM Nigeria"
          className="h-full w-full object-contain"
        />
      </div>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-[#172554] transition group-hover:text-[#2563EB]">
          PRIME <span className="text-[#2563EB]">STEM</span>
        </span>
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-slate-500">
          Nigeria
        </span>
      </span>
    </Link>
  );
}

function EarlyBirdBar() {
  const { content } = useContent();
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const offer = content.earlyBirdOffer;
  if (dismissed || !offer?.active) return null;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(offer.bankDetails?.accountNumber || "1025357212");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative border-b border-cyan-400/30 bg-gradient-to-r from-[#0B132B] via-[#1E3A8A] to-[#4C1D95] px-4 py-2 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30 animate-pulse">
            <Sparkles className="h-3 w-3" /> Early Bird Active
          </span>
          <span className="font-semibold text-slate-100">
            {offer.title} — <strong className="text-cyan-300 font-extrabold">{offer.feePerCandidate}</strong> ({offer.minCandidates})
          </span>
          <span className="hidden text-slate-400 sm:inline">•</span>
          <span className="hidden items-center gap-1.5 text-slate-300 md:inline-flex">
            Pay to {offer.bankDetails?.bank || "UBA"}: <strong className="font-mono text-white">{offer.bankDetails?.accountNumber || "1025357212"}</strong>
            <button
              onClick={handleCopyAccount}
              className="ml-1 inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[0.7rem] font-semibold text-cyan-200 transition hover:bg-white/20 active:scale-95"
              title="Copy Bank Account Number"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-1 font-bold text-cyan-300 transition hover:text-white"
          >
            Register Now <ArrowRight className="h-3 w-3" />
          </Link>
          {offer.masterGuide?.url && (
            <a
              href={offer.masterGuide.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 font-semibold text-slate-200 transition hover:bg-white/20 lg:inline-flex"
            >
              <BookOpen className="h-3 w-3 text-amber-300" /> Past Questions
            </a>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="rounded p-0.5 text-slate-400 transition hover:text-white"
            aria-label="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const { content } = useContent();
  const [open, setOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [mobileProgramsOpen, setMobileProgramsOpen] = useState(false);

  const org = content.organization;
  const programs = content.programs;

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Programs", href: "/programs", children: true },
    { label: "Services", href: "/services" },
    { label: "For Schools", href: "/for-schools" },
    { label: "Gallery", href: "/gallery" },
    { label: "News & Events", href: "/news" },
    { label: "Partners", href: "/partners" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50">
      <EarlyBirdBar />

      {/* Top bar */}
      <div className="hidden bg-[#0B132B] text-slate-200 lg:block border-b border-white/5">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-2 text-xs font-medium">
          <div className="flex items-center gap-6">
            <a href={`mailto:${org.email}`} className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 transition">
              <Mail className="h-3.5 w-3.5 text-cyan-400" />
              {org.email}
            </a>
            <a href={`tel:${org.phoneHref}`} className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 transition">
              <Phone className="h-3.5 w-3.5 text-cyan-400" />
              {org.phone}
            </a>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 font-normal">
              {org.cac}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <a
              href={org.socials?.facebook || "https://www.facebook.com/share/1DG9TDLBFE/"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-300 hover:text-white transition"
            >
              Facebook: Prime STEM Nigeria
            </a>
            <span className="text-slate-600">•</span>
            <Link href="/news" className="hover:text-cyan-300 transition">
              2026/2027 Calendar
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-slate-400 hover:text-amber-300 transition"
              title="Admin Portal"
            >
              <Lock className="h-3 w-3" /> Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="border-b border-slate-100 bg-white/95 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 xl:flex">
            {navItems.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setProgramsOpen(true)}
                  onMouseLeave={() => setProgramsOpen(false)}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#2563EB]"
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                  {programsOpen && (
                    <div className="absolute left-1/2 top-full w-[400px] -translate-x-1/2 pt-2">
                      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-2xl shadow-slate-900/15">
                        <div className="grid gap-1">
                          {programs.map((p) => (
                            <Link
                              key={p.slug}
                              href={`/programs/${p.slug}`}
                              className="group flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-blue-50/80"
                            >
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-600/20 text-xs font-black text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition">
                                {p.shortName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-[#172554] group-hover:text-[#2563EB] transition">
                                  {p.name}
                                </span>
                                <span className="block text-xs text-slate-500 line-clamp-1">
                                  {p.tagline}
                                </span>
                              </div>
                            </Link>
                          ))}
                          <div className="mt-2 flex gap-2 border-t border-slate-100 pt-2">
                            <Link
                              href="/programs"
                              className="flex-1 rounded-xl bg-[#172554] px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-[#1E3A8A]"
                            >
                              View All Programs →
                            </Link>
                            <a
                              href="https://selar.com/k484f98wdl"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl bg-amber-500/10 px-3 py-2 text-center text-xs font-bold text-amber-700 transition hover:bg-amber-500/20"
                            >
                              Past Questions ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-[#2563EB]"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="hidden rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-700/35 sm:inline-flex"
            >
              Register Now ({content.earlyBirdOffer?.feePerCandidate || "₦2k"})
            </Link>
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-[#172554] transition hover:bg-slate-50 xl:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-slate-100 bg-white xl:hidden shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="mx-auto max-w-7xl space-y-1 px-5 py-4 sm:px-8">
              {navItems.map((item) =>
                item.children ? (
                  <div key={item.label}>
                    <button
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-blue-50"
                      onClick={() => setMobileProgramsOpen(!mobileProgramsOpen)}
                    >
                      {item.label}
                      <ChevronDown className={`h-4 w-4 transition ${mobileProgramsOpen ? "rotate-180" : ""}`} />
                    </button>
                    {mobileProgramsOpen && (
                      <div className="mb-2 ml-3 space-y-1 border-l-2 border-blue-200 pl-3">
                        {programs.map((p) => (
                          <Link
                            key={p.slug}
                            href={`/programs/${p.slug}`}
                            onClick={() => setOpen(false)}
                            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#2563EB]"
                          >
                            {p.name}
                          </Link>
                        ))}
                        <Link
                          href="/programs"
                          onClick={() => setOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm font-bold text-[#2563EB] hover:bg-blue-50"
                        >
                          View All Programs →
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-blue-50 hover:text-[#2563EB]"
                  >
                    {item.label}
                  </Link>
                )
              )}

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/25"
                >
                  Register Now ({content.earlyBirdOffer?.feePerCandidate || "₦2k"} Early Bird)
                </Link>
                <a
                  href="https://selar.com/k484f98wdl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-full bg-amber-500/10 px-6 py-3 text-center text-sm font-bold text-amber-800"
                >
                  Master Preparatory Guide (Selar) ↗
                </a>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="block text-center text-xs text-slate-500 hover:text-slate-800 py-2"
                >
                  Admin Powerhouse Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
