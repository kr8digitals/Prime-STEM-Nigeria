"use client";

import { Play, Sparkles, X, ZoomIn } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useContent } from "@/context/content-context";
import { cx } from "@/components/ui";

const VIDEOS = [
  {
    src: "https://videos.pexels.com/video-files/7868388/7868388-uhd_3840_2160_25fps.mp4",
    poster: "/images/bootcamp/stemx-cohort-group.jpg",
    title: "International STEMx Boot Camp in Action",
    caption: "Young African learners collaborating on robotics assembly and algorithmic coding challenges.",
  },
  {
    src: "https://videos.pexels.com/video-files/8471232/8471232-uhd_4096_2160_25fps.mp4",
    poster: "/images/awards/championship-2025-winners-stage.jpg",
    title: "Championship Gala & Awards Distribution",
    caption: "Over ₦2.7 million in cash prizes and plaques presented to national student champions.",
  },
  {
    src: "https://videos.pexels.com/video-files/7868320/7868320-uhd_3840_2160_25fps.mp4",
    poster: "/images/bootcamp/stemx-female-innovators.jpg",
    title: "Inspiring the Next Generation of Female Innovators",
    caption: "Female students taking the lead in technology design, circuits, and problem solving.",
  },
];

export default function GalleryView() {
  const { content } = useContent();
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [videoModal, setVideoModal] = useState<number | null>(null);

  const galleryList = content.gallery || [];

  const categories = useMemo(() => {
    const cats = new Set<string>(["All"]);
    galleryList.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [galleryList]);

  const items = useMemo(() => {
    if (activeCategory === "All") return galleryList;
    return galleryList.filter((item) => item.category === activeCategory);
  }, [activeCategory, galleryList]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightbox(null);
        setVideoModal(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div>
      {/* Category filters */}
      <div className="mb-12 flex flex-wrap justify-center gap-2 sm:gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cx(
              "rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-300",
              activeCategory === category
                ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-[#2563EB]"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <button
            key={`${item.title}-${i}`}
            onClick={() => setLightbox(i)}
            className="group relative overflow-hidden rounded-3xl border border-slate-200/80 text-left shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 bg-slate-900"
          >
            <div className="h-72 w-full overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-[#0B132B]/30 to-transparent opacity-85 transition group-hover:opacity-95" />
            
            <div className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur opacity-0 group-hover:opacity-100 transition">
              <ZoomIn className="h-4 w-4" />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5">
              <span className="inline-flex rounded-full bg-cyan-500/90 px-3 py-1 text-[0.7rem] font-bold text-slate-950 uppercase">
                {item.category}
              </span>
              <p className="mt-2 text-base font-extrabold text-white leading-snug">{item.title}</p>
              <p className="mt-1 text-xs text-slate-300 line-clamp-2">{item.caption}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && items[lightbox] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B132B]/95 p-5 backdrop-blur-md"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <figure className="max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={items[lightbox].image}
              alt={items[lightbox].title}
              className="max-h-[75vh] w-full rounded-3xl object-contain shadow-2xl bg-black/40"
            />
            <figcaption className="mt-4 text-center">
              <span className="inline-block rounded-full bg-cyan-400 px-3 py-0.5 text-xs font-bold text-slate-950 mb-1">
                {items[lightbox].category}
              </span>
              <p className="text-xl font-black text-white">{items[lightbox].title}</p>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl mx-auto">{items[lightbox].caption}</p>
            </figcaption>
          </figure>
        </div>
      )}

      {/* Video section */}
      <div className="mt-24 rounded-3xl bg-white p-8 sm:p-12 border border-slate-200/80 shadow-sm">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-800">
            <Sparkles className="h-4 w-4" /> Media Spotlight
          </span>
          <h3 className="mt-3 text-2xl sm:text-3xl font-black text-[#172554]">
            Prime STEM in Motion
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Glimpses into our boot camps, laboratory experiments, and award ceremonies celebrating young brilliance.
          </p>
        </div>

        <div className="mt-10 grid gap-7 md:grid-cols-3">
          {VIDEOS.map((video, i) => (
            <button
              key={video.title}
              onClick={() => setVideoModal(i)}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 text-left shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10 bg-slate-900"
            >
              <img
                src={video.poster}
                alt={video.title}
                className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B132B]/50 transition group-hover:bg-[#0B132B]/65">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-2xl transition-transform duration-500 group-hover:scale-110">
                  <Play className="ml-1 h-7 w-7 fill-[#2563EB]" />
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <p className="text-sm font-extrabold text-white">{video.title}</p>
                <p className="mt-1 text-xs text-slate-300 line-clamp-1">{video.caption}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Video modal */}
      {videoModal !== null && VIDEOS[videoModal] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B132B]/95 p-5 backdrop-blur-md"
          onClick={() => setVideoModal(null)}
        >
          <button
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <video
              key={VIDEOS[videoModal].src}
              src={VIDEOS[videoModal].src}
              controls
              autoPlay
              playsInline
              className="aspect-video w-full rounded-3xl bg-black shadow-2xl"
            />
            <p className="mt-4 text-center text-lg font-black text-white">
              {VIDEOS[videoModal].title}
            </p>
            <p className="mt-1 text-center text-sm text-slate-300">
              {VIDEOS[videoModal].caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
