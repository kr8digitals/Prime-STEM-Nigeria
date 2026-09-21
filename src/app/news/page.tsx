import type { Metadata } from "next";
import { IMAGES } from "@/data/content";
import NewsView from "@/components/news-view";
import { FinalCTA, PageHero, UpcomingSection } from "@/components/sections";
import { Container, GradientText } from "@/components/ui";

export const metadata: Metadata = {
  title: "News",
  description:
    "STEM news, stories and opportunities from Prime STEM Nigeria — programme announcements, student stories, school stories and STEM education insights.",
};

export default function NewsPage() {
  return (
    <>
      <PageHero
        eyebrow="News & Stories"
        title={
          <>
            STEM News, Stories & <GradientText>Opportunities</GradientText>
          </>
        }
        description="Stay up to date with Prime STEM Nigeria — programme announcements, student and school stories, teacher training updates and opportunities for young innovators."
        image={IMAGES.scienceClass}
      />
      <section className="bg-slate-50 py-20 sm:py-28">
        <Container>
          <NewsView />
        </Container>
      </section>
      <UpcomingSection />
      <FinalCTA />
    </>
  );
}