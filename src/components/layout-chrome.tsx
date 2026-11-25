"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { InteractiveFloatingWidget } from "@/components/ui";

export default function LayoutChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isStandaloneWorkspace =
    pathname.startsWith("/exam") || pathname.startsWith("/admin");

  if (isStandaloneWorkspace) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <InteractiveFloatingWidget />
    </>
  );
}
