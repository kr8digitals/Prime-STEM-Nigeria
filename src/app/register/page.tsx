"use client";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  MapPin,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { useContent } from "@/context/content-context";
import { IMAGES } from "@/data/content";
import { RegisterForm } from "@/components/forms";
import { FinalCTA, PageHero } from "@/components/sections";
import { Container, GradientText, Reveal, SectionHeading } from "@/components/ui";

const whyRegister = [
  {
    icon: Trophy,
    title: "Compete for Over ₦2.7M in Prizes",
    text: "Substantial cash prizes, trophies, medals, and plaques awarded to winning students and schools.",
  },
  {
    icon: Rocket,
    title: "Hands-On Practical Learning",
    text: "Immerse in robotics, coding, artificial intelligence, and applied science boot camps.",
  },
  {
    icon: MapPin,
    title: "36 States + Continental Stage",
    text: "Compete locally and qualify for continental events like the African Organic Chemistry Tournament.",
  },
  {
    icon: CalendarDays,
    title: "Official Past Questions & Guides",
    text: "Access 4 years of verified past questions and answers (2022–2025) via the Master Preparatory Guide.",
  },
];

export default function RegisterPage() {
  const { content } = useContent();
  const offer = content.earlyBirdOffer;
  const org = content.organization;
  const events = content.events;
  const [copied, setCopied] = useState(false);

  const bank = offer?.bankDetails || org?.bankDetails || {
    bank: "UNITED BANK FOR AFRICA (UBA)",
    accountName: "PRIME STEM NIGERIA",
    accountNumber: "1025357212",
  };

  const copyBank = () => {
    navigator.clipboard.writeText(bank.accountNumber || "1025357212");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <PageHero
        eyebrow="Registration Portal"
        title={
          <>
            Register for Prime STEM <GradientText>Championships &amp; Camps</GradientText>
          </>
        }
        description="Register candidates for the 5th Edition STEM Kids Championship, African Organic Chemistry Tournament, ANSC, or International STEMx Boot Camp."
        image={IMAGES.hero}
      />

      {/* Early Bird Callout Banner */}
      {offer?.active && (
        <section className="bg-gradient-to-r from-[#0B132B] via-[#1E3A8A] to-[#4C1D95] text-white py-8 border-b border-cyan-400/30">
          <Container>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black text-xl shadow-lg">
                  {offer.feePerCandidate || "₦2k"}
                </span>
                <div>
                  <span className="inline-block rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30 mb-1">
                    Limited Early Bird Offer Active
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {offer.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200">
                    Schools registering {offer.minCandidates} enjoy <strong>{offer.feePerCandidate} per candidate</strong> early bird discount.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {offer.masterGuide?.url && (
                  <a
                    href={offer.masterGuide.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold text-slate-100 ring-1 ring-white/20 hover:bg-white/20 transition flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4 text-amber-300" /> Past Questions (Selar) ↗
                  </a>
                )}
              </div>
            </div>
          </Container>
        </section>
      )}

      <section className="bg-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12">
            {/* Form Column */}
            <div className="lg:col-span-7">
              <SectionHeading
                align="left"
                eyebrow="Online Registration"
                title="Submit Candidate or School Details"
                description="Complete the form below. Our examination coordinator will respond with candidate confirmation and exam guidelines."
              />
              <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-7 shadow-2xl shadow-blue-900/5 sm:p-10">
                <RegisterForm />
              </div>
            </div>

            {/* Sidebar Column: Bank Details & Event Windows */}
            <div className="lg:col-span-5 space-y-6">
              {/* Official Payment Card */}
              <div className="rounded-[2.5rem] bg-gradient-to-br from-[#0B132B] to-[#1E3A8A] p-8 text-white shadow-xl">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Payment Account Details
                    </span>
                  </div>
                  <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-[0.65rem] font-bold text-cyan-200">
                    Official Bank Account
                  </span>
                </div>

                <div className="mt-5 space-y-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[0.7rem]">Bank Name</span>
                    <strong className="text-white text-sm font-bold">{bank.bank}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[0.7rem]">Account Name</span>
                    <strong className="text-cyan-300 text-sm font-black">{bank.accountName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[0.7rem]">Account Number</span>
                    <div className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2 ring-1 ring-white/15 mt-1">
                      <span className="font-mono text-xl font-black text-amber-300 tracking-wider">
                        {bank.accountNumber}
                      </span>
                      <button
                        onClick={copyBank}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950 transition hover:bg-cyan-300"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-white/5 p-3 text-[0.75rem] text-slate-300 border border-white/10">
                  <p className="font-bold text-white mb-1">Payment Instructions:</p>
                  <p>1. Pay early bird fee ({offer?.feePerCandidate || "₦2,000"}/candidate for {offer?.minCandidates || "10+ students"}).</p>
                  <p>2. Send proof of transfer and list of candidates to:</p>
                  <p className="text-cyan-300 mt-1 font-mono">{org?.email || "primestemnigeria@gmail.com"}</p>
                  <p className="text-slate-300">or WhatsApp: <strong className="text-white">{org?.phone || "+234 813 825 8491"}</strong></p>
                </div>
              </div>

              {/* Master Prep Guide Card */}
              {offer?.masterGuide?.url && (
                <div className="rounded-[2.5rem] border border-amber-200 bg-amber-50/60 p-7 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-amber-950">
                        {offer.masterGuide.title || "Master Preparatory Guide Available"}
                      </h4>
                      <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                        Download 4 years of past questions &amp; answers (2022–2025), syllabus breakdown, and winning strategies on Selar.
                      </p>
                      <a
                        href={offer.masterGuide.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-amber-800 hover:text-amber-950 underline"
                      >
                        Access Past Questions on Selar ↗
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Event Windows */}
              <div className="rounded-[2.5rem] border border-slate-200/80 bg-slate-50 p-7">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#172554]">
                  Key Upcoming Examination Dates
                </h3>
                <ul className="mt-4 space-y-3 text-xs">
                  {events.slice(0, 4).map((event) => (
                    <li key={event.sn} className="flex items-start gap-2.5 pb-2.5 border-b border-slate-200/60 last:border-0 last:pb-0">
                      <CalendarDays className="mt-0.5 h-4 w-4 text-[#2563EB] shrink-0" />
                      <div>
                        <p className="font-bold text-slate-800">{event.title}</p>
                        <p className="text-slate-500">{event.date} • {event.location}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Why Register Grid */}
      <section className="bg-slate-50 py-20 sm:py-28 border-t border-slate-200/80">
        <Container>
          <SectionHeading
            eyebrow="Why Register With Prime STEM"
            title="The Benefits of Participation"
            description="Clear recognition pathways, substantial financial rewards, and academic visibility."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyRegister.map((item, i) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 text-white shadow-md">
                  <item.icon className="h-6 w-6" />
                </span>
                <h4 className="mt-4 font-black text-[#172554] text-base">{item.title}</h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}
