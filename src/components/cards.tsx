import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";
import type {
  EventItem,
  GalleryItem,
  NewsArticle,
  Partner,
  Program,
  Service,
  TeamMember,
  Winner,
} from "@/data/content";
import { Badge, Icon } from "@/components/ui";

export function ProgramCard({ program, index }: { program: Program; index?: number }) {
  return (
    <Link
      href={`/programs/${program.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300"
    >
      <div className="relative h-56 overflow-hidden bg-slate-900">
        <img
          src={program.image}
          alt={program.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-[#0B132B]/30 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <Badge tone={program.category === "Competition" ? "blue" : program.category === "Boot Camp" ? "cyan" : "purple"}>
            {program.category}
          </Badge>
        </div>
        {program.status && (
          <div className="absolute bottom-3 left-4 right-4">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#172554] shadow-sm backdrop-blur">
              <CalendarDays className="h-3.5 w-3.5 text-[#2563EB]" />
              {program.status}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
            {program.shortName}
          </p>
          <span className="text-[0.7rem] font-semibold text-slate-400">
            {program.format}
          </span>
        </div>
        <h3 className="mt-2 text-xl font-extrabold text-[#172554] transition group-hover:text-[#2563EB]">
          {program.name}
        </h3>
        <p className="mt-2.5 text-xs font-semibold text-blue-700">
          Target: {program.targetAudience}
        </p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-3">
          {program.tagline}
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2563EB] transition group-hover:gap-2.5">
            View Details <ArrowRight className="h-4 w-4" />
          </span>
          <span className="text-xs font-semibold text-slate-400">{program.location}</span>
        </div>
      </div>
    </Link>
  );
}

export function ServiceCard({ service, index }: { service: Service; index?: number }) {
  const i = index ?? 0;
  const gradient =
    i % 3 === 0
      ? "from-cyan-500 to-blue-600"
      : i % 3 === 1
      ? "from-blue-600 to-purple-600"
      : "from-purple-600 to-fuchsia-600";
  return (
    <div className="group flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300">
      <div
        className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-blue-500/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
      >
        <Icon name={service.icon} className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-extrabold text-[#172554]">{service.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{service.description}</p>
      <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
        {service.points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm font-medium text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EventCard({ event, index }: { event: EventItem; index?: number }) {
  const i = index ?? 0;
  const tone =
    event.badgeTone === "blue"
      ? "from-blue-600 to-indigo-700"
      : event.badgeTone === "cyan"
      ? "from-cyan-500 to-blue-600"
      : event.badgeTone === "purple"
      ? "from-purple-600 to-fuchsia-600"
      : "from-emerald-500 to-teal-600";
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300">
      <div className={`flex items-stretch bg-gradient-to-br ${tone} text-white`}>
        <div className="flex w-24 shrink-0 flex-col items-center justify-center px-3 py-5 text-center bg-black/10">
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">{event.month}</span>
          <span className="text-2xl font-extrabold leading-none">{event.day}</span>
          <span className="text-xs font-semibold text-white/80">{event.year}</span>
        </div>
        <div className="flex flex-1 flex-col justify-center border-l border-white/20 px-5 py-4">
          <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-white w-fit mb-1">
            {event.term}
          </span>
          <h3 className="text-base font-extrabold leading-snug text-white">{event.title}</h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="space-y-2.5 text-sm text-slate-600">
          <p className="flex items-center gap-2.5 font-medium">
            <CalendarDays className="h-4 w-4 text-[#2563EB]" />
            {event.date}
          </p>
          <p className="flex items-start gap-2.5 font-medium">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
            {event.location}
          </p>
          <p className="flex items-center gap-2.5 font-medium">
            <Clock className="h-4 w-4 text-[#2563EB]" />
            {event.format}
          </p>
        </div>
        <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
          <strong className="text-slate-900">Audience:</strong> {event.targetAudience}
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-500">{event.description}</p>
        <Link
          href={event.cta}
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#2563EB] transition hover:gap-3.5"
        >
          Register / Get Involved <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function WinnerCard({ winner }: { winner: Winner }) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300">
      <div className="relative h-64 overflow-hidden bg-slate-900">
        <img
          src={winner.image}
          alt={winner.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-[#0B132B]/20 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-xs font-bold text-white shadow backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified Winner
          </span>
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <Badge tone="cyan">{winner.competition}</Badge>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-extrabold text-[#172554] line-clamp-1">{winner.name}</h3>
        <p className="mt-1 text-xs font-semibold text-slate-500 line-clamp-1">{winner.school}</p>
        <p className="text-[0.7rem] font-bold text-slate-400">{winner.state}</p>

        {winner.prize && (
          <div className="mt-3 rounded-xl bg-amber-500/10 p-2 text-xs font-extrabold text-amber-900 flex items-center gap-1.5 border border-amber-500/20">
            <Trophy className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="line-clamp-1">{winner.prize}</span>
          </div>
        )}

        {winner.score && (
          <div className="mt-2 text-xs font-bold text-blue-700">
            Score: {winner.score}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
          <span className="line-clamp-1 text-slate-700">{winner.category}</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-[#2563EB] shrink-0">
            {winner.year}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div className="group rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10">
      <div className="relative mx-auto h-28 w-28">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 shadow-lg shadow-blue-600/25">
          <User className="h-12 w-12 text-white/90" />
        </div>
        <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-100">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
        </span>
      </div>
      <h3 className="mt-6 text-lg font-extrabold text-[#172554]">{member.name}</h3>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#2563EB]">{member.role}</p>
      <p className="mt-4 text-xs leading-relaxed text-slate-600">{member.bio}</p>
    </div>
  );
}

export function PartnerTile({ partner }: { partner: Partner }) {
  return (
    <div className="group flex min-h-[180px] flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[0.7rem] font-bold text-[#2563EB]">
            {partner.badge || partner.category}
          </span>
          <span className="text-[0.65rem] font-medium text-slate-400 uppercase tracking-wider">
            Partner
          </span>
        </div>

        {partner.logo ? (
          <div className="flex h-16 w-full items-center justify-center rounded-xl bg-slate-50 p-2">
            <img
              src={partner.logo}
              alt={partner.name}
              className="max-h-full max-w-full object-contain filter transition group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex h-16 w-full items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700">
            {partner.name}
          </div>
        )}

        <p className="mt-4 text-sm font-extrabold text-[#172554]">{partner.name}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-3">
          {partner.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[0.7rem] font-semibold text-slate-400">
        <span>Verified Partner</span>
        <span className="text-[#2563EB] group-hover:underline flex items-center gap-1">
          Learn More <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300"
    >
      <div className="relative h-52 overflow-hidden bg-slate-900">
        <img
          src={article.image}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B]/80 via-transparent to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge tone="purple">{article.category}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold text-slate-400">{article.date}</p>
        <h3 className="mt-2 text-lg font-extrabold leading-snug text-[#172554] transition group-hover:text-[#2563EB]">
          {article.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-3">
          {article.excerpt}
        </p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#2563EB] transition group-hover:gap-3.5">
          Read Full Story <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export function GalleryItem({ item }: { item: GalleryItem }) {
  return (
    <figure className="group relative overflow-hidden rounded-3xl border border-slate-100 shadow-sm bg-slate-900">
      <img
        src={item.image}
        alt={item.title}
        className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-[#0B132B]/30 to-transparent opacity-80 transition group-hover:opacity-100" />
      <figcaption className="absolute inset-x-0 bottom-0 p-5">
        <Badge tone="cyan">{item.category}</Badge>
        <p className="mt-2 text-base font-extrabold text-white">{item.title}</p>
        <p className="mt-1 max-h-0 overflow-hidden text-xs text-slate-200 opacity-0 transition-all duration-500 group-hover:max-h-20 group-hover:opacity-100">
          {item.caption}
        </p>
      </figcaption>
    </figure>
  );
}

export function ValueCard({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: string;
  index?: number;
}) {
  const gradient =
    (index ?? 0) % 2 === 0
      ? "from-cyan-500 to-blue-600"
      : "from-purple-600 to-fuchsia-600";
  return (
    <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300">
      <div
        className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
      >
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-extrabold text-[#172554]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

export function HelpCard({
  title,
  description,
  icon,
  href,
  index,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  index?: number;
}) {
  const gradients = [
    "from-cyan-500 to-blue-600",
    "from-blue-600 to-purple-600",
    "from-purple-600 to-fuchsia-600",
    "from-cyan-500 to-purple-600",
    "from-blue-500 to-cyan-500",
    "from-fuchsia-600 to-purple-700",
  ];
  const gradient = gradients[(index ?? 0) % gradients.length];
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-300"
    >
      <div
        className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
      >
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-extrabold text-[#172554]">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#2563EB] transition group-hover:gap-3.5">
        Explore Initiative <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
