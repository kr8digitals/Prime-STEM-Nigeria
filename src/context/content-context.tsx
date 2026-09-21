"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import * as defaultData from "@/data/content";

export interface SiteContent {
  organization: typeof defaultData.ORGANIZATION;
  earlyBirdOffer: typeof defaultData.EARLY_BIRD_OFFER;
  stemGuideForSchools: typeof defaultData.STEM_GUIDE_FOR_SCHOOLS;
  stats: typeof defaultData.STATS;
  programs: typeof defaultData.PROGRAMS;
  services: typeof defaultData.SERVICES;
  events: typeof defaultData.EVENTS;
  winners: typeof defaultData.WINNERS;
  partners: typeof defaultData.PARTNERS;
  accreditedSchools: typeof defaultData.ACCREDITED_SCHOOLS;
  team: typeof defaultData.TEAM;
  news: typeof defaultData.NEWS;
  gallery: typeof defaultData.GALLERY;
  vision: string;
  mission: string;
  goal: string;
  values: typeof defaultData.VALUES;
  whyPrime: typeof defaultData.WHY_PRIME;
  approach: typeof defaultData.APPROACH;
  lastUpdated?: string;
}

const defaultContent: SiteContent = {
  organization: defaultData.ORGANIZATION,
  earlyBirdOffer: defaultData.EARLY_BIRD_OFFER,
  stemGuideForSchools: defaultData.STEM_GUIDE_FOR_SCHOOLS,
  stats: defaultData.STATS,
  programs: defaultData.PROGRAMS,
  services: defaultData.SERVICES,
  events: defaultData.EVENTS,
  winners: defaultData.WINNERS,
  partners: defaultData.PARTNERS,
  accreditedSchools: defaultData.ACCREDITED_SCHOOLS,
  team: defaultData.TEAM,
  news: defaultData.NEWS,
  gallery: defaultData.GALLERY,
  vision: defaultData.VISION,
  mission: defaultData.MISSION,
  goal: defaultData.GOAL,
  values: defaultData.VALUES,
  whyPrime: defaultData.WHY_PRIME,
  approach: defaultData.APPROACH,
};

interface ContentContextType {
  content: SiteContent;
  refreshContent: () => Promise<void>;
  updateContent: (newContent: Partial<SiteContent>) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  isLoaded: boolean;
}

const ContentContext = createContext<ContentContextType>({
  content: defaultContent,
  refreshContent: async () => {},
  updateContent: async () => false,
  resetToDefaults: async () => false,
  isLoaded: false,
});

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchContent = async () => {
    try {
      const res = await fetch("/api/content", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setContent((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn("Could not load dynamic content, using fallback:", err);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const updateContent = async (newContent: Partial<SiteContent>): Promise<boolean> => {
    try {
      const merged = { ...content, ...newContent };
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: merged }),
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update content:", err);
      return false;
    }
  };

  const resetToDefaults = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <ContentContext.Provider
      value={{
        content,
        refreshContent: fetchContent,
        updateContent,
        resetToDefaults,
        isLoaded,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  return useContext(ContentContext);
}
