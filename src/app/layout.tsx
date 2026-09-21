import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ContentProvider } from "@/context/content-context";
import { InteractiveFloatingWidget } from "@/components/ui";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Prime STEM Nigeria — STEM Education, Innovation & Opportunity",
    template: "%s | Prime STEM Nigeria",
  },
  description:
    "Prime STEM Nigeria empowers Nigerian children and young people through STEM competitions, boot camps, teacher training, technology initiatives and national and international opportunities.",
  keywords: [
    "Prime STEM Nigeria",
    "STEM education Nigeria",
    "STEM competitions",
    "science competitions",
    "STEM boot camp",
    "teacher training",
    "ANSC",
    "STEM Kids Championship",
    "African Organic Chemistry Tournament",
    "STEMx Boot Camp",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="min-h-screen bg-white text-[#0F172A] antialiased">
        <ContentProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <InteractiveFloatingWidget />
        </ContentProvider>
      </body>
    </html>
  );
}
