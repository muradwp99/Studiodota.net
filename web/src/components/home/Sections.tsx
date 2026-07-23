"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "@/components/Reveal";
import SplitReveal from "@/components/SplitReveal";
import ProjectIndex from "@/components/home/ProjectIndex";
import ImageMaskText from "@/components/ImageMaskText";
import VideoPlayer from "@/components/VideoPlayer";
import { ParallaxImage, ParallaxX } from "@/components/Parallax";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { submitContact } from "@/lib/actions/contact";
import type { BlockData } from "@/content/defaults";

/* Three.js ambient lattice — client-only, loaded lazily so three never blocks LCP. */
const GeometryField = dynamic(() => import("@/components/GeometryField"), { ssr: false });

/* All homepage content arrives as props (CMS blocks) — see app/(site)/page.tsx. */
export type HomeData = {
  about: BlockData["home.about"];
  services: BlockData["home.services"];
  whyChoose: BlockData["home.whyChoose"];
  featured: BlockData["home.featured"];
  showreel: BlockData["home.showreel"];
  process: BlockData["home.process"];
  timeline: BlockData["home.timeline"];
  testimonials: BlockData["home.testimonials"];
  clients: BlockData["home.clients"];
  statement: BlockData["home.statement"];
  faq: BlockData["home.faq"];
  journals: BlockData["home.journals"];
  cta: BlockData["home.cta"];
};
export type JournalCard = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  authorName: string;
  authorRole: string;
};

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const fmtDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const initials = (name: string) => name.split(" ").map((w) => w[0]).join("");

