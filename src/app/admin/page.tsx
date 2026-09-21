"use client";

import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  Handshake,
  Image as ImageIcon,
  KeyRound,
  Laptop,
  Layers,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X,
  School,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useContent, SiteContent } from "@/context/content-context";

export default function AdminPage() {
  const { content, updateContent, resetToDefaults, refreshContent } = useContent();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "registrations"
    | "messages"
    | "announcements"
    | "winners"
    | "programs"
    | "partners"
    | "calendar"
    | "stemguide"
    | "gallery"
    | "settings"
  >("overview");

  // Submissions Data
  const [submissions, setSubmissions] = useState<{
    registrations: any[];
    contactMessages: any[];
  }>({ registrations: [], contactMessages: [] });
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [registrationSearch, setRegistrationSearch] = useState("");
  const [registrationFilter, setRegistrationFilter] = useState("All");

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modals & Form States
  const [editingWinner, setEditingWinner] = useState<any | null>(null);
  const [showAddWinner, setShowAddWinner] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any | null>(null);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddGallery, setShowAddGallery] = useState(false);
  const [newSchoolInput, setNewSchoolInput] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem("prime_admin_session");
    if (saved === "authenticated") {
      setIsAuthenticated(true);
      fetchSubmissions();
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        localStorage.setItem("prime_admin_session", "authenticated");
        showToast("Welcome to Prime STEM Powerhouse Dashboard!");
        fetchSubmissions();
      } else {
        setAuthError(data.error || "Access Denied: Incorrect password");
      }
    } catch {
      setAuthError("Authentication service error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("prime_admin_session");
    setPasswordInput("");
  };

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch("/api/admin/submissions", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleDeleteSubmission = async (type: "registrations" | "contactMessages", id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/admin/submissions?type=${type}&id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSubmissions((prev) => ({
          ...prev,
          [type]: prev[type].filter((item) => item.id !== id),
        }));
        showToast("Record deleted successfully.");
      }
    } catch {
      alert("Failed to delete record.");
    }
  };

  // Export registrations to CSV
  const exportRegistrationsCSV = () => {
    if (!submissions.registrations.length) {
      alert("No registrations available to export.");
      return;
    }
    const headers = ["ID", "Full Name", "Email", "Phone", "Category", "Programme", "Message", "Date"];
    const rows = submissions.registrations.map((r) => [
      r.id,
      `"${r.fullName || ""}"`,
      `"${r.email || ""}"`,
      `"${r.phone || ""}"`,
      `"${r.category || ""}"`,
      `"${r.program || ""}"`,
      `"${(r.message || "").replace(/"/g, '""')}"`,
      `"${r.createdAt || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `prime_stem_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported registrations to CSV!");
  };

  // Helper to save section changes
  const handleSaveSection = async (key: keyof SiteContent, data: any) => {
    setIsSaving(true);
    const success = await updateContent({ [key]: data });
    setIsSaving(false);
    if (success) {
      showToast(`Saved changes to ${String(key)} successfully!`);
    } else {
      alert("Error saving changes.");
    }
  };

  // Reset all contents to defaults
  const handleReset = async () => {
    if (
      !confirm(
        "WARNING: This will reset all website contents (programs, winners, announcements, calendar) back to the official default content. Proceed?"
      )
    )
      return;
    setIsSaving(true);
    const ok = await resetToDefaults();
    setIsSaving(false);
    if (ok) {
      showToast("All contents reset to official defaults.");
    }
  };

  if (!authChecked) {
    return <div className="min-h-screen bg-[#0B132B] flex items-center justify-center text-white">Loading Admin Portal…</div>;
  }

  // -------------------------------------------------------------
  // SECURE LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-[#0B132B] flex items-center justify-center p-5 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-purple-600/25 blur-3xl" />

        <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl text-white">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 shadow-lg shadow-blue-600/30">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <span className="mt-5 inline-block rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">
              Restricted Access
            </span>
            <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Prime STEM Powerhouse
            </h1>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Administrative Command Center. Central control for registrations, announcements, programs, winners, calendar, and website contents.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Master Administrator Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter administrator password…"
                  required
                  className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3.5 pr-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/20 p-3 text-xs font-semibold text-red-200 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:brightness-110 active:scale-98 disabled:opacity-50"
            >
              {authLoading ? "Authenticating…" : "Unlock Powerhouse Dashboard →"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED POWERHOUSE DASHBOARD
  // -------------------------------------------------------------
  const registrations = submissions.registrations || [];
  const messages = submissions.contactMessages || [];

  const filteredRegistrations = registrations.filter((r) => {
    const matchProg =
      registrationFilter === "All" ||
      (r.program && r.program.toLowerCase().includes(registrationFilter.toLowerCase()));
    const matchSearch =
      registrationSearch.trim() === "" ||
      (r.fullName && r.fullName.toLowerCase().includes(registrationSearch.toLowerCase())) ||
      (r.email && r.email.toLowerCase().includes(registrationSearch.toLowerCase())) ||
      (r.phone && r.phone.toLowerCase().includes(registrationSearch.toLowerCase()));
    return matchProg && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B132B]/95 backdrop-blur-xl px-5 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow">
              <img
                src="/images/logo-tight.png"
                alt="Prime STEM Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">
                  PRIME STEM <span className="text-cyan-400">POWERHOUSE</span>
                </span>
                <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-[0.65rem] font-bold text-cyan-300 uppercase">
                  Central Admin
                </span>
              </div>
              <p className="text-[0.65rem] text-slate-400">
                Connected to All 25 Pages • Real-Time Database Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-white/15 hover:bg-white/20 transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-cyan-300" /> View Live Site
            </Link>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 ring-1 ring-red-500/20 hover:bg-red-500/20 transition"
              title="Reset all content to official defaults"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-slate-200 ring-1 ring-white/15 hover:bg-red-600 hover:text-white transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mx-auto max-w-7xl mt-3 flex items-center gap-1 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          {[
            { id: "overview", label: "Command Center", icon: Layers },
            { id: "registrations", label: `Registrations (${registrations.length})`, icon: Users },
            { id: "messages", label: `Inquiries (${messages.length})`, icon: MessageSquare },
            { id: "announcements", label: "Early Bird & Banner", icon: Sparkles },
            { id: "winners", label: `Winners (${content.winners.length})`, icon: Trophy },
            { id: "programs", label: `Programs (${content.programs.length})`, icon: Award },
            { id: "partners", label: `Partners (${content.partners.length})`, icon: Handshake },
            { id: "calendar", label: `2026/27 Calendar (${content.events.length})`, icon: Calendar },
            { id: "stemguide", label: "STEM Guide Handbook", icon: BookOpen },
            { id: "gallery", label: `Gallery (${content.gallery.length})`, icon: ImageIcon },
            { id: "settings", label: "Bank & Credentials", icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-md font-black"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Admin Content Body */}
      <main className="flex-1 p-5 sm:p-8 max-w-7xl mx-auto w-full">
        {/* =========================================================
            TAB 1: COMMAND CENTER / OVERVIEW
        ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-[#0B132B] p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registrations</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-[#38BDF8]">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-black text-white">{registrations.length}</p>
                <p className="mt-1 text-xs text-cyan-300 font-semibold">Active candidate submissions</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0B132B] p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Inquiries</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-black text-white">{messages.length}</p>
                <p className="mt-1 text-xs text-purple-300 font-semibold">Messages from schools &amp; public</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0B132B] p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Championship Winners</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                    <Trophy className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-black text-white">{content.winners.length}</p>
                <p className="mt-1 text-xs text-amber-300 font-semibold">Verified champions profiled</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0B132B] p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Programs</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    <Award className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-black text-white">{content.programs.length}</p>
                <p className="mt-1 text-xs text-emerald-300 font-semibold">Flagship initiatives live</p>
              </div>
            </div>

            {/* Quick Action Control Bar */}
            <div className="rounded-3xl border border-white/10 bg-[#0B132B] p-6 sm:p-8">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" /> Quick Powerhouse Actions
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Instantly modify key site sections, export registration records, or update payment directives.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  onClick={() => setActiveTab("registrations")}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-cyan-400/50 hover:bg-white/10 transition"
                >
                  <Users className="h-5 w-5 text-cyan-400 mb-2" />
                  <p className="text-sm font-bold text-white">Review Registrations</p>
                  <p className="text-xs text-slate-400 mt-1">View candidates &amp; download CSV</p>
                </button>

                <button
                  onClick={() => setActiveTab("announcements")}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-amber-400/50 hover:bg-white/10 transition"
                >
                  <Sparkles className="h-5 w-5 text-amber-400 mb-2" />
                  <p className="text-sm font-bold text-white">Edit ₦2,000 Early Bird</p>
                  <p className="text-xs text-slate-400 mt-1">Modify fees &amp; UBA bank details</p>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("winners");
                    setShowAddWinner(true);
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-emerald-400/50 hover:bg-white/10 transition"
                >
                  <Trophy className="h-5 w-5 text-emerald-400 mb-2" />
                  <p className="text-sm font-bold text-white">Add New Champion</p>
                  <p className="text-xs text-slate-400 mt-1">Profile winning schools &amp; cash</p>
                </button>

                <button
                  onClick={() => setActiveTab("calendar")}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-purple-400/50 hover:bg-white/10 transition"
                >
                  <Calendar className="h-5 w-5 text-purple-400 mb-2" />
                  <p className="text-sm font-bold text-white">Manage 2026/27 Events</p>
                  <p className="text-xs text-slate-400 mt-1">Update tour dates &amp; exams</p>
                </button>
              </div>
            </div>

            {/* Recent Registrations Preview */}
            <div className="rounded-3xl border border-white/10 bg-[#0B132B] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-white">Latest Candidate &amp; School Registrations</h3>
                <button
                  onClick={() => setActiveTab("registrations")}
                  className="text-xs font-bold text-cyan-300 hover:underline"
                >
                  View All ({registrations.length}) →
                </button>
              </div>

              {registrations.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No registrations recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2.5 px-3">Candidate / Contact</th>
                        <th className="py-2.5 px-3">Email &amp; Phone</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Programme</th>
                        <th className="py-2.5 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {registrations.slice(0, 5).map((r) => (
                        <tr key={r.id} className="hover:bg-white/5">
                          <td className="py-3 px-3 font-bold text-white">{r.fullName}</td>
                          <td className="py-3 px-3 text-slate-300">
                            <div>{r.email}</div>
                            <div className="text-slate-500">{r.phone}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="rounded bg-blue-500/20 px-2 py-0.5 text-blue-300 font-bold">
                              {r.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-cyan-300 font-semibold">{r.program}</td>
                          <td className="py-3 px-3 text-slate-400">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: REGISTRATIONS CRM
        ========================================================= */}
        {activeTab === "registrations" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Registrations Database</h2>
                <p className="text-xs text-slate-400">
                  Total of {registrations.length} candidates and schools registered online.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchSubmissions}
                  className="rounded-xl bg-white/10 p-2.5 text-slate-300 hover:bg-white/20 transition"
                  title="Refresh data"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={exportRegistrationsCSV}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow hover:bg-emerald-400 transition"
                >
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={registrationSearch}
                  onChange={(e) => setRegistrationSearch(e.target.value)}
                  placeholder="Search by name, email, or phone…"
                  className="w-full rounded-xl border border-white/10 bg-[#0B132B] py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                />
              </div>
              <select
                value={registrationFilter}
                onChange={(e) => setRegistrationFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#0B132B] px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
              >
                <option value="All">All Programmes</option>
                <option value="STEM Kids Championship">STEM Kids Championship</option>
                <option value="African Organic Chemistry">African Organic Chemistry (AOCT)</option>
                <option value="Annual National Science">ANSC / Nigerian STEM</option>
                <option value="STEMx">STEMx Boot Camp</option>
              </select>
            </div>

            {/* Table */}
            <div className="rounded-3xl border border-white/10 bg-[#0B132B] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[0.68rem]">
                    <tr>
                      <th className="py-3.5 px-4">Candidate / Rep</th>
                      <th className="py-3.5 px-4">Contact Details</th>
                      <th className="py-3.5 px-4">Role / Category</th>
                      <th className="py-3.5 px-4">Target Programme</th>
                      <th className="py-3.5 px-4">Notes / Message</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No matching registrations found.
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((r) => (
                        <tr key={r.id} className="hover:bg-white/5 transition">
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                            {r.fullName}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-slate-300 font-medium">{r.email}</div>
                            <div className="text-slate-500 font-mono text-[0.7rem]">{r.phone}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-blue-300 font-bold">
                              {r.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-cyan-300">
                            {r.program}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-slate-400">
                            {r.message || "—"}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteSubmission("registrations", r.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition"
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: CONTACT INQUIRIES
        ========================================================= */}
        {activeTab === "messages" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Contact Form Inquiries</h2>
                <p className="text-xs text-slate-400">
                  Messages received from schools, teachers, parents, and prospective partners.
                </p>
              </div>
              <button
                onClick={fetchSubmissions}
                className="rounded-xl bg-white/10 p-2.5 text-slate-300 hover:bg-white/20 transition"
                title="Refresh messages"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B132B] overflow-hidden shadow-xl">
              {messages.length === 0 ? (
                <p className="py-12 text-center text-slate-500 text-xs">No contact messages received yet.</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {messages.map((m) => (
                    <div key={m.id} className="p-5 hover:bg-white/5 transition flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">{m.fullName}</span>
                          <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[0.65rem] font-bold text-cyan-300">
                            {m.category || "Inquiry"}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-amber-300">Subject: {m.subject || "General Inquiry"}</p>
                        <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                          {m.message}
                        </p>
                        <div className="flex items-center gap-4 text-[0.7rem] text-slate-400 pt-1">
                          <span>Email: <strong className="text-slate-200">{m.email}</strong></span>
                          {m.phone && <span>Phone: <strong className="text-slate-200">{m.phone}</strong></span>}
                          <span>Date: {new Date(m.createdAt || Date.now()).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex sm:flex-col justify-end gap-2">
                        <a
                          href={`mailto:${m.email}?subject=RE: ${encodeURIComponent(m.subject || "Prime STEM Inquiry")}`}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-[0.7rem] font-bold text-white hover:bg-blue-500 transition text-center"
                        >
                          Reply Email
                        </a>
                        <button
                          onClick={() => handleDeleteSubmission("contactMessages", m.id)}
                          className="rounded-lg bg-red-500/10 px-3 py-1 text-[0.7rem] font-bold text-red-300 hover:bg-red-500/20 transition text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: ANNOUNCEMENTS & EARLY BIRD MANAGER
        ========================================================= */}
        {activeTab === "announcements" && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-black text-white">Announcement &amp; Early Bird Control</h2>
              <p className="text-xs text-slate-400">
                Configure the top alert ribbon, registration fee discount, and bank details shown across the site.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B132B] p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Early Bird Banner Visibility</h3>
                  <p className="text-xs text-slate-400">Enable or disable the top announcement bar on all pages.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={content.earlyBirdOffer?.active}
                    onChange={(e) =>
                      handleSaveSection("earlyBirdOffer", {
                        ...content.earlyBirdOffer,
                        active: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Announcement Title</label>
                  <input
                    type="text"
                    defaultValue={content.earlyBirdOffer?.title}
                    onBlur={(e) =>
                      handleSaveSection("earlyBirdOffer", {
                        ...content.earlyBirdOffer,
                        title: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Fee per Candidate</label>
                  <input
                    type="text"
                    defaultValue={content.earlyBirdOffer?.feePerCandidate}
                    onBlur={(e) =>
                      handleSaveSection("earlyBirdOffer", {
                        ...content.earlyBirdOffer,
                        feePerCandidate: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white font-bold text-cyan-300"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Minimum Candidates for Discount</label>
                  <input
                    type="text"
                    defaultValue={content.earlyBirdOffer?.minCandidates}
                    onBlur={(e) =>
                      handleSaveSection("earlyBirdOffer", {
                        ...content.earlyBirdOffer,
                        minCandidates: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Master Preparatory Guide URL (Selar)</label>
                  <input
                    type="text"
                    defaultValue={content.earlyBirdOffer?.masterGuide?.url}
                    onBlur={(e) =>
                      handleSaveSection("earlyBirdOffer", {
                        ...content.earlyBirdOffer,
                        masterGuide: {
                          ...content.earlyBirdOffer?.masterGuide,
                          url: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Bank Details Editor */}
              <div className="border-t border-white/10 pt-5 space-y-4">
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Official Payment Bank Account
                </h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      defaultValue={content.earlyBirdOffer?.bankDetails?.bank}
                      onBlur={(e) =>
                        handleSaveSection("earlyBirdOffer", {
                          ...content.earlyBirdOffer,
                          bankDetails: {
                            ...content.earlyBirdOffer?.bankDetails,
                            bank: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-xs text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Account Name</label>
                    <input
                      type="text"
                      defaultValue={content.earlyBirdOffer?.bankDetails?.accountName}
                      onBlur={(e) =>
                        handleSaveSection("earlyBirdOffer", {
                          ...content.earlyBirdOffer,
                          bankDetails: {
                            ...content.earlyBirdOffer?.bankDetails,
                            accountName: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-xs text-cyan-300 font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      defaultValue={content.earlyBirdOffer?.bankDetails?.accountNumber}
                      onBlur={(e) =>
                        handleSaveSection("earlyBirdOffer", {
                          ...content.earlyBirdOffer,
                          bankDetails: {
                            ...content.earlyBirdOffer?.bankDetails,
                            accountNumber: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/30 p-2.5 text-xs text-amber-300 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 5: HALL OF FAME & WINNERS MANAGER
        ========================================================= */}
        {activeTab === "winners" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Championship Winners &amp; Hall of Fame</h2>
                <p className="text-xs text-slate-400">
                  Manage verified student champions, schools, cash prizes, and ceremony photos.
                </p>
              </div>
              <button
                onClick={() => setShowAddWinner(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow hover:brightness-110 transition"
              >
                <Plus className="h-4 w-4" /> Add New Champion
              </button>
            </div>

            {/* Winners Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.winners.map((winner, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-white/10 bg-[#0B132B] p-5 shadow-lg relative flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-slate-950">
                      <img
                        src={winner.image}
                        alt={winner.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute top-2.5 right-2.5 rounded-full bg-emerald-500 px-2 py-0.5 text-[0.65rem] font-bold text-white">
                        Verified
                      </span>
                      <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[0.65rem] font-bold text-cyan-300">
                        {winner.year}
                      </span>
                    </div>

                    <h3 className="font-black text-white text-base">{winner.name}</h3>
                    <p className="text-xs font-bold text-slate-300 mt-0.5">{winner.school}</p>
                    <p className="text-[0.7rem] text-slate-500">{winner.state}</p>

                    {winner.prize && (
                      <div className="mt-3 rounded-lg bg-amber-500/10 p-2 text-xs font-extrabold text-amber-300 border border-amber-500/20">
                        🏆 {winner.prize}
                      </div>
                    )}
                    <div className="mt-2 text-[0.7rem] text-cyan-400 font-semibold">
                      {winner.competition} • {winner.category}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => setEditingWinner({ ...winner, index: idx })}
                      className="text-xs font-bold text-cyan-300 hover:underline"
                    >
                      Edit Champion
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete champion profile for ${winner.name}?`)) {
                          const updated = content.winners.filter((_, i) => i !== idx);
                          handleSaveSection("winners", updated);
                        }
                      }}
                      className="text-xs font-bold text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Add or Edit Winner */}
            {(showAddWinner || editingWinner) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-[#0B132B] p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
                    <h3 className="text-lg font-black">
                      {editingWinner ? "Edit Champion Profile" : "Add New Champion"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddWinner(false);
                        setEditingWinner(null);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const item = {
                        name: fd.get("name") as string,
                        school: fd.get("school") as string,
                        state: fd.get("state") as string,
                        competition: fd.get("competition") as string,
                        category: fd.get("category") as string,
                        achievement: fd.get("achievement") as string,
                        prize: fd.get("prize") as string,
                        year: fd.get("year") as string,
                        image: (fd.get("image") as string) || "/images/awards/championship-2025-winners-stage.jpg",
                        verified: true,
                      };

                      let updatedList = [...content.winners];
                      if (editingWinner) {
                        updatedList[editingWinner.index] = item;
                      } else {
                        updatedList.unshift(item);
                      }
                      handleSaveSection("winners", updatedList);
                      setShowAddWinner(false);
                      setEditingWinner(null);
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Champion / Team Name *</label>
                      <input
                        name="name"
                        defaultValue={editingWinner?.name || ""}
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">School Name *</label>
                      <input
                        name="school"
                        defaultValue={editingWinner?.school || ""}
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">State</label>
                        <input
                          name="state"
                          defaultValue={editingWinner?.state || "Lagos State"}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Year</label>
                        <input
                          name="year"
                          defaultValue={editingWinner?.year || "2025"}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Competition Name</label>
                      <input
                        name="competition"
                        defaultValue={editingWinner?.competition || "Nigerian STEM Championship"}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Category</label>
                        <input
                          name="category"
                          defaultValue={editingWinner?.category || "Junior Secondary"}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Achievement / Position</label>
                        <input
                          name="achievement"
                          defaultValue={editingWinner?.achievement || "1st Position — National Champion"}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Cash Prize / Awards Won</label>
                      <input
                        name="prize"
                        defaultValue={editingWinner?.prize || "₦500,000 Cash Prize + Plaque"}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-amber-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Photo Image URL</label>
                      <input
                        name="image"
                        defaultValue={editingWinner?.image || "/images/awards/championship-2025-winners-stage.jpg"}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white font-mono"
                      />
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddWinner(false);
                          setEditingWinner(null);
                        }}
                        className="rounded-xl px-4 py-2 bg-white/10 text-slate-300 hover:bg-white/20"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl px-5 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 font-bold text-slate-950 hover:brightness-110"
                      >
                        {editingWinner ? "Save Changes" : "Create Winner"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 6: PROGRAMS & COMPETITIONS MANAGER
        ========================================================= */}
        {activeTab === "programs" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Programs &amp; Competitions Manager</h2>
                <p className="text-xs text-slate-400">
                  Update program descriptions, eligibility levels, cash prizes, dates and locations.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {content.programs.map((program, idx) => (
                <div
                  key={program.slug}
                  className="rounded-3xl border border-white/10 bg-[#0B132B] p-6 shadow-xl flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={program.image}
                      alt={program.name}
                      className="h-20 w-28 rounded-2xl object-cover shrink-0 bg-slate-950"
                    />
                    <div>
                      <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[0.65rem] font-bold text-blue-300">
                        {program.category}
                      </span>
                      <h3 className="text-base font-black text-white mt-1">{program.name}</h3>
                      <p className="text-xs text-cyan-300 font-semibold">{program.tagline}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[0.7rem] text-slate-400">
                        <span>Target: <strong className="text-slate-200">{program.targetAudience}</strong></span>
                        <span>•</span>
                        <span>Date: <strong className="text-slate-200">{program.date}</strong></span>
                        <span>•</span>
                        <span>Format: <strong className="text-slate-200">{program.format}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditingProgram({ ...program, index: idx })}
                      className="rounded-xl bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 ring-1 ring-cyan-500/20 hover:bg-cyan-500/20 transition"
                    >
                      Edit Program Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Edit Program */}
            {editingProgram && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-[#0B132B] p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
                    <h3 className="text-lg font-black">Edit {editingProgram.name}</h3>
                    <button onClick={() => setEditingProgram(null)} className="text-slate-400 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const updated = {
                        ...editingProgram,
                        name: fd.get("name") as string,
                        shortName: fd.get("shortName") as string,
                        tagline: fd.get("tagline") as string,
                        targetAudience: fd.get("targetAudience") as string,
                        cashPrizes: fd.get("cashPrizes") as string,
                        date: fd.get("date") as string,
                        location: fd.get("location") as string,
                        format: fd.get("format") as string,
                        status: fd.get("status") as string,
                        overview: fd.get("overview") as string,
                      };
                      const list = [...content.programs];
                      list[editingProgram.index] = updated;
                      handleSaveSection("programs", list);
                      setEditingProgram(null);
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Program Full Name *</label>
                      <input
                        name="name"
                        defaultValue={editingProgram.name}
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Short Name / Code</label>
                        <input
                          name="shortName"
                          defaultValue={editingProgram.shortName}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Current Status Badge</label>
                        <input
                          name="status"
                          defaultValue={editingProgram.status}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-cyan-300 font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Tagline</label>
                      <input
                        name="tagline"
                        defaultValue={editingProgram.tagline}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Target Audience</label>
                      <input
                        name="targetAudience"
                        defaultValue={editingProgram.targetAudience}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Prizes &amp; Awards</label>
                      <input
                        name="cashPrizes"
                        defaultValue={editingProgram.cashPrizes || ""}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-amber-300 font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Date / Month</label>
                        <input
                          name="date"
                          defaultValue={editingProgram.date}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Location</label>
                        <input
                          name="location"
                          defaultValue={editingProgram.location}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Format</label>
                        <input
                          name="format"
                          defaultValue={editingProgram.format}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Overview Description</label>
                      <textarea
                        name="overview"
                        rows={4}
                        defaultValue={editingProgram.overview}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white leading-relaxed"
                      />
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setEditingProgram(null)}
                        className="rounded-xl px-4 py-2 bg-white/10 text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl px-5 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 font-bold text-slate-950"
                      >
                        Save Program Updates
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 7: PARTNERS & ACCREDITED SCHOOLS
        ========================================================= */}
        {activeTab === "partners" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Strategic Partners &amp; Sponsors</h2>
                <p className="text-xs text-slate-400">
                  Manage organization partners like Linguafront, NJFP/UNDP, AFRISTEM, SYLCOUTECH, Esthington Group.
                </p>
              </div>
              <button
                onClick={() => setShowAddPartner(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-xs font-black text-slate-950 shadow hover:brightness-110"
              >
                <Plus className="h-4 w-4" /> Add Partner
              </button>
            </div>

            {/* Partners Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.partners.map((partner, idx) => (
                <div key={idx} className="rounded-3xl border border-white/10 bg-[#0B132B] p-5 shadow-lg relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[0.65rem] font-bold text-blue-300">
                        {partner.badge || partner.category}
                      </span>
                    </div>

                    {partner.logo ? (
                      <div className="h-16 flex items-center justify-center bg-white/5 rounded-xl p-2 mb-3">
                        <img src={partner.logo} alt={partner.name} className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="h-16 flex items-center justify-center bg-white/5 rounded-xl font-bold text-xs text-slate-300 mb-3">
                        {partner.name}
                      </div>
                    )}

                    <h4 className="font-black text-white text-sm">{partner.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">{partner.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                    <button
                      onClick={() => setEditingPartner({ ...partner, index: idx })}
                      className="text-cyan-300 font-bold hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove partner ${partner.name}?`)) {
                          const updated = content.partners.filter((_, i) => i !== idx);
                          handleSaveSection("partners", updated);
                        }
                      }}
                      className="text-red-400 font-bold hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Accredited Participating Schools Manager */}
            <div className="rounded-3xl border border-white/10 bg-[#0B132B] p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <School className="h-5 w-5 text-[#38BDF8]" /> Accredited Participating Schools List
              </h3>
              <p className="text-xs text-slate-400">
                These schools are showcased as trusted institutional partners on the homepage, for-schools, and partners pages.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {content.accreditedSchools.map((school, sIdx) => (
                  <span
                    key={sIdx}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 border border-white/15"
                  >
                    <span>🏫 {school}</span>
                    <button
                      onClick={() => {
                        const updated = content.accreditedSchools.filter((_, i) => i !== sIdx);
                        handleSaveSection("accreditedSchools", updated);
                      }}
                      className="hover:text-red-400 ml-1"
                      title="Remove school"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New School Input */}
              <div className="pt-3 flex gap-2 max-w-md">
                <input
                  type="text"
                  value={newSchoolInput}
                  onChange={(e) => setNewSchoolInput(e.target.value)}
                  placeholder="Enter school name & state…"
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white"
                />
                <button
                  onClick={() => {
                    if (!newSchoolInput.trim()) return;
                    const updated = [...content.accreditedSchools, newSchoolInput.trim()];
                    handleSaveSection("accreditedSchools", updated);
                    setNewSchoolInput("");
                  }}
                  className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300"
                >
                  Add School
                </button>
              </div>
            </div>

            {/* Modal: Add or Edit Partner */}
            {(showAddPartner || editingPartner) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#0B132B] p-6 sm:p-8 text-white">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <h3 className="text-base font-black">
                      {editingPartner ? "Edit Partner" : "Add Partner"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddPartner(false);
                        setEditingPartner(null);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const item = {
                        name: fd.get("name") as string,
                        category: fd.get("category") as string,
                        badge: fd.get("badge") as string,
                        description: fd.get("description") as string,
                        logo: (fd.get("logo") as string) || undefined,
                      };
                      let list = [...content.partners];
                      if (editingPartner) {
                        list[editingPartner.index] = item;
                      } else {
                        list.unshift(item);
                      }
                      handleSaveSection("partners", list);
                      setShowAddPartner(false);
                      setEditingPartner(null);
                    }}
                    className="space-y-3.5 text-xs"
                  >
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Partner Organization Name *</label>
                      <input
                        name="name"
                        defaultValue={editingPartner?.name || ""}
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Category / Domain</label>
                      <input
                        name="category"
                        defaultValue={editingPartner?.category || "Education Partner"}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Display Badge (e.g. FGN / UNDP Initiative)</label>
                      <input
                        name="badge"
                        defaultValue={editingPartner?.badge || "Official Partner"}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-cyan-300"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Logo Image Path (e.g. /images/partners/njfp.png)</label>
                      <input
                        name="logo"
                        defaultValue={editingPartner?.logo || ""}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Description</label>
                      <textarea
                        name="description"
                        rows={3}
                        defaultValue={editingPartner?.description || ""}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddPartner(false);
                          setEditingPartner(null);
                        }}
                        className="rounded-xl px-4 py-2 bg-white/10 text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl px-5 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 font-bold text-slate-950"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 8: 2026/2027 ACADEMIC SESSION CALENDAR
        ========================================================= */}
        {activeTab === "calendar" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">2026/2027 Academic Session Calendar</h2>
                <p className="text-xs text-slate-400">
                  Official schedule of tours, exams, science teachers hangouts, and boot camps.
                </p>
              </div>
              <button
                onClick={() => setShowAddEvent(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow hover:brightness-110"
              >
                <Plus className="h-4 w-4" /> Add Event
              </button>
            </div>

            <div className="space-y-3">
              {content.events.map((event, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-[#0B132B] p-5 shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white/10 text-center font-bold">
                      <span className="text-[0.65rem] text-slate-400 uppercase">{event.month}</span>
                      <span className="text-sm text-cyan-300">{event.day}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[0.65rem] font-bold text-purple-300">
                          {event.term}
                        </span>
                        <h4 className="text-sm font-black text-white">{event.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-[0.7rem] text-slate-500">
                        <span>Location: <strong className="text-slate-300">{event.location}</strong></span>
                        <span>•</span>
                        <span>Format: <strong className="text-slate-300">{event.format}</strong></span>
                        <span>•</span>
                        <span>Audience: <strong className="text-slate-300">{event.targetAudience}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditingEvent({ ...event, index: idx })}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/20"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete event ${event.title}?`)) {
                          const updated = content.events.filter((_, i) => i !== idx);
                          handleSaveSection("events", updated);
                        }
                      }}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Add or Edit Event */}
            {(showAddEvent || editingEvent) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-[#0B132B] p-6 sm:p-8 text-white max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <h3 className="text-base font-black">
                      {editingEvent ? "Edit Calendar Event" : "Add Calendar Event"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddEvent(false);
                        setEditingEvent(null);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const item = {
                        sn: editingEvent?.sn || content.events.length + 1,
                        term: fd.get("term") as any,
                        title: fd.get("title") as string,
                        date: fd.get("date") as string,
                        month: fd.get("month") as string,
                        day: fd.get("day") as string,
                        year: fd.get("year") as string,
                        location: fd.get("location") as string,
                        format: fd.get("format") as string,
                        targetAudience: fd.get("targetAudience") as string,
                        description: fd.get("description") as string,
                        cta: "/register",
                      };
                      let list = [...content.events];
                      if (editingEvent) {
                        list[editingEvent.index] = item;
                      } else {
                        list.push(item);
                      }
                      handleSaveSection("events", list);
                      setShowAddEvent(false);
                      setEditingEvent(null);
                    }}
                    className="space-y-3.5 text-xs"
                  >
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Academic Term *</label>
                      <select
                        name="term"
                        defaultValue={editingEvent?.term || "First Term"}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      >
                        <option value="First Term">First Term</option>
                        <option value="Second Term">Second Term</option>
                        <option value="Third Term">Third Term</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Event Title *</label>
                      <input
                        name="title"
                        defaultValue={editingEvent?.title || ""}
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Month (e.g. Oct)</label>
                        <input
                          name="month"
                          defaultValue={editingEvent?.month || "Oct"}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Day(s) (e.g. 19–30)</label>
                        <input
                          name="day"
                          defaultValue={editingEvent?.day || "19–30"}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Year</label>
                        <input
                          name="year"
                          defaultValue={editingEvent?.year || "2026"}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Full Date String</label>
                      <input
                        name="date"
                        defaultValue={editingEvent?.date || "October 19th – 30th, 2026"}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Location</label>
                        <input
                          name="location"
                          defaultValue={editingEvent?.location || "All States in Nigeria + FCT"}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Format</label>
                        <input
                          name="format"
                          defaultValue={editingEvent?.format || "Physical"}
                          className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Target Audience</label>
                      <input
                        name="targetAudience"
                        defaultValue={editingEvent?.targetAudience || "All Schools & Students"}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Description</label>
                      <textarea
                        name="description"
                        rows={3}
                        defaultValue={editingEvent?.description || ""}
                        className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white"
                      />
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddEvent(false);
                          setEditingEvent(null);
                        }}
                        className="rounded-xl px-4 py-2 bg-white/10 text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl px-5 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 font-bold text-slate-950"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 9: STEM GUIDE HANDBOOK MANAGER
        ========================================================= */}
        {activeTab === "stemguide" && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-black text-white">STEM Guide for Schools Handbook</h2>
              <p className="text-xs text-slate-400">
                Modify handbook title, subtitle, mission quote, description, and chapter topics.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B132B] p-6 sm:p-8 space-y-5 shadow-xl">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Handbook Title</label>
                  <input
                    type="text"
                    defaultValue={content.stemGuideForSchools?.title}
                    onBlur={(e) =>
                      handleSaveSection("stemGuideForSchools", {
                        ...content.stemGuideForSchools,
                        title: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Status Badge</label>
                  <input
                    type="text"
                    defaultValue={content.stemGuideForSchools?.status}
                    onBlur={(e) =>
                      handleSaveSection("stemGuideForSchools", {
                        ...content.stemGuideForSchools,
                        status: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-cyan-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle</label>
                <input
                  type="text"
                  defaultValue={content.stemGuideForSchools?.subtitle}
                  onBlur={(e) =>
                    handleSaveSection("stemGuideForSchools", {
                      ...content.stemGuideForSchools,
                      subtitle: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mission Quote / Tagline</label>
                <input
                  type="text"
                  defaultValue={content.stemGuideForSchools?.mission}
                  onBlur={(e) =>
                    handleSaveSection("stemGuideForSchools", {
                      ...content.stemGuideForSchools,
                      mission: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-amber-300 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Overview Description</label>
                <textarea
                  rows={4}
                  defaultValue={content.stemGuideForSchools?.description}
                  onBlur={(e) =>
                    handleSaveSection("stemGuideForSchools", {
                      ...content.stemGuideForSchools,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 10: GALLERY MANAGER
        ========================================================= */}
        {activeTab === "gallery" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Media Gallery Manager</h2>
                <p className="text-xs text-slate-400">
                  Manage real event photos, boot camp images, and winner ceremonies shown in the public gallery.
                </p>
              </div>
              <button
                onClick={() => setShowAddGallery(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-xs font-black text-slate-950 shadow"
              >
                <Plus className="h-4 w-4" /> Add Photo
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {content.gallery.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-[#0B132B] overflow-hidden p-3 shadow relative flex flex-col justify-between">
                  <div>
                    <div className="h-36 rounded-xl overflow-hidden mb-2 bg-slate-950">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                    <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-[0.65rem] font-bold text-cyan-300">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-white text-xs mt-1 line-clamp-1">{item.title}</h4>
                    <p className="text-[0.7rem] text-slate-400 line-clamp-2 mt-0.5">{item.caption}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/10 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Remove gallery item ${item.title}?`)) {
                          const updated = content.gallery.filter((_, i) => i !== idx);
                          handleSaveSection("gallery", updated);
                        }
                      }}
                      className="text-[0.7rem] font-bold text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Add Gallery */}
            {showAddGallery && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#0B132B] p-6 text-white">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <h3 className="text-base font-black">Add Gallery Photo</h3>
                    <button onClick={() => setShowAddGallery(false)} className="text-slate-400 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const item = {
                        title: fd.get("title") as string,
                        category: fd.get("category") as string,
                        caption: fd.get("caption") as string,
                        image: fd.get("image") as string,
                      };
                      const list = [item, ...content.gallery];
                      handleSaveSection("gallery", list);
                      setShowAddGallery(false);
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Title *</label>
                      <input name="title" required className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Category</label>
                      <select name="category" className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white">
                        <option value="Competitions">Competitions</option>
                        <option value="Boot Camps">Boot Camps</option>
                        <option value="Awards & Winners">Awards &amp; Winners</option>
                        <option value="Schools & Workshops">Schools &amp; Workshops</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Image URL / Path *</label>
                      <input name="image" required defaultValue="/images/awards/championship-2025-winners-stage.jpg" className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Caption</label>
                      <textarea name="caption" rows={3} className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-white" />
                    </div>
                    <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                      <button type="button" onClick={() => setShowAddGallery(false)} className="rounded-xl px-4 py-2 bg-white/10">Cancel</button>
                      <button type="submit" className="rounded-xl px-5 py-2 bg-cyan-400 font-bold text-slate-950">Add</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 11: SETTINGS & ORGANIZATION CREDENTIALS
        ========================================================= */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-black text-white">Organization Settings &amp; Credentials</h2>
              <p className="text-xs text-slate-400">
                Official contact phone numbers, registration bank details, CAC credentials and office locations.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B132B] p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Organization Name</label>
                  <input
                    type="text"
                    defaultValue={content.organization?.name}
                    onBlur={(e) =>
                      handleSaveSection("organization", {
                        ...content.organization,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">CAC Registration Text</label>
                  <input
                    type="text"
                    defaultValue={content.organization?.cac}
                    onBlur={(e) =>
                      handleSaveSection("organization", {
                        ...content.organization,
                        cac: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-cyan-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Primary Phone (Call &amp; WhatsApp)</label>
                  <input
                    type="text"
                    defaultValue={content.organization?.phone}
                    onBlur={(e) =>
                      handleSaveSection("organization", {
                        ...content.organization,
                        phone: e.target.value,
                        phoneHref: e.target.value.replace(/\s+/g, ""),
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Secondary Phone</label>
                  <input
                    type="text"
                    defaultValue={content.organization?.secondaryPhone}
                    onBlur={(e) =>
                      handleSaveSection("organization", {
                        ...content.organization,
                        secondaryPhone: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Official Email Address</label>
                <input
                  type="email"
                  defaultValue={content.organization?.email}
                  onBlur={(e) =>
                    handleSaveSection("organization", {
                      ...content.organization,
                      email: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white"
                />
              </div>

              {/* Bank Account */}
              <div className="border-t border-white/10 pt-5">
                <h4 className="text-sm font-black text-amber-300 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Global Bank Details
                </h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[0.7rem] text-slate-400 font-bold mb-1">Bank Name</label>
                    <input
                      type="text"
                      defaultValue={content.organization?.bankDetails?.bank}
                      onBlur={(e) =>
                        handleSaveSection("organization", {
                          ...content.organization,
                          bankDetails: {
                            ...content.organization?.bankDetails,
                            bank: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] text-slate-400 font-bold mb-1">Account Name</label>
                    <input
                      type="text"
                      defaultValue={content.organization?.bankDetails?.accountName}
                      onBlur={(e) =>
                        handleSaveSection("organization", {
                          ...content.organization,
                          bankDetails: {
                            ...content.organization?.bankDetails,
                            accountName: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-cyan-300 font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] text-slate-400 font-bold mb-1">Account Number</label>
                    <input
                      type="text"
                      defaultValue={content.organization?.bankDetails?.accountNumber}
                      onBlur={(e) =>
                        handleSaveSection("organization", {
                          ...content.organization,
                          bankDetails: {
                            ...content.organization?.bankDetails,
                            accountNumber: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-amber-300 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
