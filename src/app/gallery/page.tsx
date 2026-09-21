import type { Metadata } from "next";
import { IMAGES } from "@/data/content";
import GalleryView from "@/components/gallery-view";
import { FinalCTA, PageHero } from "@/components/sections";
import { Container, GradientText } from "@/components/ui";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Explore Prime STEM Nigeria in action — programmes, competitions, training, workshops, students, schools, STEM projects and events.",
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title={
          <>
            STEM <GradientText>in Action</GradientText>
          </>
        }
        description="A visual journey through Prime STEM Nigeria programmes, competitions, training, workshops and the young people making science, technology, engineering and mathematics exciting."
        image={IMAGES.robotics}
      />
      <section className="bg-slate-50 py-20 sm:py-28">
        <Container>
          <GalleryView />
        </Container>
      </section>
      <FinalCTA />
    </>
  );
}