"use client";

import Reveal from "@/components/Reveal";
import LineMask from "@/components/motion/LineMask";
import { ParallaxImage } from "@/components/Parallax";

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
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  image: string;
  imageAlt?: string;
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
          <span className="eyebrow eyebrow--dim" style={{ color: "var(--gold-media)" }}>{eyebrow}</span>
        </Reveal>
        <LineMask text={title} tag="h1" className="display-l mt-5 max-w-[18ch]" delay={0.08} />
        {lede && (
          <Reveal delay={130}>
            <p className="lede mt-6 max-w-[54ch]" style={{ color: "var(--on-media-dim)" }}>{lede}</p>
          </Reveal>
        )}
      </div>
    </header>
  );
}
