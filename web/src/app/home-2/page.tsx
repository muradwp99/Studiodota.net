import type { Metadata } from "next";
import VideoHero from "@/components/hero/VideoHero";
import HomeSections from "@/components/HomeSections";

export const metadata: Metadata = {
  title: "Showreel",
  robots: { index: false, follow: true },
  alternates: { canonical: "/" },
};

export default function HomeTwo() {
  return (
    <>
      <VideoHero />
      <HomeSections />
    </>
  );
}