function CTA({ href, label, variant = "primary", center }: { href: string; label: string; variant?: "primary" | "ghost"; center?: boolean }) {
  return (
    <div className={center ? "mt-12 flex justify-center" : "mt-12"}>
      <Link href={href} className={`btn ${variant === "primary" ? "btn-primary" : "btn-ghost"}`}>
        {label}<span className="btn-icon" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

/* ---------------- CountUp ---------------- */
function CountUp({ end, prefix = "", suffix = "", duration = 1600 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / duration);
          setVal(end * easeOut(p));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [end, duration]);
  const display = end % 1 === 0 ? Math.round(val) : val.toFixed(1);
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

/* ---------------- About ---------------- */
function About({ d }: { d: HomeData["about"] }) {
  return (
    <section className="section pattern-dots" id="about">
      <div className="shell">
        {/* Manifesto: the statement IS the section — LARGO-scale type, full width. */}
        <Reveal><span className="font-mono text-xs tracking-[0.2em] text-[var(--muted)]">{d.kicker}</span></Reveal>
        <SplitReveal text={d.title} tag="h2" className="display-2xl mt-10" />
        <div className="mt-14 grid gap-x-16 gap-y-8 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal><CTA href="/about" label={d.ctaLabel} variant="ghost" /></Reveal>
          <Reveal delay={120}>
            <div className="max-w-[64ch] space-y-6 text-[var(--bone-dim)]">
              <p>{d.paragraph1}</p>
              <p>{d.paragraph2}</p>
            </div>
          </Reveal>
        </div>
        <div className="mt-20 grid gap-10 border-t border-[var(--line)] pt-14 sm:grid-cols-2 lg:grid-cols-4">
          {d.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 70}>
              <div>
                <div className="display-m grad-text font-semibold"><CountUp end={s.end} suffix={s.suffix} /></div>
                <div className="mt-4 font-semibold">{s.label}</div>
                <p className="mt-2 text-sm text-[var(--muted)]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Services (What we do — full-bleed slider) ---------------- */
function ServicesSlider({ d }: { d: HomeData["services"] }) {
  return (
    <section id="services" aria-label="Our services" className="section overflow-hidden grad-warm">
      <div className="shell">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[var(--gold-ink)]" aria-hidden="true">✦</span>
                <span className="text-sm font-bold uppercase tracking-[0.2em]">{d.kicker}</span>
              </div>
              <h2 className="display-l mt-4">{d.title}</h2>
            </div>
            <Link href="/services" className="link-underline hidden text-sm font-semibold text-[var(--gold-ink)] sm:inline-block">
              All services →
            </Link>
          </div>
        </Reveal>
      </div>

      {/* The service names are the primary read — giant list rows, LARGO-style. */}
      <div className="shell mt-12">
        {d.items.map((s, i) => (
          <Link
            key={s.title}
            href="/services"
            className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 border-t border-[var(--line-strong)] py-6 md:py-8"
          >
            <span className="font-mono text-xs tracking-[0.2em] text-[var(--muted)]">{String(i + 1).padStart(2, "0")}</span>
            <span className="display-index block transition-[transform,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3 group-hover:text-[var(--gold-ink)]">
              <SplitReveal text={s.title} tag="span" className="block" />
            </span>
          </Link>
        ))}
        <div className="border-t border-[var(--line-strong)]" />
      </div>

      {/* The detail carousel — big cards drift left as the section scrolls through. */}
      <div data-nav-tone="dark" className="mt-14">
        <ParallaxX direction="left" className="px-[var(--edge)]" trackClassName="gap-5">
          {d.items.map((s, i) => (
            <article
              key={s.title}
              aria-label={s.title}
              className="relative shrink-0 overflow-hidden rounded-3xl"
              style={{ width: "min(84vw, 1180px)", height: "clamp(440px, 70vh, 760px)" }}
            >
              <Image src={s.image} alt={s.title} fill sizes="84vw" className="object-cover" />
              <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,11,12,0.9), rgba(11,11,12,0.12) 55%, rgba(11,11,12,0.28))" }} />
              <div className="absolute inset-0 flex items-end p-6 md:p-12" style={{ color: "var(--on-media)" }}>
                <div className="max-w-[52ch]">
                  <span className="font-mono text-xs uppercase tracking-[0.28em]" style={{ color: "var(--gold-media)" }}>
                    Service {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-extrabold leading-[0.95] tracking-[-0.03em]" style={{ fontSize: "clamp(2.2rem, 4.8vw, 4.25rem)" }}>
                    {s.title}
                  </h3>
                  <p className="mt-4 hidden max-w-[46ch] sm:block" style={{ color: "var(--on-media-dim)" }}>{s.sub}</p>
                  <div className="mt-5 hidden flex-wrap gap-2.5 sm:flex">
                    {s.tags.map((t) => (
                      <span key={t} className="rounded-full border border-[rgba(246,245,242,0.28)] px-3.5 py-1.5 text-[0.7rem] uppercase tracking-[0.08em]" style={{ color: "var(--on-media-dim)" }}>{t}</span>
                    ))}
                  </div>
                  <Link href="/services" className="mt-7 inline-flex w-max items-center gap-3 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.1em] transition-transform duration-300 hover:scale-[1.03]" style={{ background: "#f7f6f3", color: "#17191c" }}>
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </ParallaxX>
      </div>
    </section>
  );
}

/* ---------------- Why choose us ---------------- */
function WhyChoose({ d }: { d: HomeData["whyChoose"] }) {
  return (
    <section className="section pattern-dots">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
              <span className="uppercase tracking-[0.16em] text-[var(--bone-dim)]">{d.label}</span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div>
              <h2 className="display-l max-w-[18ch]">{d.title}</h2>
              <p className="mt-5 max-w-[46ch] text-[var(--bone-dim)]">{d.body}</p>
              <div className="mt-7"><Link href="/projects" className="btn btn-primary">{d.ctaLabel}<span className="btn-icon" aria-hidden="true">→</span></Link></div>
            </div>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          <Reveal><StatImageCard img={d.cardLeft.image} prefix={d.cardLeft.prefix} end={d.cardLeft.end} suffix={d.cardLeft.suffix} label={d.cardLeft.label} /></Reveal>
          <Reveal delay={80}>
            <div className="grid h-full gap-5">
              <StatDarkCard end={d.cardMidTop.end} suffix={d.cardMidTop.suffix} label={d.cardMidTop.label} />
              <StatDarkCard end={d.cardMidBottom.end} suffix={d.cardMidBottom.suffix} label={d.cardMidBottom.label} />
            </div>
          </Reveal>
          <Reveal delay={140}><StatImageCard img={d.cardRight.image} end={d.cardRight.end} suffix={d.cardRight.suffix} label={d.cardRight.label} rating /></Reveal>
        </div>
      </div>
    </section>
  );
}
function StatImageCard({ img, prefix, end, suffix, label, rating }: { img: string; prefix?: string; end: number; suffix: string; label: string; rating?: boolean }) {
  return (
    <div className="group relative min-h-[420px] overflow-hidden rounded-2xl" style={{ color: "var(--on-media)" }}>
      <Image src={img} alt="" fill sizes="(max-width:1024px) 100vw, 33vw" className="img-zoom object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,19,21,0.92), transparent 55%)" }} />
      {rating && (<div className="absolute right-5 top-5 text-right text-sm">4.9 / 5<div className="text-[var(--gold-hi)]">★★★★★</div></div>)}
      <div className="absolute inset-x-0 bottom-0 p-7">
        <div className="text-4xl font-extrabold"><CountUp end={end} prefix={prefix} suffix={suffix} /></div>
        <p className="mt-2 max-w-[30ch] text-sm" style={{ color: "var(--on-media-dim)" }}>{label}</p>
      </div>
    </div>
  );
}
function StatDarkCard({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  return (
    <div className="hover-lift flex min-h-[200px] flex-col justify-end rounded-2xl bg-[#1b1d20] p-7" style={{ color: "var(--on-media)" }}>
      <div className="text-4xl font-extrabold"><CountUp end={end} suffix={suffix} /></div>
      <p className="mt-2 max-w-[34ch] text-sm" style={{ color: "var(--on-media-dim)" }}>{label}</p>
    </div>
  );
}

/* ---------------- Featured: Inside, Outside (typographic project index) ---------------- */
function Featured({ d }: { d: HomeData["featured"] }) {
  return (
    <section data-nav-tone="dark" className="relative overflow-hidden rounded-t-[2.5rem] bg-[#111315] py-[clamp(5rem,11vw,9rem)]" style={{ color: "var(--on-media)" }}>
      {/* Ambient architectural lattice behind the type — the section's only "image" at rest. */}
      <GeometryField className="absolute inset-0 z-0" opacity={0.15} />
      <div className="shell relative z-10">
        <Reveal><span className="font-mono text-xs tracking-[0.2em]" style={{ color: "var(--on-media-dim)" }}>{d.kicker}</span></Reveal>
        <SplitReveal text={`${d.title} ${d.titleMuted}`} tag="h2" className="display-2xl mt-8" />
      </div>
      {/* Projects as their names — photography appears on hover, not at rest. */}
      <div className="shell relative z-10 mt-14">
        <ProjectIndex items={d.items} linkLabel={d.linkLabel} />
      </div>
    </section>
  );
}

/* ---------------- Kinetic word band ---------------- */
function KineticBand() {
  const words = ["LIVING", "PLAYING", "WORKING"];
  const row = [...words, ...words, ...words];
  return (
    <section aria-hidden="true" data-nav-tone="dark" className="overflow-hidden bg-[#111315] pb-[clamp(3rem,7vw,6rem)]">
      <div className="marquee-wrap" style={{ "--marquee-dur": "70s" } as React.CSSProperties}>
        <div className="marquee-track">
          {[...row, ...row].map((w, i) => (
            <span
              key={i}
              className="display-index mx-5 shrink-0 whitespace-nowrap"
              style={{ color: i % 3 === 1 ? "var(--gold-media)" : "rgba(246,245,242,0.22)" }}
            >
              {w} <span className="mx-4">—</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Showreel ---------------- */
function Showreel({ d }: { d: HomeData["showreel"] }) {
  const reel = d.items;
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const onScroll = () => {
      if (playing) return;
      const el = wrap.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), Math.max(1, total));
      const p = total > 0 ? scrolled / total : 0;
      setActive(Math.min(reel.length - 1, Math.floor(p * reel.length * 0.999)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [playing, reduced, reel.length]);
  const current = reel[Math.min(active, reel.length - 1)];
  if (reel.length === 0) return null;
  return (
    <section ref={wrap} className="relative bg-[var(--ink)]" style={{ height: `${reel.length * 40}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="shell relative z-10 w-full">
          <div className="flex items-end justify-between">
            <span className="eyebrow">{d.label}</span>
            <Link href="/projects" className="link-underline hidden text-sm font-semibold text-[var(--gold-ink)] sm:inline-block">{d.linkLabel}</Link>
          </div>
          <div className="relative mt-8">
            <div className="flex h-[64vh] min-h-[380px] items-stretch gap-3">
            {reel.map((r, i) => {
              const isActive = i === active;
              return (
                <div key={r.image + i}
                  className={`group relative overflow-hidden rounded-2xl ${reduced ? "" : "transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"}`}
                  style={{ flex: isActive ? "1 1 58%" : "1 1 11%", opacity: isActive ? 1 : 0.55, filter: isActive ? "none" : "grayscale(0.9)" }}>
                  {isActive && r.youtubeId && !playing ? (
                    <div className="absolute inset-0">
                      <VideoPlayer youtubeId={r.youtubeId} poster={r.image} title={r.title} mode="ambient" rounded="" className="h-full w-full" />
                    </div>
                  ) : (
                    <Image src={r.image} alt={r.title} fill sizes="60vw" className={`object-cover ${reduced ? "" : "transition-transform duration-[1200ms] group-hover:scale-105"}`} />
                  )}
                  {!isActive && (
                    <button onClick={() => setActive(i)} aria-label={`View ${r.title}`} className="absolute inset-0 z-10" />
                  )}
                  {isActive && (
                    <>
                      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,19,21,0.8), transparent 55%)" }} />
                      <button onClick={() => setPlaying(true)} aria-label={`Play ${r.title} showreel`} className={`absolute left-1/2 top-1/2 z-10 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[rgba(255,255,255,0.16)] text-xl backdrop-blur hover:scale-110 ${reduced ? "" : "transition-transform duration-500"}`} style={{ color: "var(--on-media)" }}>▶</button>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6" style={{ color: "var(--on-media)" }}>
                        <div className="font-mono text-sm tracking-[0.25em]">{r.title.toUpperCase()}</div>
                        <div className="mt-1 font-mono text-xs tracking-[0.25em]" style={{ color: "var(--on-media-dim)" }}>{r.kicker.toUpperCase()} — 2026</div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <AnimatePresence>
            {playing && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: reduced ? 0 : 0.4 }} className="absolute inset-0 z-20 overflow-hidden rounded-2xl bg-black">
                <VideoPlayer youtubeId={current.youtubeId} poster={current.image} className="h-full w-full" rounded="" title={current.title} mode="cinema" />
                <button onClick={() => setPlaying(false)} aria-label="Close" className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full bg-[rgba(255,255,255,0.16)] text-lg backdrop-blur transition-transform duration-300 hover:scale-110" style={{ color: "var(--on-media)" }}>✕</button>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Our process ---------------- */
function Process({ d }: { d: HomeData["process"] }) {
  const [active, setActive] = useState(0);
  const steps = d.steps;
  const step = steps[Math.min(active, steps.length - 1)];
  if (!step) return null;
  return (
    <section className="section bg-[var(--ink-2)]">
      <div className="shell grid gap-12 lg:grid-cols-2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl lg:sticky lg:top-28">
          {steps.map((s, i) => (
            <Image key={s.image + i} src={s.image} alt={s.title} fill sizes="(max-width:1024px) 100vw, 45vw" className="object-cover transition-opacity duration-700" style={{ opacity: i === active ? 1 : 0 }} />
          ))}
          <div className="absolute inset-x-0 bottom-0 p-7" style={{ background: "rgba(17,19,21,0.5)", color: "var(--on-media)" }}>
            <div className="font-mono text-sm text-[var(--gold-hi)]">{step.n}</div>
            <h4 className="mt-1 text-xl font-semibold">{step.title}</h4>
            <p className="mt-2 max-w-[46ch] text-sm" style={{ color: "var(--on-media-dim)" }}>{step.body}</p>
          </div>
        </div>
        <div>
          <Reveal><span className="eyebrow">{d.label}</span></Reveal>
          <Reveal delay={70}><p className="mt-5 text-[var(--bone-dim)]">{d.intro}</p></Reveal>
          <div className="mt-8 border-t border-[var(--line)]">
            {steps.map((s, i) => (
              <button key={s.n + i} onClick={() => setActive(i)} className="flex w-full items-center gap-6 border-b border-[var(--line)] py-5 text-left transition-colors duration-300">
                <span className={`font-mono text-sm ${i === active ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>{s.n}</span>
                <span className={`flex-1 uppercase tracking-[0.06em] transition-colors duration-300 ${i === active ? "text-[var(--bone)]" : "text-[var(--bone-dim)]"}`}>{s.title}</span>
                <span className="text-lg text-[var(--gold-ink)] transition-all duration-300" style={{ opacity: i === active ? 1 : 0, transform: i === active ? "translateX(0)" : "translateX(-8px)" }} aria-hidden="true">→</span>
              </button>
            ))}
          </div>
          <CTA href="/contact" label={d.ctaLabel} variant="ghost" />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Timeline (scroll-driven) ---------------- */
function Timeline({ d }: { d: HomeData["timeline"] }) {
  const timeline = d.items;
  const wrap = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), Math.max(1, total));
      const p = total > 0 ? scrolled / total : 0;
      setIdx(Math.min(timeline.length - 1, Math.floor(p * timeline.length * 0.999)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduced, timeline.length]);
  const cur = timeline[Math.min(idx, timeline.length - 1)];
  if (!cur) return null;
  const fill = timeline.length > 1 ? (idx / (timeline.length - 1)) * 100 : 100;

  if (reduced) {
    return (
      <section className="section">
        <div className="shell">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-extrabold uppercase tracking-[0.06em] md:text-4xl">{d.title}</h2>
            <span className="hidden h-px flex-1 bg-[var(--line)] sm:block" />
          </div>
          <div className="mt-12 space-y-12 border-t border-[var(--line)] pt-12">
            {timeline.map((t) => (
              <div key={t.year} className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
                <div>
                  <div className="font-mono text-sm text-[var(--gold-ink)]">{t.year}</div>
                  <div className="display-m mt-3">{t.pre} <span className="text-[var(--gold-ink)]">{t.accent}</span> {t.post}</div>
                  <p className="mt-3 text-[var(--bone-dim)]">Delivered {t.year} — one of the projects that shaped our practice.</p>
                </div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                  <Image src={t.image} alt={t.post} fill sizes="(max-width:768px) 100vw, 45vw" className="object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={wrap} className="relative" style={{ height: `${timeline.length * 42}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="shell w-full">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-extrabold uppercase tracking-[0.06em] md:text-4xl">{d.title}</h2>
            <span className="hidden h-px flex-1 bg-[var(--line)] sm:block" />
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-[120px_1fr]">
            <div className="relative hidden lg:block">
              <span className="absolute left-[7px] top-3 bottom-3 w-[2px] rounded-full bg-[var(--line-strong)]" />
              <span className="absolute left-[7px] top-3 w-[2px] rounded-full transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ height: `${fill}%`, background: "linear-gradient(180deg,#d0aa72,#8f6c39)" }} />
              <ul className="space-y-9">
                {timeline.map((t, i) => {
                  const done = i <= idx;
                  const on = i === idx;
                  return (
                    <li key={t.year + i} className="flex items-center gap-5">
                      <span
                        className="h-4 w-4 rounded-full border transition-all duration-500"
                        style={{
                          borderColor: done ? "var(--gold)" : "var(--line-strong)",
                          background: done ? "var(--gold)" : "var(--ink)",
                          boxShadow: on ? "0 0 0 5px rgba(176,137,78,0.22)" : "none",
                          transform: on ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                      <span className={`font-mono text-sm transition-colors duration-500 ${on ? "font-bold text-[var(--bone)]" : "text-[var(--muted)]"}`}>{t.year}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
              <div>
                <motion.div key={cur.n} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <div className="text-6xl font-extrabold text-[var(--surface-2)]">{cur.n}</div>
                  <div className="display-m mt-4">{cur.pre} <span className="text-[var(--gold)]">{cur.accent}</span> {cur.post}</div>
                  <p className="mt-4 text-[var(--bone-dim)]">Delivered {cur.year} — one of the projects that shaped our practice.</p>
                  <Link href="/projects" className="btn btn-ghost mt-7">View full portfolio<span className="btn-icon" aria-hidden="true">→</span></Link>
                </motion.div>
              </div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                {timeline.map((t, i) => (
                  <Image key={t.image + i} src={t.image} alt={t.post} fill sizes="(max-width:768px) 100vw, 45vw" className="object-cover transition-opacity duration-700" style={{ opacity: i === idx ? 1 : 0 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */
function Testimonials({ d }: { d: HomeData["testimonials"] }) {
  return (
    <section className="section grad-mesh">
      <div className="shell relative">
        <div className="absolute left-0 top-0 hidden h-full lg:block" style={{ writingMode: "vertical-rl" }}>
          <span className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">06 / Testimonials</span>
        </div>
        <div className="grid gap-14 lg:grid-cols-2 lg:pl-16">
          <div>
            <Reveal><span className="eyebrow">{d.label}</span></Reveal>
            <Reveal delay={70}><h2 className="display-l mt-5 max-w-[13ch]">{d.title}</h2></Reveal>
            <Reveal delay={130}>
              <figure className="mt-14">
                <span className="text-5xl leading-none text-[var(--gold)]">&ldquo;</span>
                <blockquote className="mt-3 max-w-[40ch] text-xl text-[var(--bone)]">{d.featured.quote}</blockquote>
                <figcaption className="mt-6"><span className="font-semibold">{d.featured.name}</span><div className="text-sm text-[var(--muted)]">{d.featured.role}</div></figcaption>
              </figure>
            </Reveal>
            <Reveal delay={180}><CTA href="/contact" label={d.ctaLabel} variant="ghost" /></Reveal>
          </div>
          <div className="flex flex-col justify-center divide-y divide-[var(--line)] lg:border-l lg:border-[var(--line)] lg:pl-12">
            {d.quotes.map((t, i) => (
              <Reveal key={t.name + i} delay={i * 90}>
                <div className="flex items-start gap-6 py-8 first:pt-0">
                  <div className="flex-1">
                    <blockquote className="text-lg text-[var(--bone)]">&ldquo;{t.quote}&rdquo;</blockquote>
                    <div className="mt-4"><span className="font-semibold">{t.name}</span><div className="text-sm text-[var(--muted)]">{t.role}</div></div>
                  </div>
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-[var(--surface-2)] font-bold text-[var(--gold)]">{initials(t.name)}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Clients (dual marquee) ---------------- */
function MarqueeRow({ items, rev }: { items: string[]; rev?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-wrap">
      <div className={`marquee-track ${rev ? "rev" : ""}`}>
        {doubled.map((c, i) => (
          <span key={i} className="mx-10 shrink-0 whitespace-nowrap text-2xl font-bold text-[var(--bone-dim)] opacity-90 transition-opacity duration-300 hover:opacity-100">{c}</span>
        ))}
      </div>
    </div>
  );
}
function Clients({ d }: { d: HomeData["clients"] }) {
  return (
    <section className="section grad-soft">
      <div className="text-center"><Reveal><span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{d.label}</span></Reveal></div>
      <div className="mt-14 flex flex-col gap-8">
        <MarqueeRow items={d.rowA} />
        <MarqueeRow items={d.rowB} rev />
      </div>
    </section>
  );
}

/* ---------------- Statement band (image-masked wordmark) ---------------- */
function StatementBand({ d }: { d: HomeData["statement"] }) {
  return (
    <section data-nav-tone="dark" className="relative overflow-hidden rounded-t-[2.5rem] bg-[#111315] py-[clamp(5rem,15vw,11rem)]" style={{ color: "var(--on-media)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(rgba(246,245,242,0.6) 1px, transparent 1px)", backgroundSize: "26px 26px" }} aria-hidden="true" />
      <div className="shell relative text-center">
        <span className="eyebrow" style={{ color: "var(--gold-media)" }}>{d.label}</span>
        <h2 className="mt-6 font-extrabold leading-[0.84] tracking-[-0.04em]" style={{ fontSize: "clamp(3.2rem, 15vw, 13rem)" }}>
          <ImageMaskText text={d.word} image={d.image} />
        </h2>
        <p className="mx-auto mt-8 max-w-[52ch]" style={{ color: "var(--on-media-dim)" }}>
          {d.body}
        </p>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ({ d }: { d: HomeData["faq"] }) {
  const [open, setOpen] = useState(0);
  return (
    <section className="section bg-[var(--ink-2)]">
      <div className="shell grid gap-12 lg:grid-cols-[0.9fr_1.3fr]">
        <div>
          <Reveal><div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" /><span className="uppercase tracking-[0.16em] text-[var(--bone-dim)]">{d.label}</span></div></Reveal>
          <Reveal delay={70}><h2 className="display-l mt-5">{d.title}</h2></Reveal>
          <Reveal delay={130}>
            <div className="hover-lift mt-8 card p-8">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--gold)] font-bold text-[#17191c]">{d.cardInitials}</span>
              <h3 className="display-m mt-6">{d.cardTitle}</h3>
              <p className="mt-3 text-sm text-[var(--muted)]">{d.cardBody}</p>
              <Link href="/contact" className="btn btn-primary mt-6 w-full justify-center">{d.cardCta}</Link>
            </div>
          </Reveal>
        </div>
        <div className="space-y-4">
          {d.items.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q + i} delay={(i % 5) * 50}>
                <div className="card p-6 transition-colors duration-300 hover:border-[var(--line-strong)]">
                  <button onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full items-center justify-between gap-6 text-left">
                    <span className="text-lg font-medium">{f.q}</span>
                    <span className="text-xl text-[var(--gold)] transition-transform duration-500" style={{ transform: isOpen ? "rotate(45deg)" : "none" }}>+</span>
                  </button>
                  <div className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden"><p className="pt-4 text-sm text-[var(--muted)]">{f.a}</p></div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Journals (driven by CMS posts) ---------------- */
function Journals({ d, posts }: { d: HomeData["journals"]; posts: JournalCard[] }) {
  if (posts.length === 0) return null;
  const [featured, ...rest] = posts;
  return (
    <section className="section">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal><h2 className="display-l max-w-[16ch]">{d.title}</h2></Reveal>
          <Reveal delay={80}><Link href="/journal" className="group inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 font-semibold" style={{ background: "linear-gradient(120deg,#d0aa72,#a87f3f 55%,#8f6c39)", color: "#17191c" }}>{d.viewAllLabel} <span className="grid h-9 w-9 place-items-center rounded-full bg-[#17191c] text-[#f5f5f3] transition-transform duration-500 group-hover:translate-x-0.5">↗</span></Link></Reveal>
        </div>
        <Reveal className="mt-12">
          <Link href={`/journal/${featured.slug}`} className="group grid overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] md:grid-cols-2">
            <div className="relative aspect-[16/11] w-full overflow-hidden"><Image src={featured.image} alt="" fill sizes="(max-width:768px) 100vw, 50vw" className="img-zoom object-cover" /></div>
            <div className="flex flex-col justify-center p-8 md:p-12">
              <span className="w-max rounded-full bg-[var(--bone)] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink)]">Must read</span>
              <h3 className="display-m mt-6">{featured.title}</h3>
              <p className="mt-4 max-w-[46ch] text-[var(--bone-dim)]">{featured.excerpt}</p>
              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--gold)] text-sm font-bold text-[#17191c]">{initials(featured.authorName)}</span><div><div className="font-semibold">{featured.authorName}</div><div className="text-xs text-[var(--muted)]">{featured.authorRole}</div></div></div>
                <span className="rounded-full bg-[var(--gold)] px-4 py-1.5 text-xs font-semibold text-[#17191c]">{featured.category}</span>
              </div>
            </div>
          </Link>
        </Reveal>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {rest.slice(0, 3).map((j, i) => (
            <Reveal key={j.slug} delay={(i % 3) * 70}>
              <Link href={`/journal/${j.slug}`} className="group block">
                <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl"><Image src={j.image} alt="" fill sizes="(max-width:768px) 100vw, 33vw" className="img-zoom object-cover" /></div>
                <div className="mt-5">
                  <span className="link-underline text-xs uppercase tracking-[0.12em] text-[var(--gold-ink)]">{j.category}</span>
                  <h4 className="mt-3 text-lg font-medium leading-snug transition-colors duration-300 group-hover:text-[var(--gold)]">{j.title}</h4>
                  <div className="mt-3 text-sm text-[var(--muted)]">{fmtDate(j.date)}</div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Get in touch (immersive full-bleed) ---------------- */
const ctaLabelCls = "font-mono text-[0.62rem] uppercase tracking-[0.22em]";
const ctaFieldCls =
  "mt-1.5 w-full border-b border-[rgba(246,245,242,0.28)] bg-transparent py-2.5 outline-none transition-colors duration-300 placeholder:text-[rgba(246,245,242,0.35)] focus:border-[var(--gold-media)]";

function FinalCTA({ d, contact }: { d: HomeData["cta"]; contact: { email: string; phone: string } }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError("");
    startTransition(async () => {
      const res = await submitContact({
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        message: String(fd.get("message") || ""),
        company: String(fd.get("company") || ""),
      });
      if (res.ok) setSent(true);
      else setError(res.error ?? "Something interrupted the send — please try again.");
    });
  };

  return (
    <section data-nav-tone="dark" className="relative overflow-hidden rounded-t-[2.5rem]">
      <div className="absolute inset-0">
        <ParallaxImage src={d.image} alt="" sizes="100vw" range={7} className="h-full w-full" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(112deg, rgba(9,10,12,0.93) 10%, rgba(9,10,12,0.6) 52%, rgba(9,10,12,0.84) 100%)" }} aria-hidden="true" />
      </div>
      <GeometryField className="absolute inset-0 z-[1]" opacity={0.12} />
      <div className="shell relative z-10 py-[clamp(6rem,14vw,11rem)]" style={{ color: "var(--on-media)" }}>
        <Reveal><span className="eyebrow" style={{ color: "var(--gold-media)" }}>{d.label}</span></Reveal>
        {/* The headline is the CTA — one giant interactive line. */}
        <Link href="/contact" className="group mt-6 block w-fit max-w-full">
          <SplitReveal text={d.title} tag="span" className="display-2xl block transition-colors duration-500 group-hover:text-[var(--gold-media)]" />
        </Link>
        <div className="mt-16 grid items-start gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div>
          <Reveal delay={90}>
            <p className="max-w-[44ch]" style={{ color: "var(--on-media-dim)" }}>{d.body}</p>
          </Reveal>
          <Reveal delay={160}>
            <div className="mt-10 space-y-2 text-lg">
              <a href={`mailto:${contact.email}`} className="link-underline block w-max font-semibold">{contact.email}</a>
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="link-underline block w-max" style={{ color: "var(--on-media-dim)" }}>{contact.phone}</a>
            </div>
          </Reveal>
        </div>
        <Reveal delay={150}>
          <div className="rounded-3xl border border-[rgba(246,245,242,0.16)] p-8 backdrop-blur-xl md:p-10" style={{ background: "rgba(14,16,19,0.55)" }}>
            {sent ? (
              <div className="py-10 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full text-xl" style={{ background: "var(--gold-media)", color: "#17191c" }} aria-hidden="true">✓</span>
                <h3 className="display-m mt-6">Thank you.</h3>
                <p className="mt-3" style={{ color: "var(--on-media-dim)" }}>We&rsquo;ll be in touch within one business day.</p>
              </div>
            ) : (
              <form className="space-y-7" onSubmit={onSubmit}>
                <div className="grid gap-7 sm:grid-cols-2">
                  <label className="block">
                    <span className={ctaLabelCls} style={{ color: "var(--on-media-dim)" }}>Your name</span>
                    <input required name="name" autoComplete="name" placeholder="Jane Smith" className={ctaFieldCls} />
                  </label>
                  <label className="block">
                    <span className={ctaLabelCls} style={{ color: "var(--on-media-dim)" }}>Email</span>
                    <input required name="email" type="email" autoComplete="email" placeholder="jane@studio.com" className={ctaFieldCls} />
                  </label>
                </div>
                <label className="block">
                  <span className={ctaLabelCls} style={{ color: "var(--on-media-dim)" }}>Your project</span>
                  <textarea required name="message" rows={4} minLength={10} placeholder="Site, scale, ambitions — anything helps." className={`${ctaFieldCls} resize-none`} />
                </label>
                {/* Honeypot — hidden from humans, bots fill it. */}
                <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
                {error && (
                  <p role="alert" className="text-sm" style={{ color: "var(--gold-media)" }}>{error}</p>
                )}
                <button type="submit" disabled={pending} className="btn btn-grad w-full justify-center disabled:opacity-60">
                  {pending ? "Sending…" : d.submitLabel} {!pending && <span className="btn-icon" aria-hidden="true">→</span>}
                </button>
              </form>
            )}
          </div>
        </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function Sections({ data, posts, contact }: { data: HomeData; posts: JournalCard[]; contact: { email: string; phone: string } }) {
  return (
    <>
      <About d={data.about} />
      <ServicesSlider d={data.services} />
      <WhyChoose d={data.whyChoose} />
      <Featured d={data.featured} />
      <KineticBand />
      <Showreel d={data.showreel} />
      <Process d={data.process} />
      <Timeline d={data.timeline} />
      <Testimonials d={data.testimonials} />
      <Clients d={data.clients} />
      <StatementBand d={data.statement} />
      <FAQ d={data.faq} />
      <Journals d={data.journals} posts={posts} />
      <FinalCTA d={data.cta} contact={contact} />
    </>
  );
}
