"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { NEWS } from "@/data/content";
import { NewsCard } from "@/components/cards";
import { cx } from "@/components/ui";

export default function NewsView() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const cats = NEWS.map((n) => n.category);
    return ["All", ...Array.from(new Set(cats))];
  }, []);

  const featured = NEWS.find((n) => n.featured) ?? NEWS[0];

  const filtered = useMemo(() => {
    return NEWS.filter((article) => {
      const matchesCategory =
        activeCategory === "All" || article.category === activeCategory;
      const matchesQuery =
        query.trim() === "" ||
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <div>
      {/* Featured article */}
      <a
        href={`/news/${featured.slug}`}
        className="group mb-14 grid overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10 lg:grid-cols-2"
      >
        <div className="relative h-72 overflow-hidden lg:h-auto">
          <img
            src={featured.image}
            alt={featured.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute left-5 top-5 inline-flex rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
            Featured Story
          </span>
        </div>
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
            {featured.category} • {featured.date}
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight text-[#172554] transition group-hover:text-[#2563EB] sm:text-3xl">
            {featured.title}
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600">{featured.excerpt}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#2563EB] transition group-hover:gap-3.5">
            Read Full Story →
          </span>
        </div>
      </a>

      {/* Filter + search */}
      <div className="mb-10 flex flex-col items-center justify-between gap-5 lg:flex-row">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cx(
                "rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300",
                activeCategory === category
                  ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/25"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-[#2563EB]"
              )}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news & opportunities…"
            className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <NewsCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <p className="text-lg font-extrabold text-[#172554]">No stories found</p>
          <p className="mt-2 text-sm text-slate-500">
            Try a different category or search term.
          </p>
        </div>
      )}
    </div>
  );
}