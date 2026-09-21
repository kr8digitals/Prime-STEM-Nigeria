import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Copy,
  CreditCard,
  GraduationCap,
  Handshake,
  Laptop,
  Layers,
  Package,
  Rocket,
  School,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { ACCREDITED_SCHOOLS, EARLY_BIRD_OFFER, IMAGES, ORGANIZATION, STEM_GUIDE_FOR_SCHOOLS } from "@/data/content";
import { FinalCTA, PageHero } from "@/components/sections";
import {
  ButtonLink,
  Container,
  GradientText,
  Reveal,
  SectionHeading,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "For Schools",
  description:
    "Partner with Prime STEM Nigeria to bring competitions, STEM clubs, teacher training, laptops and robotics equipment to your school.",
};

const offerings = [
  {
    icon: Award,
    title: "Championships & Competitions",
    text: "Register student delegations for the STEM Kids Championship (5th Edition), ANSC, AOCT, and SCI-SPELL — with nationwide recognition and cash prizes.",
  },
  {
    icon: Laptop,
    title: "Laptops for Schools Project",
    text: "Bulk supply of durable educational laptops, multimedia projectors, and robotics kits with flexible pay-on-delivery arrangements.",
  },
  {
    icon: BookOpen,
    title: "STEM Guide for Schools Handbook",
    text: "A daily practical companion for science and STEM teachers moving classrooms from rote theory to hands-on discovery and experiments.",
  },
  {
    icon: GraduationCap,
    title: "Science Teacher Hangouts & Hangouts",
    text: "Regular professional development including the International Science Teachers Hangout and Digital Literacy workshops.",
  },
  {
    icon: Rocket,
    title: "Turnkey School STEM Clubs",
    text: "Curriculum templates, project kits, weekly challenges, and competition coaching frameworks for your internal STEM club.",
  },
  {
    icon: Sparkles,
    title: "Statewide Award Distribution Tour",
    text: "When your school wins, our national delegation visits your institution to present cheques, plaques, and medals before your school assembly.",
  },
];

const laptopTiers = [
  {
    name: "Student Computing Pod",
    subtitle: "5–10 Units Bulk Package",
    description: "Ideal for primary or junior secondary classrooms starting their computer-based testing and digital STEM literacy journey.",
    features: [
      "Rugged educational-spec laptops",
      "Preloaded with STEM & coding software",
      "Pay-on-delivery terms available",
      "Full warranty & technical support",
    ],
  },
  {
    name: "Turnkey STEM & Robotics Lab",
    subtitle: "15–30 Units + Modular Kits",
    description: "Complete laboratory transformation: bulk laptops bundled with modular robotics kits and programmable microcontrollers.",
    popular: true,
    features: [
      "Core i5 / equivalent durable laptops",
      "Complete classroom robotics & sensor kits",
      "Teacher onboarding & curriculum guide",
      "Flexible multi-term installment options",
    ],
  },
  {
    name: "Multimedia Teaching Station",
    subtitle: "Projector + Faculty Laptop",
    description: "Designed for interactive science lecture theatres, smart classrooms, and assembly hall presentations.",
    features: [
      "High-lumen multimedia projector",
      "Instructor presentation workstation",
      "Projector screen & audio setup",
      "Rapid delivery across all 36 states",
    ],
  },
];

