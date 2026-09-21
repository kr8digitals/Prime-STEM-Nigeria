import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  MapPin,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EARLY_BIRD_OFFER, ORGANIZATION, PROGRAMS } from "@/data/content";
import { ProgramCard } from "@/components/cards";
import { FinalCTA, PageHero } from "@/components/sections";
import {
  Badge,
  ButtonLink,
  Container,
  GradientText,
  Icon,
  Reveal,
  SectionHeading,
} from "@/components/ui";

export function generateStaticParams() {
  return PROGRAMS.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = PROGRAMS.find((p) => p.slug === slug);
  if (!program) return { title: "Programme Not Found" };
  return {
    title: `${program.name} | Prime STEM Nigeria`,
    description: program.tagline,
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = PROGRAMS.find((p) => p.slug === slug);

  if (!program) notFound();

  const related = PROGRAMS.filter((p) => p.slug !== program.slug).slice(0, 3);
  const isSKC = program.slug === "stem-kids-championship";

  return (
    <>
      <PageHero
        eyebrow={program.category}
        title={program.name}
        description={program.tagline}
        image={program.image}
      />

      {/* Special Early Bird Banner for SKC */}
      {isSKC && (
        <section className="bg-gradient-to-r from-[#0B132B] via-[#1E3A8A] to-[#4C1D95] text-white py-6 border-b border-cyan-400/30">
          <Container>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black">
                  ₦2k
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    5th Edition Early Bird Discount Active
                  </p>
                  <p className="text-sm font-semibold text-slate-100">
                    Schools registering 10+ candidates pay only <strong>₦2,000 per candidate</strong>!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://selar.com/k484f98wdl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-cyan-200 ring-1 ring-white/20 hover:bg-white/20 transition flex items-center gap-1.5"
                >
                  <BookOpen className="h-3.5 w-3.5 text-amber-300" /> Past Questions (Selar) ↗
                </a>
                <Link
                  href="/register?program=skc"
                  className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md hover:brightness-110 transition"
                >
                  Register Candidates
                </Link>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* Overview */}
      <section className="bg-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-14 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <SectionHeading
                align="left"
                eyebrow="Overview"
                title={`About ${program.name}`}
              />
              <div className="-mt-4 space-y-4 text-base leading-relaxed text-slate-600">
                <p>{program.overview}</p>
                <p>{program.description}</p>
              </div>

              {/* Cash Prizes Callout */}
              {program.cashPrizes && (
                <div className="mt-8 rounded-3xl border border-amber-500/30 bg-amber-50/50 p-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-900">
                      Prizes &amp; Recognition
                    </h3>
                    <p className="mt-1 text-sm font-extrabold text-amber-950">
                      {program.cashPrizes}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/80 bg-slate-50/60 p-7">
                  <CalendarDays className="h-7 w-7 text-[#2563EB]" />
                  <h3 className="mt-4 text-xs font-extrabold uppercase tracking-wider text-[#172554]">
                    Date &amp; Schedule
                  </h3>
                  <p className="mt-1 font-bold text-slate-800">{program.date}</p>
                </div>
                <div className="rounded-3xl border border-slate-200/80 bg-slate-50/60 p-7">
                  <MapPin className="h-7 w-7 text-[#2563EB]" />
                  <h3 className="mt-4 text-xs font-extrabold uppercase tracking-wider text-[#172554]">
                    Location &amp; Delivery
                  </h3>
                  <p className="mt-1 font-bold text-slate-800">{program.location}</p>
                  <div className="mt-2">
                    <Badge tone="cyan">{program.format}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="flex items-center gap-2 text-xl font-extrabold text-[#172554]">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  Core Objectives
                </h3>
                <ul className="mt-5 space-y-3">
                  {program.objectives.map((obj) => (
                    <li key={obj} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Master Prep Guide Callout for SKC */}
              {isSKC && (
                <div className="mt-10 rounded-3xl border border-blue-200 bg-blue-50/60 p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-md">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="rounded bg-blue-200/70 px-2 py-0.5 text-[0.7rem] font-bold text-blue-900 uppercase">
                        Official Study Resource
                      </span>
                      <h4 className="mt-2 text-lg font-black text-[#172554]">
                        STEM Kids Championship Master Preparatory Guide
                      </h4>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                        Prepare to compete. Prepare to win. Contains 4 years of comprehensive past questions and answers (2022–2025), recommended topics, and proven competition strategies.
                      </p>
                      <a
                        href="https://selar.com/k484f98wdl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#172554] px-6 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#1E3A8A]"
                      >
                        Download Guide on Selar <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2">
              <div className="sticky top-28 space-y-6">
                <div className="rounded-[2.5rem] bg-gradient-to-br from-[#0B132B] to-[#1E3A8A] p-8 text-white shadow-2xl shadow-slate-900/20">
                  <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Registration Portal
                  </span>
                  <h3 className="mt-3 text-xl font-black">Register for {program.shortName}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    Register students, school cohorts or individual candidates. Our coordinator will contact you with center allocations and exam guidelines.
                  </p>

                  {/* Bank Details in Sidebar */}
                  <div className="mt-5 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 text-xs">
                    <p className="font-bold text-amber-300 flex items-center gap-1 mb-1">
                      <CreditCard className="h-3.5 w-3.5" /> Bank Payment Details
                    </p>
                    <p className="text-slate-200">Bank: <strong>{ORGANIZATION.bankDetails.bank}</strong></p>
                    <p className="text-slate-200">Name: <strong>{ORGANIZATION.bankDetails.accountName}</strong></p>
                    <p className="text-slate-200">Account: <strong className="font-mono text-cyan-300">{ORGANIZATION.bankDetails.accountNumber}</strong></p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <ButtonLink href={`/register?program=${program.slug}`} variant="gradient" className="w-full">
                      Register Now <ArrowRight className="h-4 w-4" />
                    </ButtonLink>
                    <ButtonLink href="/contact" variant="white" className="w-full">
                      Enquire / Contact Team
                    </ButtonLink>
                  </div>

                  <div className="mt-6 border-t border-white/15 pt-5 text-xs text-slate-300 space-y-2">
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-cyan-300" /> Target: {program.targetAudience}
                    </p>
                    <p className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-cyan-300" /> Format: {program.format}
                    </p>
                  </div>
                </div>

                <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-8 shadow-sm">
                  <h3 className="text-lg font-black text-[#172554]">Who Should Participate?</h3>
                  <ul className="mt-4 space-y-3">
                    {program.participants.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Key features */}
      <section className="bg-slate-50 py-20 sm:py-28 border-y border-slate-200/80">
        <Container>
          <SectionHeading
            eyebrow="Distinct Advantages"
            title="What Makes This Programme Special"
          />
          <div className="grid gap-7 md:grid-cols-3">
            {program.features.map((feature, i) => (
              <Reveal key={feature.title} delay={i * 100}>
                <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <Icon name={feature.icon} className="h-7 w-7" />
                  </span>
                  <h3 className="mt-6 text-xl font-extrabold text-[#172554]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Schools CTA */}
      <section className="bg-white py-20 sm:py-28">
        <Container>
          <Reveal>
            <div className="flex flex-col items-center justify-between gap-8 rounded-[2.5rem] bg-gradient-to-r from-[#0B132B] via-[#1E3A8A] to-[#4C1D95] p-10 text-white shadow-2xl sm:flex-row sm:p-14">
              <div>
                <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  School Partnerships
                </span>
                <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                  Is your school ready to participate?
                </h2>
                <p className="mt-3 max-w-xl text-slate-300 text-sm leading-relaxed">
                  We work with schools across Nigeria to register candidates, coordinate exam halls, provide past questions, and celebrate your students on national television and award tours.
                </p>
              </div>
              <ButtonLink href="/for-schools" variant="white" size="lg">
                Partner Your School <ArrowRight className="h-5 w-5" />
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Related programs */}
      <section className="bg-slate-50 py-20 sm:py-28 border-t border-slate-200/80">
        <Container>
          <SectionHeading
            eyebrow="Keep Exploring"
            title={<GradientText>Other Flagship Initiatives</GradientText>}
          />
          <div className="grid gap-7 md:grid-cols-3">
            {related.map((p) => (
              <ProgramCard key={p.slug} program={p} />
            ))}
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}
