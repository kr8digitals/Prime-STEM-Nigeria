import {
  CreditCard,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import { IMAGES, ORGANIZATION } from "@/data/content";
import { ContactForm } from "@/components/forms";
import { FinalCTA, PageHero } from "@/components/sections";
import { Container, GradientText, Reveal, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Prime STEM Nigeria — enquiries about competitions, boot camps, teacher training, laptops for schools and partnerships.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get In Touch"
        title={
          <>
            We&apos;re Here to Help Your{" "}
            <GradientText>STEM Journey</GradientText>
          </>
        }
        description="Whether you have questions about our upcoming championships, want to pre-order the STEM Guide for Schools, or are looking to partner — we’d love to hear from you."
        image={IMAGES.classroom}
      />

      <section className="bg-white py-20 sm:py-28">
        <Container>
          <div className="grid gap-14 lg:grid-cols-12">
            {/* Contact Form */}
            <div className="lg:col-span-7">
              <SectionHeading
                align="left"
                eyebrow="Send Us a Message"
                title="Let&apos;s Start a Conversation"
                description="Fill out the form below and our administrative team will respond promptly."
              />
              <div className="rounded-[2.5rem] border border-slate-200/80 bg-white p-7 shadow-2xl shadow-blue-900/5 sm:p-10">
                <ContactForm />
              </div>
            </div>

            {/* Direct Information */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-[2.5rem] bg-gradient-to-br from-[#0B132B] to-[#1E3A8A] p-8 text-white shadow-xl">
                <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Direct Inquiries
                </span>
                <h3 className="mt-3 text-2xl font-black">Official Contact Details</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {ORGANIZATION.cac}
                </p>

                <div className="mt-6 space-y-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-1 h-4 w-4 shrink-0 text-cyan-400" />
                    <div>
                      <p className="text-[0.7rem] uppercase text-slate-400 font-bold">Email Us</p>
                      <a href={`mailto:${ORGANIZATION.email}`} className="font-bold text-white hover:text-cyan-300 transition">
                        {ORGANIZATION.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="mt-1 h-4 w-4 shrink-0 text-cyan-400" />
                    <div>
                      <p className="text-[0.7rem] uppercase text-slate-400 font-bold">Call Lines</p>
                      <a href={`tel:${ORGANIZATION.phoneHref}`} className="font-bold text-white hover:text-cyan-300 transition block">
                        {ORGANIZATION.phone}
                      </a>
                      <a href={`tel:${ORGANIZATION.secondaryPhone.replace(/\s+/g, "")}`} className="font-bold text-slate-300 hover:text-cyan-300 transition block">
                        {ORGANIZATION.secondaryPhone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MessageCircle className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-[0.7rem] uppercase text-slate-400 font-bold">WhatsApp Direct</p>
                      <a
                        href={ORGANIZATION.whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-emerald-300 hover:underline"
                      >
                        Chat with Program Coordinator →
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/15">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-2">
                    <CreditCard className="h-4 w-4" /> Bank Payment Account
                  </p>
                  <p className="text-xs text-slate-200">
                    Bank: <strong>{ORGANIZATION.bankDetails.bank}</strong>
                  </p>
                  <p className="text-xs text-slate-200">
                    Name: <strong>{ORGANIZATION.bankDetails.accountName}</strong>
                  </p>
                  <p className="text-xs text-slate-200 font-mono mt-1">
                    Account: <strong className="text-cyan-300 font-bold text-sm">{ORGANIZATION.bankDetails.accountNumber}</strong>
                  </p>
                </div>
              </div>

              {/* Office Locations */}
              <div className="rounded-[2.5rem] border border-slate-200/80 bg-slate-50 p-7 space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-[#172554] flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#2563EB]" />
                  Physical Offices
                </h4>

                {ORGANIZATION.offices.map((office) => (
                  <div key={office.name} className="rounded-2xl bg-white p-4 border border-slate-200/60 shadow-xs">
                    <strong className="text-xs font-black text-[#172554] block">
                      {office.name}
                    </strong>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {office.address}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}