export default function ForSchoolsPage() {
  return (
    <>
      <PageHero
        eyebrow="Institutional Partnerships"
        title={
          <>
            Empowering Forward-Thinking <GradientText>Schools Across Nigeria</GradientText>
          </>
        }
        description="We partner with basic and secondary schools nationwide to deliver accredited competitions, teacher training, laptops, robotics kits, and sustainable STEM cultures."
        image={IMAGES.forSchools}
      />

      {/* Real School Showcase Banner */}
      <section className="bg-white py-12 border-b border-slate-100">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 shadow-xl bg-slate-900">
                <img
                  src="/images/awards/ntic-abuja-winners-cheque.jpg"
                  alt="NTIC Abuja students and faculty receiving ₦300,000 prize cheque outside school"
                  className="h-[360px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B]/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider">
                    Partner School Spotlight
                  </span>
                  <p className="mt-1 text-sm font-extrabold">
                    Nigerian Tulip International Colleges (NTIC Abuja Campus)
                  </p>
                  <p className="text-xs text-slate-300">
                    Junior Secondary National Champions receiving ₦300,000 cheque &amp; certificates of merit.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Why Partner With Prime STEM Nigeria?
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#172554]">
                Elevate Your School&apos;s Academic Prestige
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                When schools participate in Prime STEM Nigeria programmes, their students gain national prominence, confidence, and tangible rewards. Our competitions are transparent, rigorous, and celebrated on a national stage.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-blue-50/60 p-4 border border-blue-100">
                  <p className="text-xl font-black text-[#2563EB]">350+</p>
                  <p className="text-xs font-semibold text-slate-600">Accredited Partner Schools</p>
                </div>
                <div className="rounded-2xl bg-amber-50/60 p-4 border border-amber-100">
                  <p className="text-xl font-black text-amber-800">₦2.7M+</p>
                  <p className="text-xs font-semibold text-slate-600">Prizes Distributed</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Offerings */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="What We Offer Schools"
            title="Comprehensive Support for Your School"
            description="From hardware procurement and teacher training to national championships, we provide everything needed to build an elite STEM programme."
          />
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map((offering) => (
              <div
                key={offering.title}
                className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300"
              >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 text-white shadow-lg transition-transform duration-500 group-hover:scale-110">
                  <offering.icon className="h-7 w-7" />
                </span>
                <h3 className="mt-6 text-xl font-black text-[#172554]">{offering.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{offering.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Laptops for Schools Project Spotlight */}
      <section id="laptops" className="bg-white py-20 sm:py-28 border-y border-slate-200/80">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-800">
              <Laptop className="h-4 w-4" /> Hardware &amp; Digital Access
            </span>
            <h2 className="mt-4 text-3xl font-black text-[#172554] sm:text-4xl">
              Laptops for Schools Project
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Affordable technology access for forward-thinking schools. We supply durable laptops, robotics kits, and multimedia projectors in bulk with flexible pay-on-delivery options so cost is never a barrier to modern digital learning.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {laptopTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl border p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                  tier.popular
                    ? "border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-blue-900/10"
                    : "border-slate-200/80 bg-white"
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1 text-[0.7rem] font-black uppercase tracking-wider text-white shadow-md">
                    Most Popular Choice
                  </span>
                )}
                <h3 className="text-xl font-black text-[#172554]">{tier.name}</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB] mt-1">{tier.subtitle}</p>
                <p className="mt-4 text-sm text-slate-600 leading-relaxed">{tier.description}</p>
                <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 pt-4 border-t border-slate-100">
                  <Link
                    href={`/contact?subject=Laptops+for+Schools+Enquiry+-+${encodeURIComponent(tier.name)}`}
                    className={`block w-full rounded-full py-3 text-center text-xs font-bold transition shadow ${
                      tier.popular
                        ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white hover:brightness-110"
                        : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    Enquire for School
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-slate-50 p-6 border border-slate-200/80 text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold text-slate-600">
              Need custom quantities or robotic kits? Contact our hardware coordinator directly via WhatsApp: <a href="https://wa.me/2348138258491" className="text-[#2563EB] underline font-extrabold">+234 813 825 8491</a>.
            </p>
          </div>
        </Container>
      </section>

      {/* STEM Guide for Schools Banner */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <Container>
          <div className="rounded-3xl bg-gradient-to-r from-[#0B132B] via-[#1E3A8A] to-[#312E81] p-8 sm:p-14 text-white shadow-2xl">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <span className="rounded-full bg-cyan-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Practical Handbook for Teachers
                </span>
                <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                  {STEM_GUIDE_FOR_SCHOOLS.title}
                </h2>
                <p className="mt-2 text-base font-semibold text-slate-200">
                  {STEM_GUIDE_FOR_SCHOOLS.subtitle}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Moving your teachers from &ldquo;teaching STEM&rdquo; to actually getting students to <strong>DO STEM</strong>. Packed with practical science experiments, math challenges, coding and AI projects, robotics, STEM club guidelines, and rubrics.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <Link
                    href="/contact?subject=STEM+Guide+for+Schools+Pre-Order"
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-3 text-xs font-black text-slate-950 shadow hover:bg-cyan-300 transition"
                  >
                    Pre-Order for Your School Faculty <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/services#stem-guide"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-xs font-bold text-white ring-1 ring-white/20 hover:bg-white/20 transition"
                  >
                    Read Handbook Chapters
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 rounded-2xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur text-xs space-y-3">
                <p className="font-bold uppercase tracking-wider text-amber-300">
                  Inside the Handbook:
                </p>
                <p className="text-slate-200">• Low-cost science experiments</p>
                <p className="text-slate-200">• Real-life mathematics problems</p>
                <p className="text-slate-200">• Coding, AI &amp; Robotics projects</p>
                <p className="text-slate-200">• Establishing a School STEM Club</p>
                <p className="text-slate-200">• Competition prep &amp; past questions</p>
                <p className="text-slate-200">• Lesson plan &amp; assessment templates</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Accredited Partner Schools */}
      <section className="bg-white py-20 sm:py-28 border-t border-slate-200/80">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              <School className="h-4 w-4" /> Nationwide Network
            </span>
            <h2 className="mt-3 text-3xl font-black text-[#172554]">
              Accredited Participating Schools
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Join hundreds of schools across all 36 states and the FCT who trust Prime STEM Nigeria for academic excellence.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {ACCREDITED_SCHOOLS.map((school) => (
              <div
                key={school}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-800 shadow-xs"
              >
                <School className="h-4 w-4 text-[#2563EB] shrink-0" />
                <span>{school}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <ButtonLink href="/contact?subject=School+Partnership+Request" variant="primary" size="lg">
              <Handshake className="h-4 w-4" /> Register Your School as a Partner
            </ButtonLink>
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}
