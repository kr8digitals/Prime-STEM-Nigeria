# Prime STEM Nigeria — Official Web Platform & Powerhouse Admin

> Devoted to the promotion and advancement of Science, Technology, Engineering, and Mathematics (STEM) education among Nigerian children and youth.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Enabled-f43f5e?style=flat)](https://turbo.build/)

---

## 🌟 Overview

**Prime STEM Nigeria** (CAC Registered: *PRIME STEM INNOVATION AND TECH ACADEMY*) is a learner-centric STEM institution inspiring curious minds and shaping future African innovators.

This web application provides a public platform featuring flagship competitions, teacher enablement programs, media galleries, past question portals, and a **Powerhouse Admin Dashboard (`/admin`)** providing complete administrative control over website content, registrations, and inquiries.

---

## 🚀 Key Features

### 1. Public Platform
* **25+ Static & Dynamic Pages:** Comprehensive coverage of programs, services, news, events, partners, gallery, and school engagement.
* **Flagship Programs:**
  * **STEM Kids Championship (SKC):** 5th Edition national championship with active **₦2,000 Early Bird** registration fee.
  * **African Organic Chemistry Tournament (AOCT):** Continental chemistry Olympiad.
  * **Annual National Science Championship (ANSC):** Secondary school STEM tournament.
  * **SCI-SPELL:** Science vocabulary and literacy competition.
  * **International STEMx Boot Camp 5.0:** Hands-on robotics, coding, AI & 3D design.
  * **Laptops for Schools Project:** Subsidized bulk computer labs with flexible pay-on-delivery.
* **Hall of Fame & Real Champions:** Profile of verified national winners, schools, and over **₦2,700,000 in cash awards** distributed.
* **2026/2027 Academic Session Calendar:** 3-term published schedule of statewide award tours, examinations, and science teachers' hangouts.
* **Master Preparatory Guide:** Verified past questions and solutions (2022–2025) via Selar.
* **Interactive Live Desk Assistant:** Unobtrusive floating assistant widget with one-click WhatsApp chat (`+234 813 825 8491`) and instant bank account copying (`1025357212`).
* **Infinite Marquee Tickers:** Smooth continuous tickers showcasing verified partners and accredited participating schools.
* **Mobile Responsiveness:** Tested and optimized for smartphones, tablets, and desktops.

---

### 2. Central Powerhouse Admin Dashboard (`/admin`)
Accessible only with master password authentication:

* **Authentication Barrier:** Server-verified access with password protection.
* **Real-Time Data Sync:** Changes to programs, banners, fees, bank accounts, or winners immediately reflect across all 25 public pages.
* **11 Administrative Modules:**
  1. 📊 **Command Center:** Real-time analytics for registrations, messages, winners, and active programs.
  2. 👥 **Registrations CRM:** Full candidate and school registration database with search, filter, status toggles, and **one-click CSV export**.
  3. 💬 **Contact Inquiries:** Inbox for inquiries submitted via `/contact` with direct `mailto:` reply triggers.
  4. ✨ **Early Bird & Announcements:** Toggle alert ribbons, modify registration fees, and update payment account directives.
  5. 🏆 **Winners & Hall of Fame:** Add, edit, or delete student champions, schools, and prize amounts.
  6. 🏅 **Programs & Competitions:** Modify titles, syllabi, cash prizes, dates, locations, and formats.
  7. 🤝 **Partners & Accredited Schools:** Manage strategic partners (NJFP / UNDP, AFRISTEM, SYLCOUTECH, Linguafront) and accredited school tags.
  8. 📅 **2026/2027 Calendar:** Manage term-by-term nationwide schedules and exams.
  9. 📖 **STEM Guide Handbook:** Edit details for the *Practical STEM Guide for Schools* teacher manual.
  10. 🖼️ **Media Gallery:** Add, categorize, or delete photos and captions displayed in the public gallery.
  11. 💳 **Bank & Organization Credentials:** Official bank accounts (UBA: `1025357212`), phone lines, and physical office addresses.

---

## 🛠️ Technology Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **UI Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Form Validation:** [Zod](https://zod.dev/)
* **State Management:** Custom React Context (`ContentProvider`) with JSON persistence
* **Database / Store:** File-based JSON store (`data/site-content.json` & `data/submissions.json`) with SQLite schema compatibility via [Drizzle ORM](https://orm.drizzle.team/)

---

## 📦 Getting Started

### Prerequisites
* Node.js 18.18+ or 20+
* npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kr8digitals/Prime-STEM-Nigeria.git
   cd Prime-STEM-Nigeria
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   * Public website: [http://localhost:3000](http://localhost:3000)
   * Admin Powerhouse: [http://localhost:3000/admin](http://localhost:3000/admin)

5. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🏛️ Official Contact Details

* **Headquarters:** Utako, Abuja, Federal Capital Territory, Nigeria
* **Regional Office:** Ezza Road, Abakaliki, Ebonyi State, Nigeria
* **Phone Lines:** +234 813 825 8491 / +234 810 554 1242
* **Email:** [primestemnigeria@gmail.com](mailto:primestemnigeria@gmail.com)
* **Bank Account:** United Bank for Africa (UBA), Account Name: `PRIME STEM NIGERIA`, Account No: `1025357212`

---

## 📄 License

© 2026 Prime STEM Nigeria. All rights reserved.
