"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/useReducedMotion";

const slides = [
  "/media/renders/hero.jpg",
  "/media/renders/meridian-sports.jpg",
  "/media/renders/harbour-masterplan.jpg",
];

export default function Hero() {
  const [active, setActive] = useState(0);
  const next = () => setActive((a) => (a + 1) % slides.length);
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !bgRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const tween = gsap.fromTo(
      bgRef.current,
      { yPercent: -6, scale: 1.2 },
      {
        yPercent: 6,
        scale: 1.2,
        ease: "none",
        scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: true },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <section ref={sectionRef} data-nav-tone="dark" className="relative h-[100dvh] w-full overflow-hidden">
      <div ref={bgRef} className="absolute inset-0">
        {slides.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ opacity: i === active ? 1 : 0 }}
          >
            <Image src={src} alt="" fill priority={i === 0} sizes="100vw" className="object-cover" />
          </div>
        ))}
      </div>

      {/* scrims */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(17,19,21,0.55), rgba(17,19,21,0.15) 30%, rgba(17,19,21,0.25) 60%, rgba(17,19,21,0.85))",
        }}
      />

      {/* headline lockup */}
      <div className="absolute inset-0 flex items-center">
        <div className="shell w-full" style={{ color: "var(--on-media)" }}>
          <div className="flex flex-wrap items-start gap-x-6">
            <span
              className="grad-text-media font-extrabold leading-[0.82] tracking-[-0.045em]"
              style={{ fontSize: "clamp(4rem, 13vw, 12rem)" }}
            >
              Studio
            </span>
            <span
              className="font-light leading-[0.95] tracking-[-0.02em]"
              style={{ fontSize: "clamp(2rem, 5.5vw, 4.75rem)", paddingTop: "0.2em" }}
            >
              of architecture
              <br />
              &amp; design
            </span>
          </div>
          <p className="lede mt-8 max-w-[52ch]" style={{ color: "var(--on-media-dim)" }}>
            Studiodota is an architecture and design practice. We shape
            buildings and spaces that are precise, human, and built to endure —
            guiding every project from first sketch to completion.
          </p>
          <Link
            href="/projects"
            className="mt-9 inline-flex items-center gap-3 rounded-full bg-[var(--gold)] px-8 py-4 text-[0.78rem] font-extrabold uppercase tracking-[0.16em] text-[var(--ink)] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-[1.03] hover:bg-[var(--gold-hi)]"
          >
            Show Portfolio
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* scroll cue */}
      <div
        className="pointer-events-none absolute bottom-28 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 sm:flex"
        style={{ color: "var(--on-media-dim)" }}
      >
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em]">Scroll</span>
        <span className="scroll-cue" aria-hidden="true" />
      </div>

      {/* slider controls */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="shell flex items-center justify-between py-6" style={{ color: "var(--on-media-dim)" }}>
          <div className="hidden sm:block" />
          <div className="flex w-full items-center justify-between sm:w-auto sm:gap-16">
            <div className="font-mono text-sm">
              <span style={{ color: "var(--on-media)" }}>{active + 1}</span>
              <span className="mx-2 opacity-40">|</span>
              <span>{slides.length}</span>
            </div>
            <div className="flex items-center gap-3">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="grid place-items-center"
                >
                  <span
                    className="block h-2.5 w-2.5 rounded-full border transition-colors duration-300"
                    style={{
                      borderColor: i === active ? "var(--gold)" : "var(--muted)",
                      background: i === active ? "var(--gold)" : "transparent",
                    }}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={next}
              className="group flex items-center gap-3 text-sm uppercase tracking-[0.12em] text-[var(--bone)]"
            >
              Next slide
              <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
