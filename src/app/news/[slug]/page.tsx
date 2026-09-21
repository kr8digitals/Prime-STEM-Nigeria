import { ArrowLeft, CalendarDays, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NEWS } from "@/data/content";
import { NewsCard } from "@/components/cards";
import { FinalCTA } from "@/components/sections";
import { Badge, Container, Reveal } from "@/components/ui";

export function generateStaticParams() {
  return NEWS.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = NEWS.find((n) => n.slug === slug);
  if (!article) return { title: "Story Not Found" };
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = NEWS.find((n) => n.slug === slug);

  if (!article) notFound();

  const related = NEWS.filter((n) => n.slug !== article.slug).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-[#172554] py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <img src={article.image} alt="" className="h-full w-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#172554]/70 via-[#172554]/85 to-[#172554]" />
        </div>
        <Container className="relative">
          <Link href="/news" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 transition hover:text-cyan-200">
            <ArrowLeft className="h-4 w-4" /> Back to News
          </Link>
          <div className="mt-8 flex flex-wrap gap-3">
            <Badge tone="purple">{article.category}</Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/15">
              <CalendarDays className="h-3.5 w-3.5" /> {article.date}
            </span>
          </div>
          <h1 className="mt-5 max-w-4xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">
            {article.excerpt}
          </p>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-900/15">
              <img src={article.image} alt={article.title} className="h-80 w-full object-cover" />
            </div>
            <div className="mt-10 space-y-6 text-lg leading-relaxed text-slate-700">
              {article.content.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-10 flex items-center gap-2 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              <Tag className="h-4 w-4 text-[#2563EB]" />
              Category: <span className="font-bold text-[#172554]">{article.category}</span>
            </div>

            <Reveal>
              <div className="mt-12 rounded-[2rem] bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#6D28D9] p-8 text-center text-white shadow-xl sm:p-10">
                <h2 className="text-xl font-extrabold">Want to join the next opportunity?</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Register for Prime STEM Nigeria programmes and be part of the story.
                </p>
                <Link
                  href="/register"
                  className="mt-5 inline-flex rounded-full bg-white px-7 py-3 text-sm font-bold text-[#172554] shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Register Now
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24">
        <Container>
          <h2 className="mb-10 text-center text-2xl font-extrabold text-[#172554] sm:text-3xl">
            Related Stories
          </h2>
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {related.map((article) => (
              <NewsCard key={article.slug} article={article} />
            ))}
          </div>
        </Container>
      </section>

      <FinalCTA />
    </>
  );
}