import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import LayoutChrome from "@/components/layout-chrome";
import { ContentProvider } from "@/context/content-context";

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
    <html lang="en">
      <body className="min-h-screen bg-white text-[#0F172A] antialiased">
        <ContentProvider>
          <LayoutChrome>{children}</LayoutChrome>
        </ContentProvider>
      </body>
    </html>
  );
}
