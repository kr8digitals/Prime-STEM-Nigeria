"use client";

import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Handshake,
  Layers,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { useContent } from "@/context/content-context";
import {
  EventCard,
  PartnerTile,
  ProgramCard,
  TeamCard,
  WinnerCard,
} from "@/components/cards";
import { ButtonLink, Container, Counter, Reveal, SectionHeading } from "@/components/ui";

// -------------------------------------------------------------
// PAGE HERO — standard hero for inner pages
// -------------------------------------------------------------
export function PageHero({
  eyebrow,
  title,
  description,
  image,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  image?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[#0B132B]">
      <div className="pointer-events-none absolute inset-0">
        {image && (
          <img src={image} alt="" className="h-full w-full object-cover opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B132B]/80 via-[#0B132B]/90 to-[#0B132B]" />
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-purple-600/25 blur-3xl" />
      </div>
      <Container className="relative py-20 text-center sm:py-28">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-cyan-300 ring-1 ring-white/15">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            {description}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

// -------------------------------------------------------------
// IMPACT STATISTICS
// -------------------------------------------------------------
export function StatsSection() {
  const { content } = useContent();
  const stats = content.stats;

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#0B132B] via-[#172554] to-[#1E1B4B] border-y border-white/10">
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />
      <Container className="relative grid grid-cols-2 gap-8 py-16 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 100} className="text-center group">
            <p className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-4xl font-black text-transparent sm:text-5xl transition-transform duration-300 group-hover:scale-105">
              {stat.plain ? (
                stat.value.toLocaleString() + (stat.suffix ? " " + stat.suffix : "")
              ) : stat.isCurrency ? (
                <span>
                  ₦<Counter value={stat.value} suffix={stat.suffix} />
                </span>
              ) : (
                <Counter value={stat.value} suffix={stat.suffix} />
              )}
            </p>
            <p className="mt-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
              {stat.label}
            </p>
          </Reveal>
        ))}
      </Container>
    </section>
  );
}

// -------------------------------------------------------------
// EARLY BIRD & BANK DETAILS BANNER
// -------------------------------------------------------------
export function EarlyBirdSpotlightSection() {
  const { content } = useContent();
  const offer = content.earlyBirdOffer;
  const [copied, setCopied] = useState(false);

  if (!offer?.active) return null;

  const copyBank = () => {
    navigator.clipboard.writeText(offer.bankDetails?.accountNumber || "1025357212");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#312E81] py-14 text-white">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
      <Container className="relative">
        <div className="rounded-3xl border border-white/15 bg-white/5 p-8 sm:p-12 backdrop-blur-xl shadow-2xl transition hover:border-cyan-400/30">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">
                <Sparkles className="h-3.5 w-3.5" /> Official Announcement
              </span>
              <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl lg:text-4xl leading-tight">
                {offer.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-200">
                Schools registering {offer.minCandidates || "10 candidates or more"} can take advantage of our special Early Bird registration fee of just <strong className="text-amber-300 font-extrabold text-lg">{offer.feePerCandidate || "₦2,000"} per candidate</strong>. Open to pupils in Basic 3–6 and Junior Secondary JSS 1–3.
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/register?program=skc"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 active:scale-95"
                >
                  Register Candidates Now <ArrowRight className="h-4 w-4" />
                </Link>
                {offer.masterGuide?.url && (
                  <a
                    href={offer.masterGuide.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
                  >
                    <BookOpen className="h-4 w-4 text-amber-300" /> Master Preparatory Guide (Selar) ↗
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-cyan-400/30 bg-[#0B132B]/80 p-6 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Official Payment Details
                  </span>
                  <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-[0.7rem] font-bold text-cyan-200">
                    Direct Bank Transfer
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Bank Name</span>
                    <strong className="text-white text-base">{offer.bankDetails?.bank || "UNITED BANK FOR AFRICA (UBA)"}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Account Name</span>
                    <strong className="text-cyan-300 text-base font-extrabold">{offer.bankDetails?.accountName || "PRIME STEM NIGERIA"}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Account Number</span>
                    <div className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2 ring-1 ring-white/15 mt-1">
                      <span className="font-mono text-xl font-black text-amber-300 tracking-wider">
                        {offer.bankDetails?.accountNumber || "1025357212"}
                      </span>
                      <button
                        onClick={copyBank}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-1 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 active:scale-95"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <p className="text-[0.7rem] text-slate-400 pt-2 border-t border-white/10">
                    * After payment, send payment receipt and candidate list to <a href="mailto:primestemnigeria@gmail.com" className="text-cyan-300 underline">primestemnigeria@gmail.com</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// -------------------------------------------------------------
// STEM GUIDE FOR SCHOOLS SPOTLIGHT
// -------------------------------------------------------------
export function StemGuideSpotlightSection() {
  const { content } = useContent();
  const guide = content.stemGuideForSchools;

  return (
    <section className="bg-slate-50 py-20 sm:py-28 border-y border-slate-200/80">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              <BookOpen className="h-4 w-4" /> {guide.status || "Coming Soon"} — Teacher Resource
            </span>
            <h2 className="mt-5 text-3xl font-black text-[#172554] sm:text-4xl lg:text-5xl leading-tight">
              {guide.title}
            </h2>
            <p className="mt-3 text-lg font-bold text-blue-700">
              {guide.subtitle}
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              {guide.description}
            </p>
            <div className="mt-6 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
              <p className="font-extrabold text-[#172554] text-sm">
                The Goal is Simple:
              </p>
              <p className="mt-1 text-sm text-slate-700 italic">
                “{guide.mission || "To help teachers move from 'teaching STEM' to actually getting students to DO STEM."}”
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/services#stem-guide"
                className="inline-flex items-center gap-2 rounded-full bg-[#172554] px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#1E3A8A]"
              >
                Learn More About The Guide <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact?subject=Pre-Order+STEM+Guide+for+Schools"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#172554] ring-1 ring-slate-300 transition hover:bg-slate-50"
              >
                Pre-Order / Get Notified
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl">
              <h3 className="text-xl font-extrabold text-[#172554] flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#2563EB]" />
                What Will Teachers Find Inside?
              </h3>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {guide.highlights?.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Prepared For:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {guide.audience?.map((aud) => (
                    <span key={aud} className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#2563EB]">
                      {aud}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// -------------------------------------------------------------
// FEATURED PROGRAMS
// -------------------------------------------------------------
export function FeaturedProgramsSection({ limit }: { limit?: number }) {
  const { content } = useContent();
  const programs = limit ? content.programs.slice(0, limit) : content.programs;

  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Flagship Initiatives"
          title="Our Signature Programs"
          description="Crafted to spark curiosity, foster critical thinking, and equip young learners with future-ready skills in a rapidly changing world."
        />
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program, i) => (
            <Reveal key={program.slug} delay={(i % 3) * 100}>
              <ProgramCard program={program} index={i} />
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center">
          <ButtonLink href="/programs" variant="primary" size="lg">
            Explore All Programs <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

// -------------------------------------------------------------
// UPCOMING PROGRAMS & 2026/2027 ACADEMIC SESSION CALENDAR
// -------------------------------------------------------------
export function UpcomingSection() {
  const { content } = useContent();
  const events = content.events;
  const [selectedTerm, setSelectedTerm] = useState<string>("All");

  const filteredEvents =
    selectedTerm === "All"
      ? events
      : events.filter((e) => e.term === selectedTerm);

  return (
    <section className="bg-slate-50 py-20 sm:py-28 border-y border-slate-200/80">
      <Container>
        <SectionHeading
          eyebrow="2026/2027 Academic Session Calendar"
          title="Major Events & Examinations"
          description="Official schedule published by Prime STEM Nigeria Management covering the nationwide Award Distribution Tour, Teacher Hangouts, AOCT, ANSC, SCI-SPELL, and STEMx Bootcamp 5.0."
        />

        {/* Term Tabs */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {["All", "First Term", "Second Term", "Third Term"].map((term) => (
            <button
              key={term}
              onClick={() => setSelectedTerm(term)}
              className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all duration-300 ${
                selectedTerm === term
                  ? "bg-[#172554] text-white shadow-lg"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50"
              }`}
            >
              {term === "All" ? `All Major Events (${events.length})` : term}
            </button>
          ))}
        </div>

        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event, i) => (
            <Reveal key={event.title + i} delay={(i % 3) * 100}>
              <EventCard event={event} index={i} />
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <ButtonLink href="/register" variant="gradient" size="lg">
            Register for Examination or Event <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <a
            href="https://selar.com/k484f98wdl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#172554] ring-1 ring-slate-300 transition hover:bg-slate-50"
          >
            <BookOpen className="h-4 w-4 text-amber-500" /> Download Master Preparatory Guide ↗
          </a>
        </div>
      </Container>
    </section>
  );
}

// -------------------------------------------------------------
// PAST WINNERS
// -------------------------------------------------------------
export function WinnersSection() {
  const { content } = useContent();
  const winners = content.winners;

  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Hall of Fame & Honourees"
          title="Celebrating Real Champions & Winners"
          description="Honouring exceptional candidates and schools that have earned national acclaim, trophies, and over ₦2.7 million in cash awards through Prime STEM Nigeria competitions."
        />
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {winners.slice(0, 8).map((winner, i) => (
            <Reveal key={winner.name + i} delay={(i % 4) * 100}>
              <WinnerCard winner={winner} />
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center">
          <ButtonLink href="/gallery" variant="outline" size="lg">
            View All Champions &amp; Award Photos in Gallery <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

// -------------------------------------------------------------
// PARTNERS & SPONSORS
// -------------------------------------------------------------
export function PartnersSection({ compact }: { compact?: boolean }) {
  const { content } = useContent();
  const partners = content.partners;
  const accreditedSchools = content.accreditedSchools;

  return (
    <section className="bg-slate-50 py-20 sm:py-28 border-y border-slate-200/80">
      <Container>
        <SectionHeading
          eyebrow="Collaborative Ecosystem"
          title="Our Partners & Benefactors"
          description="Prime STEM Nigeria is proud to collaborate with esteemed international development initiatives, corporate benefactors, media networks, and technology leaders."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {partners.map((partner, i) => (
            <Reveal key={partner.name + i} delay={(i % 4) * 80}>
              <PartnerTile partner={partner} />
            </Reveal>
          ))}
        </div>

        {/* Accredited Partner Schools */}
        <div className="mt-16 rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-sm">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Trusted Nationwide
            </span>
            <h3 className="mt-3 text-2xl font-black text-[#172554]">
              Accredited Participating Schools
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Hundreds of forward-thinking institutions across all 36 states and the FCT compete, learn, and excel with Prime STEM Nigeria.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {accreditedSchools.map((school) => (
              <span
                key={school}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 transition"
              >
                🏫 {school}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <ButtonLink href="/partners" variant="outline" size="lg">
            Partnership Opportunities
          </ButtonLink>
          <ButtonLink href="/contact" variant="gradient" size="lg">
            <Handshake className="h-5 w-5" /> Partner With Us
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

// -------------------------------------------------------------
// TEAM
// -------------------------------------------------------------
export function TeamSection() {
  const { content } = useContent();
  const team = content.team;

  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Our Leadership"
          title="The Team Behind Prime STEM"
          description="Dedicated educators, competition organizers, and technology innovators united to transform African education through STEM."
        />
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, i) => (
            <Reveal key={member.name + i} delay={(i % 4) * 100}>
              <TeamCard member={member} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

// -------------------------------------------------------------
// FINAL CTA
// -------------------------------------------------------------
export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#0B132B] py-20 sm:py-28 text-white">
      <div className="pointer-events-none absolute inset-0">
        <img
          src="/images/bootcamp/stemx-cohort-group.jpg"
          alt="Prime STEM Bootcamp Cohort"
          className="h-full w-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B132B] via-[#0B132B]/95 to-[#172554]" />
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />
      </div>
      <Container className="relative text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-cyan-300 ring-1 ring-white/15">
            <Sparkles className="h-3.5 w-3.5" /> Join the Movement
          </span>
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
            Ignite Your Students&apos; Potential with Prime STEM Nigeria
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-300">
            Whether you are registering students for the 5th Edition STEM Kids Championship at the ₦2,000 Early Bird rate, bringing laptops to your school, or partnering with us — there is a place for you at Prime STEM Nigeria.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink href="/register" variant="gradient" size="lg">
              Register for Competition (₦2k Early Bird) <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/contact" variant="white" size="lg">
              <Handshake className="h-5 w-5" /> Partner or Sponsor
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
