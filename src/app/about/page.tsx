import {
  ArrowRight,
  Award,
  CheckCircle2,
  Eye,
  Flag,
  Globe2,
  GraduationCap,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type { Metadata } from "next";
import {
  APPROACH,
  GOAL,
  IMAGES,
  MISSION,
  ORGANIZATION,
  VALUES,
  VISION,
} from "@/data/content";
import { ValueCard } from "@/components/cards";
import { FinalCTA, PageHero, StatsSection, TeamSection } from "@/components/sections";
import {
  ButtonLink,
  Container,
  GradientText,
  Icon,
  Reveal,
  SectionHeading,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Prime STEM Nigeria — our story, vision, mission, core values and commitment to advancing STEM education across Nigeria and Africa.",
};

function VisionMission() {
  return (
    <section className="bg-slate-50 py-20 sm:py-28 border-y border-slate-200/80">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[2.5rem] border border-slate-200/80 bg-white p-9 shadow-xl shadow-slate-900/5 sm:p-12 flex flex-col justify-between">
              <div>
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-600/25">
                  <Eye className="h-7 w-7" />
                </span>
                <h2 className="mt-6 text-2xl font-black text-[#172554]">Our Vision</h2>
                <p className="mt-4 text-base font-medium leading-relaxed text-slate-700">
                  “{VISION}”
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-[#2563EB]">
                <Globe2 className="h-4 w-4" /> Pan-African Horizon
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="h-full rounded-[2.5rem] border border-slate-200/80 bg-white p-9 shadow-xl shadow-slate-900/5 sm:p-12 flex flex-col justify-between">
              <div>
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-600/25">
                  <Flag className="h-7 w-7" />
                </span>
                <h2 className="mt-6 text-2xl font-black text-[#172554]">Our Mission</h2>
                <p className="mt-4 text-base font-medium leading-relaxed text-slate-700">
                  “{MISSION}”
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-purple-600">
                <GraduationCap className="h-4 w-4" /> Excellence in STEM Pedagogy
              </div>
            </div>
          </Reveal>
        </div>

        {/* Goal Banner */}
        <Reveal delay={100}>
          <div className="mt-8 flex flex-col items-start gap-6 rounded-[2.5rem] bg-gradient-to-r from-[#0B132B] via-[#1E3A8A] to-[#4C1D95] p-9 text-white shadow-2xl shadow-slate-900/20 sm:flex-row sm:items-center sm:p-12">
            <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Target className="h-8 w-8 text-cyan-300" />
            </span>
            <div className="flex-1">
              <span className="inline-block rounded-full bg-cyan-400/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">
                Our Foundational Goal
              </span>
              <p className="text-lg font-bold leading-relaxed sm:text-xl text-white">
                “{GOAL}”
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function OurStory() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="relative">
              <div className="overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-900/15 border border-slate-100 bg-slate-900">
                <img
                  src="/images/awards/primestem-leadership-team.jpg"
                  alt="Prime STEM Nigeria Leadership, Educators and Dignitaries at the 2025 Awards Ceremony"
                  className="h-[480px] w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-4 rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-100 sm:-left-6">
                <p className="text-2xl font-black text-[#172554]">36 States + FCT</p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nationwide Reach &amp; Tour
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <SectionHeading
              align="left"
              eyebrow="Our Story"
              title="Empowering Young Minds Through STEM"
              description="Devoted to building strong foundational knowledge and nurturing the next generation of African innovators."
            />
            <div className="-mt-6 space-y-4 text-base leading-relaxed text-slate-600">
              <p>
                Prime STEM Nigeria is a dynamic institution registered with the Corporate Affairs Commission (CAC) devoted to the promotion and advancement of Science, Technology, Engineering, and Mathematics (STEM) education among Nigerian children and youth.
              </p>
              <p>
                We believe that every child deserves access to meaningful, practical, and inspiring science education. Rather than viewing science as an intimidating subject confined to blackboards and textbooks, we immerse students in real discovery — building circuits, writing code, assembling robotics kits, conducting chemistry experiments, and participating in high-stakes championships.
              </p>
              <p>
                From the <strong>STEM Kids Championship</strong> and <strong>African Organic Chemistry Tournament (AOCT)</strong> to the <strong>International STEMx Boot Camp</strong> and <strong>Laptops for Schools Project</strong>, our initiatives bridge the gap between classroom theory and real-world technology leadership.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800">
                🏛️ Abuja National HQ
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800">
                📍 Southern Regional Office (Abakaliki)
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800">
                🌐 Hybrid: Physical &amp; Virtual
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function ValuesSection() {
  return (
    <section className="bg-slate-50 py-20 sm:py-28 border-y border-slate-200/80">
      <Container>
        <SectionHeading
          eyebrow="Our Guiding Values"
          title="The Principles That Drive Our Work"
          description="These values shape every interaction with learners, schools, parents, corporate patrons, and communities across Africa."
        />
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((val, i) => (
            <Reveal key={val.title} delay={i * 100}>
              <ValueCard {...val} index={i} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ApproachSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Our Educational Philosophy"
          title="How We Deliver Impact"
          description="Three clear, non-negotiable principles guide everything we design, publish, and host."
        />
        <div className="grid gap-7 md:grid-cols-3">
          {APPROACH.map((item, i) => (
            <Reveal key={item.title} delay={i * 120}>
              <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg transition-transform duration-500 group-hover:scale-110">
                  <Icon name={item.icon} className="h-7 w-7" />
                </span>
                <p className="mt-6 text-4xl font-black text-slate-200">0{i + 1}</p>
                <h3 className="mt-2 text-xl font-black text-[#172554]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Prime STEM Nigeria"
        title={
          <>
            Advancing STEM Education &amp;{" "}
            <GradientText>Innovation in Africa</GradientText>
          </>
        }
        description="We are committed to nurturing curious, resilient, and future-ready problem solvers who will lead Africa into technological prominence."
        image={IMAGES.hero}
      />
      <StatsSection />
      <OurStory />
      <VisionMission />
      <ValuesSection />
      <ApproachSection />
      <TeamSection />
      <FinalCTA />
    </>
  );
}
