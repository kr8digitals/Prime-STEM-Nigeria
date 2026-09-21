"use client";

import {
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Check,
  ChevronDown,
  Clock,
  Crown,
  FlaskConical,
  Flag,
  Globe,
  GraduationCap,
  Heart,
  Laptop,
  Lightbulb,
  MapPin,
  Menu,
  PenLine,
  Rocket,
  School,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// -------------------------------------------------------------
// ICON MAP — maps string names from content.ts to Lucide icons
// -------------------------------------------------------------
const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  rocket: Rocket,
  graduation: GraduationCap,
  book: BookOpen,
  school: School,
  globe: Globe,
  sparkles: Sparkles,
  flask: FlaskConical,
  brain: Brain,
  award: Award,
  flag: Flag,
  crown: Crown,
  wrench: Wrench,
  users: Users,
  laptop: Laptop,
  heart: Heart,
  pen: PenLine,
  map: MapPin,
  briefcase: Briefcase,
  shield: Shield,
  clock: Clock,
  target: Target,
  check: Check,
  lightbulb: Lightbulb,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = iconMap[name] ?? Sparkles;
  return <Cmp className={className} aria-hidden="true" />;
}

// -------------------------------------------------------------
// CONTAINER
// -------------------------------------------------------------
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

// -------------------------------------------------------------
// GRADIENT TEXT
// -------------------------------------------------------------
export function GradientText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}

// -------------------------------------------------------------
// SECTION HEADING
// -------------------------------------------------------------
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  dark = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "mb-12 max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow ? (
        <span
          className={cx(
            "mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em]",
            dark
              ? "bg-white/10 text-cyan-300 ring-1 ring-white/15"
              : "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cx(
          "text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]",
          dark ? "text-white" : "text-[#172554]"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cx(
            "mt-5 text-lg leading-relaxed",
            dark ? "text-slate-300" : "text-slate-600"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------
// BADGE
// -------------------------------------------------------------
export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "purple" | "cyan" | "magenta" | "green";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    magenta: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

// -------------------------------------------------------------
// BUTTONS
// -------------------------------------------------------------
type ButtonVariant = "primary" | "secondary" | "outline" | "white" | "ghost" | "gradient";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#2563EB] text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-700/30",
  secondary:
    "bg-[#6D28D9] text-white shadow-lg shadow-purple-600/25 hover:bg-purple-800 hover:shadow-purple-700/30",
  gradient:
    "bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/25 hover:brightness-110",
  outline:
    "border-2 border-[#2563EB] text-[#2563EB] hover:bg-blue-50",
  white:
    "bg-white text-[#172554] shadow-lg shadow-black/10 hover:bg-blue-50",
  ghost:
    "text-slate-700 hover:bg-slate-100",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  size = "md",
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };
  return (
    <a
      href={href}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-300 hover:-translate-y-0.5",
        sizes[size],
        buttonStyles[variant],
        className
      )}
    >
      {children}
    </a>
  );
}

// -------------------------------------------------------------
// REVEAL — scroll-triggered fade/slide-in animation
// -------------------------------------------------------------
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cx(
        "transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

// -------------------------------------------------------------
// COUNTER — animated number counter
// -------------------------------------------------------------
export function Counter({
  value,
  suffix = "",
  duration = 1800,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setDisplay(Math.round(eased * value));
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

// -------------------------------------------------------------
// MOBILE MENU ICONS (re-exported for header)
// -------------------------------------------------------------
export const MenuIcon = Menu;
export const CloseIcon = X;
export const ChevronDownIcon = ChevronDown;
// -------------------------------------------------------------
// MARQUEE TICKER — smooth infinite scroll for schools & partners
// -------------------------------------------------------------
export function MarqueeTicker({
  items,
  reverse = false,
}: {
  items: string[];
  reverse?: boolean;
}) {
  return (
    <div className="relative w-full overflow-hidden py-3">
      <div
        className={reverse ? "animate-marquee-reverse flex items-center gap-4" : "animate-marquee flex items-center gap-4"}
      >
        {items.concat(items).map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur whitespace-nowrap hover:border-cyan-400/50 hover:bg-white/10 transition"
          >
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// INTERACTIVE FLOATING ASSISTANT WIDGET
// -------------------------------------------------------------
export function InteractiveFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyBank = () => {
    navigator.clipboard.writeText("1025357212");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside aria-label="Quick Registration and Support" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end max-w-[calc(100vw-2rem)]">
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2rem)] max-w-sm sm:w-80 rounded-3xl border border-white/20 bg-[#0B132B]/95 p-4 sm:p-5 text-white shadow-2xl backdrop-blur-2xl animate-float">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                Prime STEM Live Desk
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
              aria-label="Close Assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-white/5 p-3.5 border border-cyan-400/20">
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> 5th STEM Kids Championship
              </p>
              <p className="text-[0.75rem] text-slate-300 mt-1 leading-snug">
                Early Bird rate is active: <strong className="text-white">₦2,000 / candidate</strong> for 10+ students.
              </p>
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-black/40 px-2.5 py-1.5 text-xs font-mono">
                <span className="text-cyan-300">UBA: 1025357212</span>
                <button
                  onClick={copyBank}
                  className="rounded bg-cyan-500/20 px-2 py-0.5 text-[0.65rem] font-bold text-cyan-200 hover:bg-cyan-500/40"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://wa.me/2348138258491?text=Hello%20Prime%20STEM%20Nigeria,%20I%20would%20like%20to%20inquire%20about%20competition%20registration"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow"
              >
                Chat WhatsApp
              </a>
              <a
                href="/register"
                className="flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-2 text-xs font-bold text-white hover:brightness-110 transition shadow"
              >
                Register Candidates
              </a>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 p-3.5 text-white shadow-2xl shadow-blue-600/50 hover:scale-105 active:scale-95 transition-all duration-300"
        aria-label="Quick Action Assistant"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300"></span>
        </span>
        <span className="text-xs font-extrabold pr-1 hidden sm:inline">
          {isOpen ? "Close Help" : "₦2k Early Bird / WhatsApp"}
        </span>
        <Sparkles className="h-4 w-4 text-amber-300 group-hover:rotate-12 transition-transform" />
      </button>
    </aside>
  );
}
