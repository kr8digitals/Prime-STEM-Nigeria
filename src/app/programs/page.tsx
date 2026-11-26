"use client";

import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { useContent } from "@/context/content-context";
import { FinalCTA, PageHero, UpcomingSection } from "@/components/sections";
import {
  Badge,
  ButtonLink,
  Container,
  GradientText,
  Icon,
  Reveal,
  SectionHeading,
} from "@/components/ui";

export default function ProgramsPage() {
  const { content } = useContent();
  const programs = content.programs;

  return (
    <>
      <PageHero
        eyebrow="Our Programs"
        title={
          <>
            Programmes That <GradientText>Create Opportunities</GradientText>
          </>
        }
        description="Programs are specific initiatives people participate in — competitions, boot camps, technology projects and events that build skills, confidence and recognition."
        image={programs[0]?.image || "/images/awards/championship-2025-winners-stage.jpg"}
      />

      <section className="bg-slate-50 py-16 sm:py-20" aria-label="Explore our programmes">
        <Container>
          <SectionHeading eyebrow="Explore our programmes" title="Find your next opportunity" description="Discover competitions, learning and events for schools and learners." />
          <div id="discover-programmes" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {programs.map((program) => (
              <Link key={program.slug} href={`/programs/${program.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-800">
                  <img src={program.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/10 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-950">{program.category}</span>
                  <h2 className="absolute bottom-4 left-5 right-5 text-xl font-extrabold text-white">{program.name}</h2>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-sm leading-relaxed text-slate-600">{program.tagline}</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600"><span className="rounded-full bg-slate-100 px-3 py-1">{program.date}</span><span className="rounded-full bg-slate-100 px-3 py-1">{program.format}</span></div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Explore programme <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <Container>
          <div className="space-y-24">
            {programs.map((program, i) => (
              <Reveal key={program.slug}>
                <div
                  id={i === 3 ? "stemx" : undefined}
                  className="grid items-center gap-10 lg:grid-cols-2"
                >
                  <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-900/15">
                      <img
                        src={program.image}
                        alt={program.name}
                        className="h-[380px] w-full object-cover"
                      />
                      <div className="absolute left-5 top-5">
                        <Badge tone={i % 2 === 0 ? "blue" : "purple"}>{program.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2563EB]">
                      {program.shortName}
                    </p>
                    <h2 className="mt-3 text-3xl font-extrabold text-[#172554]">
                      {program.name}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-slate-600">
                      {program.overview}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 ring-1 ring-slate-100">
                        <CalendarDays className="h-4 w-4 text-[#2563EB]" />
                        {program.date}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 ring-1 ring-slate-100">
                        <MapPin className="h-4 w-4 text-[#2563EB]" />
                        {program.location}
                      </span>
                      <span className="rounded-full bg-slate-50 px-4 py-2 ring-1 ring-slate-100">
                        {program.format}
                      </span>
                    </div>

                    <div className="mt-6 space-y-2.5">
                      {program.objectives?.slice(0, 3).map((obj) => (
                        <p key={obj} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
                          {obj}
                        </p>
                      ))}
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4">
                      <ButtonLink href={`/register?program=${encodeURIComponent(program.slug)}`} variant="primary">
                        Register Now <ArrowRight className="h-4 w-4" />
                      </ButtonLink>
                      <ButtonLink href={`/programs/${program.slug}`} variant="outline">
                        View Full Details
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Program detail features preview */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="What to Expect"
            title="Every Programme Is Built for Impact"
            description="Each Prime STEM programme is structured with clear objectives, practical learning and recognition at its heart."
          />
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {programs.flatMap((p) =>
              (p.features || []).map((feature) => (
                <div
                  key={`${p.slug}-${feature.title}`}
                  className="flex items-start gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
                    <Icon name={feature.icon} className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-[#172554]">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Container>
      </section>

      <UpcomingSection />
      <FinalCTA />
    </>
  );
}
