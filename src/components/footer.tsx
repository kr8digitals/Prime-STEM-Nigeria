"use client";

import { CreditCard, Mail, MapPin, Phone, Lock } from "lucide-react";
import Link from "next/link";
import { useContent } from "@/context/content-context";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
    </svg>
  );
}

export default function Footer() {
  const { content } = useContent();
  const org = content.organization;
  const programs = content.programs;

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Programs", href: "/programs" },
    { label: "Services", href: "/services" },
    { label: "For Schools", href: "/for-schools" },
    { label: "Gallery", href: "/gallery" },
    { label: "News & Events", href: "/news" },
    { label: "Partners", href: "/partners" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#0B132B] text-slate-300">
      {/* Decorative gradient glow */}
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* Official Bank Account Ribbon */}
      <div className="border-b border-white/10 bg-white/5 px-5 py-6 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 shadow-md">
              <CreditCard className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Official Registration Bank Account
              </p>
              <p className="text-sm font-semibold text-white">
                Account Name: <strong className="text-cyan-300 font-extrabold">{org.bankDetails?.accountName || "PRIME STEM NIGERIA"}</strong> | Bank: <strong className="text-white">{org.bankDetails?.bank || "UNITED BANK FOR AFRICA (UBA)"}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15">
            <span className="text-xs text-slate-300">Account No:</span>
            <span className="font-mono text-base font-extrabold tracking-wider text-cyan-300">
              {org.bankDetails?.accountNumber || "1025357212"}
            </span>
            <span className="text-xs rounded bg-cyan-500/20 px-2 py-0.5 text-cyan-200 font-bold">
              UBA
            </span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1 ring-1 ring-white/20 shadow-md">
                <img
                  src="/images/logo-tight.png"
                  alt="Prime STEM Nigeria"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="flex flex-col leading-none">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  PRIME <span className="text-cyan-400">STEM</span>
                </span>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-slate-400">
                  Nigeria
                </span>
              </span>
            </div>
            <p className="mt-4 text-xs font-semibold text-cyan-300">
              {org.cac}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Devoted to the promotion and advancement of Science, Technology, Engineering, and Mathematics (STEM) education among Nigerian children and youth. Building Africa&apos;s next generation of innovators.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={org.socials?.facebook || "https://www.facebook.com/share/1DG9TDLBFE/"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white"
              >
                <FacebookIcon className="h-4.5 w-4.5" />
              </a>
              <a
                href={org.socials?.twitter || "https://x.com/primestemng"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-slate-700 hover:text-white"
              >
                <XIcon className="h-4.5 w-4.5" />
              </a>
              <a
                href={org.socials?.youtube || "https://www.youtube.com/@primestemnigeria"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-red-600 hover:text-white"
              >
                <YoutubeIcon className="h-4.5 w-4.5" />
              </a>
              <a
                href={org.socials?.instagram || "https://instagram.com/primestem_nigeria"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-pink-600 hover:text-white"
              >
                <InstagramIcon className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Navigation
            </h3>
            <ul className="mt-5 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-cyan-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://selar.com/k484f98wdl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-amber-300 hover:text-amber-200"
                >
                  Past Questions ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Programs */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Flagship Programs
            </h3>
            <ul className="mt-5 space-y-2.5">
              {programs.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/programs/${p.slug}`}
                    className="text-sm text-slate-400 transition hover:text-cyan-300"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Offices &amp; Contact
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-slate-400">
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4.5 w-4.5 shrink-0 text-cyan-400" />
                <a href={`mailto:${org.email}`} className="hover:text-cyan-300">
                  {org.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4.5 w-4.5 shrink-0 text-cyan-400" />
                <div>
                  <a href={`tel:${org.phoneHref}`} className="block hover:text-cyan-300">
                    {org.phone}
                  </a>
                  {org.secondaryPhone && (
                    <a href={`tel:${org.secondaryPhone.replace(/\s+/g, "")}`} className="block text-xs text-slate-500 hover:text-cyan-300">
                      {org.secondaryPhone}
                    </a>
                  )}
                </div>
              </li>
              {org.offices?.map((office) => (
                <li key={office.name} className="flex gap-3">
                  <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-cyan-400" />
                  <span className="text-xs leading-relaxed">
                    <strong className="block font-semibold text-slate-200">{office.name}</strong>
                    {office.address}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {org.name}. CAC Registered Education Institution. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-cyan-300">About</Link>
            <Link href="/partners" className="hover:text-cyan-300">Partners</Link>
            <Link href="/for-schools" className="hover:text-cyan-300">For Schools</Link>
            <Link href="/contact" className="hover:text-cyan-300">Contact</Link>
            <Link href="/admin" className="flex items-center gap-1 text-slate-400 hover:text-amber-300">
              <Lock className="h-3 w-3" /> Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
