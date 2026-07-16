"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const Hero3D = dynamic(() => import("./Hero3D"), { ssr: false });

const callouts = [
  { label: "Accurate geometry", top: "20%", left: "8%" },
  { label: "True materials", top: "30%", right: "9%" },
  { label: "Physical light", bottom: "34%", right: "14%" },
  { label: "Millimetre precision", bottom: "40%", left: "11%" },
];

export default function HomeHero() {
  const wrap = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const intro = useRef<HTMLDivElement>(null);
  const blueprint = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: wrap.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        progress.current = p;
        if (intro.current) {
          intro.current.style.opacity = String(1 - Math.min(1, p * 1.7));
          intro.current.style.transform = `translateY(${-p * 60}px)`;
        }
        if (blueprint.current) {
          const bp = Math.min(1, Math.max(0, (p - 0.45) / 0.35));
          blueprint.current.style.opacity = String(bp);
        }
      },
    });
    return () => st.kill();
  }, []);

  return (
    <section ref={wrap} className="relative" style={{ height: "300vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* cinematic base — always visible behind the 3D scene */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 90% at 68% 8%, #3a2a22 0%, #2a1e17 52%, #221812 100%)",
          }}
        />
        {/* 3D scene */}
        <div className="absolute inset-0" style={{ width: "100%", height: "100vh" }}>
          <Hero3D progress={progress} />
        </div>
        {/* vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 0%, transparent 45%, rgba(11,11,12,0.5) 100%), linear-gradient(to bottom, rgba(11,11,12,0.55), transparent 28%, transparent 55%, rgba(11,11,12,0.92))",
          }}
        />

        {/* Intro — bottom-left anchored (Loft) */}
        <div
          ref={intro}
          className="absolute inset-0 flex flex-col justify-end pb-24 md:pb-28"
        >
          <div className="shell">
            <span className="eyebrow mb-5 block">
              Architectural Visualisation Studio
            </span>
            <h1 className="display-xl max-w-[16ch]">
              Present the project before it&rsquo;s built.
            </h1>
            <p className="lede mt-6">
              Photorealistic 3D rendering, CGI, and immersive tours that win
              approvals and close clients — with confidence, on time.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/contact" className="btn btn-primary">
                Get a quote
                <span className="btn-icon" aria-hidden="true">
                  →
                </span>
              </Link>
              <Link href="/projects" className="btn btn-ghost">
                Explore our work
              </Link>
            </div>
          </div>
        </div>

        {/* Blueprint reveal — mono callouts (Vaulk) */}
        <div ref={blueprint} className="pointer-events-none absolute inset-0 opacity-0">
          {callouts.map((c) => (
            <div
              key={c.label}
              className="absolute flex items-center gap-2"
              style={{
                top: c.top,
                left: c.left,
                right: c.right,
                bottom: c.bottom,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--blueprint)" }}
              />
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--bone-dim)]">
                {c.label}
              </span>
            </div>
          ))}
          <div className="absolute bottom-24 left-0 right-0 md:bottom-28">
            <div className="shell">
              <span
                className="eyebrow mb-4 block"
                style={{ color: "var(--blueprint)" }}
              >
                From photoreal to precise
              </span>
              <h2 className="display-l max-w-[20ch]">
                Every surface, modelled to the millimetre.
              </h2>
            </div>
          </div>
        </div>

        {/* scroll cue (Vaulk) */}
        <div className="absolute bottom-8 right-[var(--edge)] font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[var(--muted)]">
          Scroll to explore
        </div>
      </div>
    </section>
  );
}
