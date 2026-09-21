import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Handshake,
  Laptop,
  Rocket,
  School,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import { IMAGES, SERVICES, STEM_GUIDE_FOR_SCHOOLS } from "@/data/content";
import { ServiceCard } from "@/components/cards";
import { FinalCTA, PageHero, StemGuideSpotlightSection } from "@/components/sections";
import {
  ButtonLink,
  Container,
  GradientText,
  Reveal,
  SectionHeading,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Services & Solutions",
  description:
    "Prime STEM Nigeria provides end-to-end STEM competitions, boot camps, teacher training, laptops for schools, practical guides and institutional consultancy.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Services & Solutions"
        title={
          <>
            End-to-End Solutions for{" "}
            <GradientText>STEM Excellence</GradientText>
          </>
        }
        description="We provide comprehensive educational services for schools, students, teachers and partners — from competition design and holiday boot camps to teacher enablement and bulk laptop supply."
        image={IMAGES.forSchools}
      />

      {/* Services Grid */}
      <section className="bg-white py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="What We Do"
            title="Our Core Capabilities"
            description="Explore our specialized services designed to transform how STEM is taught, practiced and celebrated in Africa."
          />
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service, i) => (
              <Reveal key={service.slug} delay={(i % 3) * 100}>
                <ServiceCard service={service} index={i} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Dedicated STEM Guide Section */}
      <div id="stem-guide">
        <StemGuideSpotlightSection />
      </div>

      {/* Teacher Training Spotlight */}
      <section id="teacher-training" className="bg-white py-20 sm:py-28 border-b border-slate-200/80">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-800">
                <GraduationCap className="h-4 w-4" /> Professional Development
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-black text-[#172554]">
                Science Teachers&apos; Hangouts &amp; Digital Literacy
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Great STEM education starts with empowered, confident teachers. Prime STEM Nigeria hosts continental virtual hangouts and practical workshops that equip educators with modern pedagogical frameworks, digital classroom simulations, and competition coaching techniques.
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2563EB] text-white text-xs font-bold">1</span>
                  <div>
                    <h4 className="text-sm font-bold text-[#172554]">International Science Teachers Hangout</h4>
                    <p className="text-xs text-slate-500">Scheduled for October 31, 2026. Connecting science teachers across Africa to share classroom best practices.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white text-xs font-bold">2</span>
                  <div>
                    <h4 className="text-sm font-bold text-[#172554]">Science Teachers&apos; Digital Literacy Hangout</h4>
                    <p className="text-xs text-slate-500">Scheduled for February 20, 2027. Mastering online STEM simulations, AI tools, and virtual lab platforms.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <ButtonLink href="/contact?subject=Teacher+Training+Registration" variant="primary">
                  Join Science Teachers Network <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 shadow-2xl bg-slate-900">
                <img
                  src="/images/awards/ceremony-hall-audience.jpg"
                  alt="Educators, Teachers and Guests at Prime STEM Conference"
                  className="h-[420px] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}
