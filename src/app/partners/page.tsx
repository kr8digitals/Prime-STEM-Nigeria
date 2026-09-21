"use client";

import {
  ArrowRight,
  Award,
  CheckCircle2,
  Globe2,
  Handshake,
  HeartHandshake,
  School,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useContent } from "@/context/content-context";
import { IMAGES } from "@/data/content";
import { PartnerTile } from "@/components/cards";
import { FinalCTA, PageHero } from "@/components/sections";
import {
  ButtonLink,
  Container,
  GradientText,
  Reveal,
  SectionHeading,
} from "@/components/ui";

const partnerCategories = [
  {
    title: "Government & Development Initiatives",
    text: "Partnering with national youth development programmes such as the Nigeria Jubilee Fellows Programme (NJFP) in collaboration with UNDP to empower the next generation.",
  },
  {
    title: "Pan-African STEM Networks",
    text: "Working alongside continental coalitions like AFRISTEM to harmonize science curricula, tournament benchmarks, and regional student exchanges.",
  },
  {
    title: "Corporate Patrons & Benefactors",
    text: "Backed by visionary benefactors like Esthington Group (chaired by Chief Engr. Dr. Darlington Ugota) sponsoring over ₦2.7 million in student cash prizes and awards.",
  },
  {
    title: "Technology & Infrastructure Providers",
    text: "Collaborating with SYLCOUTECH and hardware leaders to deliver bulk laptops, robotic kits, and digital infrastructure to partner schools.",
  },
];

export default function PartnersPage() {
  const { content } = useContent();
  const partners = content.partners;
  const accreditedSchools = content.accreditedSchools;

  return (
    <>
      <PageHero
        eyebrow="Collaborative Ecosystem"
        title={
          <>
            Building the Future of STEM <GradientText>Together</GradientText>
          </>
        }
        description="We collaborate with international development programmes, corporate benefactors, media networks, and hundreds of schools to create transformative opportunities for African youths."
        image={IMAGES.hero}
      />

      {/* Partners Grid */}
      <section className="bg-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Our Verified Partners"
            title="Strategic Alliances &amp; Benefactors"
            description="Organizations actively collaborating with Prime STEM Nigeria to champion science, technology, and youth empowerment."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((partner, i) => (
              <Reveal key={partner.name} delay={(i % 4) * 80}>
                <PartnerTile partner={partner} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Partner Pillars */}
      <section className="bg-slate-50 py-20 sm:py-28 border-y border-slate-200/80">
        <Container>
          <SectionHeading
            eyebrow="Partnership Models"
            title="How We Collaborate"
            description="We welcome strategic engagements tailored to corporate social responsibility, educational enhancement, and continental development goals."
          />
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {partnerCategories.map((cat, i) => (
              <div
                key={cat.title}
                className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-base shadow-md">
                  0{i + 1}
                </span>
                <h3 className="mt-5 text-lg font-black text-[#172554]">{cat.title}</h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-600">{cat.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Accredited Partner Schools Section */}
      <section className="bg-white py-20 sm:py-28">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <School className="h-4 w-4" /> Nationwide Network
            </span>
            <h2 className="mt-3 text-3xl font-black text-[#172554]">
              Accredited Participating Schools
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Leading private and public schools whose candidates consistently participate in and win Prime STEM Nigeria championships.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {accreditedSchools.map((school) => (
              <div
                key={school}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-800 shadow-xs hover:border-blue-300 hover:bg-blue-50/50 transition"
              >
                <School className="h-4 w-4 text-[#2563EB] shrink-0" />
                <span>{school}</span>
              </div>
            ))}
          </div>

          <div className="mt-14 rounded-[2.5rem] bg-gradient-to-r from-[#0B132B] via-[#1E3A8A] to-[#4C1D95] p-10 text-white text-center max-w-3xl mx-auto shadow-2xl">
            <h3 className="text-2xl font-black">Want to Become a Partner or Sponsor?</h3>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Join us in sponsoring championship cash prizes, providing laptops to rural schools, or hosting regional examination centres.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <ButtonLink href="/contact?subject=Partnership+Opportunity" variant="gradient" size="lg">
                <Handshake className="h-4 w-4" /> Reach Out to Our Partnerships Team
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}
