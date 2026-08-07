"use client";

import Reveal from "@/components/Reveal";
import LineMask from "@/components/motion/LineMask";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { ParallaxImage } from "@/components/Parallax";
import { DIA_REVEAL_COLORS } from "@/lib/motion";

/**
 * Cinematic media-led page hero: full-bleed parallax render, dark scrim,
 * eyebrow + display title + lede overlaid at the bottom. Sets a dark nav tone.
 * Reduced-motion safe (ParallaxImage + Reveal both gate themselves).
 */
export default function PageHero({
  eyebrow,
  title,
  lede,
  image,
  imageAlt = "",
  titleReveal = "mask",
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  image: string;
  imageAlt?: string;
  /** "dia" swaps the mask rise-in for a gold-shimmer sweep (Services, Contact). */
  titleReveal?: "mask" | "dia";
}) {
  return (
    <header data-nav-tone="dark" className="relative flex min-h-[70vh] items-end overflow-hidden">
      <div className="absolute inset-0">
        <ParallaxImage src={image} alt={imageAlt} sizes="100vw" priority range={8} className="h-full w-full" />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(11,11,12,0.86), rgba(11,11,12,0.2) 55%, rgba(11,11,12,0.5))" }}
        aria-hidden="true"
      />
      <div className="shell relative w-full pb-14 pt-40 md:pb-20" style={{ color: "var(--on-media)" }}>
        <Reveal>
          <span className="eyebrow" style={{ color: "var(--gold-media)" }}>{eyebrow}</span>
        </Reveal>
        {titleReveal === "dia" ? (
          <h1 className="display-l mt-5 max-w-[18ch]">
            <DiaTextReveal text={title} colors={DIA_REVEAL_COLORS} textColor="var(--on-media)" delay={0.08} />
          </h1>
        ) : (
          <LineMask text={title} tag="h1" className="display-l mt-5 max-w-[18ch]" delay={0.08} />
        )}
        {lede && (
          <Reveal delay={130}>
            <p className="lede mt-6 max-w-[54ch]" style={{ color: "var(--on-media-dim)" }}>{lede}</p>
          </Reveal>
        )}
      </div>
    </header>
  );
}
