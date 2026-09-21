"use client";

import {
  ArrowRight,
  Atom,
  Award,
  BookOpen,
  CheckCircle2,
  Cpu,
  FlaskConical,
  GraduationCap,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useContent } from "@/context/content-context";
import { HELP_CARDS, IMAGES, WHY_PRIME } from "@/data/content";
import { HelpCard, ValueCard } from "@/components/cards";
import {
  EarlyBirdSpotlightSection,
  FeaturedProgramsSection,
  FinalCTA,
  PartnersSection,
  StatsSection,
  StemGuideSpotlightSection,
  TeamSection,
  UpcomingSection,
  WinnersSection,
} from "@/components/sections";
import {
  ButtonLink,
  Container,
  GradientText,
  MarqueeTicker,
  Reveal,
  SectionHeading,
} from "@/components/ui";

function Hero() {
  const { content } = useContent();
  const offer = content.earlyBirdOffer;
  const org = content.organization;

  const floatingBadges = [
    { text: offer?.title || "5th Edition SKC Open", icon: Trophy, color: "border-amber-400/40 text-amber-300 bg-amber-500/10" },
    { text: `${offer?.feePerCandidate || "₦2,000"} Early Bird Rate`, icon: Sparkles, color: "border-cyan-400/40 text-cyan-300 bg-cyan-500/10" },
    { text: "Over ₦2.7M Awarded", icon: Award, color: "border-emerald-400/40 text-emerald-300 bg-emerald-500/10" },
    { text: "36 States + FCT Tour", icon: Rocket, color: "border-purple-400/40 text-purple-300 bg-purple-500/10" },
  ];

  const marqueeItems = [
    "🏅 5th Edition STEM Kids Championship Open (₦2,000 Early Bird)",
    "🏆 Over ₦2,700,000 in Cash Prizes & Awards Distributed",
    "🤝 Partnered with UNDP / NJFP & AFRISTEM Africa STEM Education Network",
    "🏫 NTIC Abuja • Bright Sun College Lagos • Preston Int'l Akure • Mayfair Academy",
    "📚 Selar Master Prep Guide (Past Questions 2022-2025)",
    "🚀 Nationwide 2026/2027 Award Distribution Tour across 36 States + FCT",
    "💡 Practical STEM Guide Handbook for Teachers & Schools",
    `🇳🇬 ${org.cac || "CAC Registered: PRIME STEM INNOVATION AND TECH ACADEMY"}`,
  ];

  return (
    <section className="relative overflow-hidden bg-[#0B132B]">
      {/* Background Image with Dark Vignette Gradient */}
      <div className="absolute inset-0">
        <img
          src={IMAGES.hero}
          alt="2025 Nigerian STEM Championship Winners with ceremonial cheques on stage"
          className="h-full w-full object-cover opacity-35 object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0B132B] via-[#0B132B]/85 to-[#172554]/75" />
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-purple-600/25 blur-3xl" />
      </div>

      <Container className="relative py-20 sm:py-28 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Main Hero Copy */}
          <div className="lg:col-span-7">
            <Reveal>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300 ring-1 ring-white/15 backdrop-blur">
                  <Atom className="h-4 w-4" />
                  {org.cac}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">
                  <Trophy className="h-3.5 w-3.5" /> 5th Edition SKC Live
                </span>
              </div>

              <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Transforming Africa Through{" "}
                <GradientText>STEM, Innovation</GradientText> &amp; Real Opportunity
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Prime STEM Nigeria empowers young minds across Nigeria and Africa to discover their potential through prestigious competitions, hands-on boot camps, teacher enablement, and technology access.
              </p>

              {/* Badges strip */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                {floatingBadges.map((b) => (
                  <span
                    key={b.text}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md ${b.color}`}
                  >
                    <b.icon className="h-3.5 w-3.5" />
                    {b.text}
                  </span>
                ))}
              </div>

              {/* Call to action buttons */}
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <ButtonLink href="/register" variant="gradient" size="lg">
                  Register Candidate ({offer?.feePerCandidate || "₦2k"} Early Bird) <ArrowRight className="h-5 w-5" />
                </ButtonLink>
                <ButtonLink href="/programs" variant="white" size="lg">
                  Explore Programs
                </ButtonLink>
                {offer?.masterGuide?.url && (
                  <a
                    href={offer.masterGuide.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-4 text-base font-bold text-slate-200 ring-1 ring-white/20 transition hover:bg-white/20 hover:text-white"
                  >
                    <BookOpen className="h-4 w-4 text-amber-300" /> Past Questions
                  </a>
                )}
              </div>
            </Reveal>
          </div>

          {/* Authentic Real Ceremony Card Preview */}
          <div className="lg:col-span-5">
            <Reveal delay={150}>
              <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl animate-float">
                <div className="relative h-64 sm:h-72 overflow-hidden rounded-2xl bg-slate-900">
                  <img
                    src="/images/awards/championship-2025-winners-stage.jpg"
                    alt="2025 Nigerian STEM Championship Winners on Stage"
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B]/90 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div>
                      <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[0.65rem] font-black uppercase text-slate-950">
                        Over ₦2.7M Awarded
                      </span>
                      <p className="mt-1 text-xs font-extrabold text-white">
                        2025 Nigerian STEM Championship Winners
                      </p>
                    </div>
                    <span className="rounded-lg bg-emerald-500/90 px-2 py-1 text-[0.65rem] font-bold text-white flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Real Winners
                    </span>
                  </div>
                </div>

                {/* Quick Stats Grid inside card */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-white">
                  <div className="rounded-xl bg-white/10 p-2.5">
                    <p className="text-base font-black text-cyan-300">₦1.0M</p>
                    <p className="text-[0.65rem] text-slate-300 uppercase font-bold">Top Prize</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-2.5">
                    <p className="text-base font-black text-amber-300">{offer?.feePerCandidate || "₦2,000"}</p>
                    <p className="text-[0.65rem] text-slate-300 uppercase font-bold">Early Bird</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-2.5">
                    <p className="text-base font-black text-emerald-300">36 + FCT</p>
                    <p className="text-[0.65rem] text-slate-300 uppercase font-bold">States</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>

      {/* Marquee Ticker */}
      <div className="border-t border-white/10 bg-black/40 backdrop-blur">
        <MarqueeTicker items={marqueeItems} />
      </div>

      {/* Bottom curve */}
      <div className="relative -mb-px h-8 w-full rounded-t-[50%] bg-white" />
    </section>
  );
}

function WhoWeAre() {
  const points = [
    "Nationwide & Continental STEM competitions (SKC, AOCT, ANSC, SCI-SPELL)",
    "Hands-on technology boot camps in robotics, coding, AI & digital innovation",
    "Teacher training, digital literacy hangouts & practical STEM handbooks",
    "Laptops for Schools Project with flexible pay-on-delivery options",
    "Statewide Award Distribution Tour celebrating top schools in all 36 states + FCT",
  ];
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <div className="overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-900/15 border border-slate-100">
                <img
                  src={IMAGES.whoWeAre}
                  alt="Young Nigerian students participating in STEM boot camp"
                  className="h-[480px] w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-4 rounded-3xl bg-gradient-to-br from-[#172554] via-blue-600 to-purple-700 p-6 text-white shadow-2xl shadow-blue-600/30 sm:-right-6">
                <p className="text-3xl font-black">2022</p>
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  CAC Registered • Founded
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <SectionHeading
              align="left"
              eyebrow="Who We Are"
              title="Building the Next Generation of African Innovators"
              description="Prime STEM Nigeria is a dynamic institution devoted to the promotion and advancement of Science, Technology, Engineering, and Mathematics (STEM) education among Nigerian children and youth."
            />
            <p className="-mt-6 text-base leading-relaxed text-slate-600">
              Our mission is to be among the leading institutions in Africa in driving STEM education through well-structured programs and curricula. Guided by our core values of <strong>Trustworthiness, Reliability, Intentionality, and Accountability</strong>, we create platforms where learners turn curiosity into real capability.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-1">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <ButtonLink href="/about" variant="primary" size="lg">
                Our Story, Mission &amp; Values <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function HowCanWeHelp() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-28 border-t border-slate-200/80">
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />
      <Container className="relative">
        <SectionHeading
          eyebrow="Comprehensive Offerings"
          title="Support for Every STEM Journey"
          description="Whether you are a student, parent, science educator, school administrator, or corporate partner — Prime STEM Nigeria provides structured pathways for excellence."
        />
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_CARDS.map((card, i) => (
            <Reveal key={card.title} delay={(i % 3) * 100}>
              <HelpCard {...card} index={i} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function WhyPrime() {
  const { content } = useContent();
  const org = content.organization;

  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Why Choose Prime STEM Nigeria?"
          title="Transforming Potential Into Achievement"
          description="A learner-centric institution combining rigorous academic standards, verified cash prize awards, global mentors, and nationwide reach."
        />
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_PRIME.map((item, i) => (
            <Reveal key={item.title} delay={(i % 4) * 100}>
              <ValueCard {...item} index={i} />
            </Reveal>
          ))}
        </div>

        {/* Tagline Banner */}
        <div className="mt-16 overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#0B132B] via-[#1E3A8A] to-[#4C1D95] p-8 text-center shadow-2xl shadow-slate-900/20 sm:p-14 text-white">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 ring-1 ring-white/20">
            Our Creed
          </span>
          <p className="mx-auto mt-4 max-w-3xl text-2xl font-black leading-relaxed sm:text-3xl">
            “{org.tagline || "Nurturing Curious Minds, Shaping Future Leaders"}”
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-slate-300">
            {org.name} • {org.cac}
          </p>
        </div>
      </Container>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <EarlyBirdSpotlightSection />
      <WhoWeAre />
      <FeaturedProgramsSection limit={6} />
      <StemGuideSpotlightSection />
      <HowCanWeHelp />
      <WhyPrime />
      <WinnersSection />
      <UpcomingSection />
      <PartnersSection />
      <TeamSection />
      <FinalCTA />
    </>
  );
}
