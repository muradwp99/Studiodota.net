"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "@/components/Reveal";
import SplitReveal from "@/components/SplitReveal";
import LineMask from "@/components/motion/LineMask";
import { EASE_CURTAIN } from "@/lib/motion";
import ImageMaskText from "@/components/ImageMaskText";
import CountUp from "@/components/CountUp";
import VideoPlayer from "@/components/VideoPlayer";
import MediaLightbox from "@/components/MediaLightbox";
import { ParallaxImage, ParallaxX } from "@/components/Parallax";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { submitContact } from "@/lib/actions/contact";
import { HOME_SECTION_IDS } from "@/lib/homeSections";
import type { BlockData } from "@/content/defaults";

const GlossyObject = dynamic(() => import("@/components/GlossyObject"), { ssr: false });

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

/** largo-style curtain wipe over a media panel — place last inside a `relative` container. */
function CurtainOnView({ delay = 0, color = "var(--ink-2)" }: { delay?: number; color?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-0"
      style={{ background: color, transformOrigin: "right center", willChange: "transform" }}
      initial={{ scaleX: 1 }}
      whileInView={{ scaleX: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: EASE_CURTAIN, delay }}
    />
  );
}
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

/* ---------------- About ---------------- */
function About({ d }: { d: HomeData["about"] }) {
  // Statement + supporting copy up top; stats live in their own bronze-glass
  // band below, with a floating 3D gem standing in for "architecture" here
  // instead of photography (which the page already leans on elsewhere).
  return (
    <section className="section pattern-dots" id="about">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16">
          <div>
            <Reveal><span className="eyebrow">{d.kicker}</span></Reveal>
            <SplitReveal text={d.title} tag="h2" className="display-2xl mt-6 text-balance" />
          </div>
          <Reveal delay={120}>
            <div className="space-y-5 text-[var(--bone-dim)]">
              <p>{d.paragraph1}</p>
              <p>{d.paragraph2}</p>
              <CTA href="/about" label={d.ctaLabel} variant="ghost" />
            </div>
          </Reveal>
        </div>

        <Reveal delay={160}>
          <div
            className="relative mt-16 overflow-hidden rounded-[2rem] p-6 sm:p-10"
            style={{
              background:
                "radial-gradient(120% 90% at 15% 0%, rgba(255,255,255,0.35), transparent 55%), linear-gradient(135deg, #dbb977 0%, var(--gold) 45%, #6b4a24 100%)",
            }}
          >
            <div className="pointer-events-none absolute -top-14 right-4 h-[170px] w-[170px] sm:right-8 sm:h-[220px] sm:w-[220px] lg:h-[300px] lg:w-[300px]">
              <GlossyObject />
            </div>
            {/* Uneven column widths + a single gradient-accented lead number give this
                row one focal point instead of four identical boxes; grad-text is
                reserved for that lead stat so the gold gradient stays an accent,
                not a default applied uniformly to every number. */}
            <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-6">
              {d.stats.map((s, i) => {
                const lead = i === 0;
                return (
                  <Reveal key={s.label} delay={i * 70}>
                    <div className={`h-full rounded-2xl bg-[var(--surface)] p-6 shadow-[0_20px_45px_-20px_rgba(23,19,10,0.45)] lg:p-7 ${lead ? "lg:p-9" : ""}`}>
                      <div className={lead ? "display-l grad-text font-semibold" : "display-m font-semibold text-[var(--bone)]"}>
                        <CountUp end={s.end} suffix={s.suffix} />
                      </div>
                      <div className="mt-4 font-semibold">{s.label}</div>
                      <p className="mt-2 text-sm text-[var(--muted)]">{s.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </Reveal>
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
              <LineMask text={d.title} tag="h2" className="display-l mt-4" />
            </div>
            <Link href="/services" className="link-underline hidden text-sm font-semibold text-[var(--gold-ink)] sm:inline-block">
              All services →
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Service names lead the section. Rows replay their entrance in BOTH scroll
          directions (largo js-scrollShow behavior): rule draws, name rises out of
          its mask, thumbnail slides in. */}
      <div className="shell mt-12">
        {d.items.map((s) => (
          <ServiceRow key={s.title} s={s} />
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
              <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,11,12,0.92), rgba(11,11,12,0.6) 60%, rgba(11,11,12,0.25))" }} />
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

/* One "What we do" row — masked name rise + rule draw + thumb slide, replayed
   whenever the row re-enters the viewport from either direction. */
function ServiceRow({ s }: { s: HomeData["services"]["items"][number] }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <Link href="/services" className="group grid grid-cols-[1fr_auto] items-center gap-x-6 border-t border-[var(--line-strong)] py-5 md:py-7">
        <span>
          <span className="display-index block text-[var(--bone)] transition-colors duration-500 group-hover:text-[var(--gold-ink)]">{s.title}</span>
          <span className="mt-1.5 hidden max-w-[52ch] text-sm text-[var(--muted)] sm:block">{s.sub}</span>
        </span>
        <span className="relative hidden h-16 w-28 shrink-0 overflow-hidden rounded-lg sm:block md:h-20 md:w-36">
          <Image src={s.image} alt="" fill sizes="144px" className="object-cover" />
        </span>
      </Link>
    );
  }
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.45 }}>
      <motion.span
        aria-hidden="true"
        className="block h-px w-full origin-left bg-[var(--line-strong)]"
        variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.9, ease: EASE_CURTAIN } } }}
      />
      <Link href="/services" className="group grid grid-cols-[1fr_auto] items-center gap-x-6 py-5 md:py-7">
        <span>
          <span className="block overflow-hidden">
            <motion.span
              className="display-index block will-change-transform text-[var(--bone)] transition-colors duration-500 group-hover:text-[var(--gold-ink)]"
              variants={{ hidden: { y: "112%" }, show: { y: "0%", transition: { duration: 0.85, ease: EASE_CURTAIN, delay: 0.05 } } }}
            >
              {s.title}
            </motion.span>
          </span>
          <motion.span
            className="mt-1.5 hidden max-w-[52ch] text-sm text-[var(--muted)] sm:block"
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_CURTAIN, delay: 0.16 } } }}
          >
            {s.sub}
          </motion.span>
        </span>
        <motion.span
          className="relative hidden h-16 w-28 shrink-0 overflow-hidden rounded-lg sm:block md:h-20 md:w-36"
          variants={{ hidden: { opacity: 0, x: 34 }, show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE_CURTAIN, delay: 0.1 } } }}
        >
          <Image src={s.image} alt="" fill sizes="144px" className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" />
        </motion.span>
      </Link>
    </motion.div>
  );
}

/* ---------------- Why choose us ---------------- */
function WhyChoose({ d }: { d: HomeData["whyChoose"] }) {
  return (
    <section className="section pattern-dots">
      <div className="shell">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
            <span className="uppercase tracking-[0.16em] text-[var(--bone-dim)]">{d.label}</span>
          </div>
        </Reveal>
        {/* Title anchors the left edge; supporting copy + CTA sit beside it. */}
        <div className="mt-8 grid gap-x-16 gap-y-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <LineMask text={d.title} tag="h2" className="display-l max-w-[16ch]" />
          <Reveal delay={140}>
            <div>
              <p className="max-w-[46ch] text-[var(--bone-dim)]">{d.body}</p>
              <div className="mt-6"><Link href="/projects" className="btn btn-primary">{d.ctaLabel}<span className="btn-icon" aria-hidden="true">→</span></Link></div>
            </div>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal><StatImageCard img={d.cardLeft.image} prefix={d.cardLeft.prefix} end={d.cardLeft.end} suffix={d.cardLeft.suffix} label={d.cardLeft.label} /></Reveal>
          <Reveal delay={80}>
            <div className="grid h-full gap-5">
              <StatDarkCard end={d.cardMidTop.end} suffix={d.cardMidTop.suffix} label={d.cardMidTop.label} />
              <StatDarkCard end={d.cardMidBottom.end} suffix={d.cardMidBottom.suffix} label={d.cardMidBottom.label} />
            </div>
          </Reveal>
          <Reveal delay={140} className="sm:col-span-2 lg:col-span-1"><StatImageCard img={d.cardRight.image} end={d.cardRight.end} suffix={d.cardRight.suffix} label={d.cardRight.label} /></Reveal>
        </div>
      </div>
    </section>
  );
}
function StatImageCard({ img, prefix, end, suffix, label }: { img: string; prefix?: string; end: number; suffix: string; label: string }) {
  return (
    <div className="group relative min-h-[420px] overflow-hidden rounded-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5" style={{ color: "var(--on-media)" }}>
      <Image src={img} alt="" fill sizes="(max-width:1024px) 100vw, 33vw" className="img-zoom object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,19,21,0.92), transparent 55%)" }} />
      <div className="absolute inset-x-0 bottom-0 p-7">
        <div className="text-4xl font-extrabold"><CountUp end={end} prefix={prefix} suffix={suffix} /></div>
        <p className="mt-2 max-w-[30ch] text-sm" style={{ color: "var(--on-media-dim)" }}>{label}</p>
      </div>
      <span aria-hidden="true" className="absolute bottom-0 left-0 h-[3px] w-0 bg-[var(--gold)] transition-all duration-500 group-hover:w-full" />
      <CurtainOnView />
    </div>
  );
}
function StatDarkCard({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  return (
    <div className="group hover-lift relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-2xl bg-[#1b1d20] p-7" style={{ color: "var(--on-media)" }}>
      <div className="text-4xl font-extrabold transition-colors duration-500 group-hover:text-[var(--gold-media)]"><CountUp end={end} suffix={suffix} /></div>
      <p className="mt-2 max-w-[34ch] text-sm" style={{ color: "var(--on-media-dim)" }}>{label}</p>
      <span aria-hidden="true" className="absolute left-0 top-0 h-[3px] w-0 bg-[var(--gold)] transition-all duration-500 group-hover:w-full" />
      <CurtainOnView delay={0.1} />
    </div>
  );
}

/* ---------------- Featured: image-led covers (largo home-teaser anatomy) ---------------- */
function Featured({ d }: { d: HomeData["featured"] }) {
  return (
    <section data-nav-tone="dark" className="relative overflow-hidden rounded-t-[2.5rem] bg-[#111315] py-[clamp(5rem,11vw,9rem)]" style={{ color: "var(--on-media)" }}>
      <div className="shell">
        <Reveal><span className="eyebrow" style={{ color: "var(--on-media-dim)" }}>{d.kicker}</span></Reveal>
        <SplitReveal text={`${d.title} ${d.titleMuted}`} tag="h2" className="display-2xl mt-8" />
      </div>

      {/* The work leads: full-bleed covers with masked titles and index numbers.
          Rhythm: every third card takes the full row. */}
      <div className="shell mt-14 grid gap-6 md:grid-cols-2">
        {d.items.map((p, i) => {
          const wide = i % 3 === 0;
          return (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className={`group relative block overflow-hidden rounded-2xl ${wide ? "aspect-[4/3] md:col-span-2 md:aspect-[16/8]" : "aspect-[4/3]"}`}
            >
              <Image
                src={p.image}
                alt={p.title}
                fill
                sizes={wide ? "100vw" : "(max-width:768px) 100vw, 50vw"}
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              />
              <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,11,12,0.74), transparent 52%)" }} />
              <span className="absolute left-5 top-5 font-mono text-[0.62rem] tracking-[0.22em]" style={{ color: "var(--on-media-dim)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 md:p-7">
                <div className="min-w-0">
                  <LineMask text={p.title} tag="h3" className={wide ? "display-m" : "text-2xl font-semibold"} />
                  <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.2em]" style={{ color: "var(--on-media-dim)" }}>
                    {[p.year, p.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[rgba(246,245,242,0.14)] backdrop-blur transition-all duration-500 group-hover:translate-x-1 group-hover:bg-[var(--gold)] group-hover:text-[#17191c]"
                >
                  →
                </span>
              </div>
              <CurtainOnView color="#111315" delay={wide ? 0 : (i % 3) * 0.07} />
            </Link>
          );
        })}
      </div>

      <div className="shell mt-12">
        <Reveal>
          <Link href="/projects" className="btn btn-ghost" style={{ borderColor: "rgba(246,245,242,0.25)", color: "var(--on-media)" }}>
            {d.linkLabel.replace(/\s*→\s*$/, "")}
            <span className="btn-icon" aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}


/* ---------------- Showreel ---------------- */
function Showreel({ d }: { d: HomeData["showreel"] }) {
  const reel = d.items;
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<HomeData["showreel"]["items"][number] | null>(null);
  const playing = lightbox !== null; // freeze the scroll-driven tile while open
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
  if (reel.length === 0) return null;
  return (
    /* 60vh per item (not 40) so each tile holds long enough for the 900ms
       flex/grayscale transition to actually read before the next one takes over. */
    <section ref={wrap} className="relative bg-[var(--ink)]" style={{ height: `${reel.length * 60}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="shell relative z-10 w-full">
          <Reveal>
            <div className="flex items-end justify-between">
              <span className="eyebrow">{d.label}</span>
              <Link href="/projects" className="link-underline hidden text-sm font-semibold text-[var(--gold-ink)] sm:inline-block">{d.linkLabel}</Link>
            </div>
          </Reveal>
          <div className="relative mt-8 overflow-hidden">
            <div className="flex h-[64vh] min-h-[380px] flex-col items-stretch gap-3 sm:flex-row">
            {reel.map((r, i) => {
              const isActive = i === active;
              return (
                <div key={r.image + i}
                  className={`group relative overflow-hidden rounded-2xl ${reduced ? "" : "transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"}`}
                  style={{ flex: isActive ? "1 1 58%" : "1 1 11%", opacity: isActive ? 1 : 0.55, filter: isActive ? "none" : "grayscale(0.9)" }}>
                  {isActive && (r.youtubeId || r.mp4) && !playing ? (
                    <div className="absolute inset-0">
                      <VideoPlayer youtubeId={r.youtubeId} mp4={r.mp4} poster={r.image} title={r.title} mode="ambient" rounded="" className="h-full w-full" />
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
                      {/* Opening the active tile goes through the same lightbox
                          the gallery page uses — video if the item has one,
                          the still otherwise. */}
                      <button
                        onClick={() => setLightbox(r)}
                        aria-label={r.youtubeId || r.mp4 ? `Play ${r.title}` : `Open ${r.title}`}
                        className={`absolute left-1/2 top-1/2 z-10 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[rgba(255,255,255,0.16)] text-xl backdrop-blur hover:scale-110 ${reduced ? "" : "transition-transform duration-500"}`}
                        style={{ color: "var(--on-media)" }}
                      >
                        {r.youtubeId || r.mp4 ? "▶" : "⤢"}
                      </button>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6" style={{ color: "var(--on-media)" }}>
                        <div className="font-mono text-sm tracking-[0.25em]">{r.title.toUpperCase()}</div>
                        <div className="mt-1 font-mono text-xs tracking-[0.25em]" style={{ color: "var(--on-media-dim)" }}>{r.kicker.toUpperCase()} - 2026</div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
            <CurtainOnView delay={0.15} color="var(--ink)" />
          </div>
        </div>
      </div>
      <MediaLightbox
        active={
          lightbox
            ? { title: lightbox.title, sector: lightbox.kicker, image: lightbox.image, youtubeId: lightbox.youtubeId || undefined, mp4: lightbox.mp4 || undefined }
            : null
        }
        onClose={() => setLightbox(null)}
      />
    </section>
  );
}

/* ---------------- Our process ----------------
   Auto-advancing (pauses on hover/focus, and never runs under reduced
   motion), with a per-row progress rail so the active step's dwell time
   reads as a fill instead of a flat color swap - the "Ken Burns" image
   zoom and the ghost numeral echo the treatment Services/Timeline use
   elsewhere on the page. */
const PROCESS_DWELL_MS = 4500;

function Process({ d }: { d: HomeData["process"] }) {
  const steps = d.steps;
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const step = steps[Math.min(active, steps.length - 1)];

  useEffect(() => {
    if (reduced || paused || steps.length < 2) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setProgress((p) => {
        const next = p + dt / PROCESS_DWELL_MS;
        if (next >= 1) {
          setActive((a) => (a + 1) % steps.length);
          return 0;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, paused, steps.length]);

  const selectStep = (i: number) => {
    setActive(i);
    setProgress(0);
  };

  if (!step) return null;
  return (
    <section className="section bg-[var(--ink-2)]">
      <div className="shell">
        <Reveal><span className="eyebrow">{d.label}</span></Reveal>
        <LineMask text="A process built for clarity." tag="h2" className="display-l mt-4 max-w-[20ch]" />
        <Reveal delay={70}><p className="mt-5 max-w-[56ch] text-[var(--bone-dim)]">{d.intro}</p></Reveal>
      </div>

      <div
        className="shell mt-14 grid gap-12 lg:grid-cols-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl lg:sticky lg:top-28">
          {steps.map((s, i) => (
            <Image
              key={s.image + i}
              src={s.image}
              alt={s.title}
              fill
              sizes="(max-width:1024px) 100vw, 45vw"
              className="object-cover transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.52,0.08,0.18,1)]"
              style={{ opacity: i === active ? 1 : 0, transform: i === active ? "scale(1)" : "scale(1.06)" }}
            />
          ))}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-5 top-5 font-extrabold leading-none"
            style={{ fontSize: "clamp(3rem,7vw,5rem)", color: "rgba(246,245,242,0.14)" }}
          >
            {step.n}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-7" style={{ background: "linear-gradient(to top, rgba(17,19,21,0.78), rgba(17,19,21,0.5) 70%, transparent)", color: "var(--on-media)" }}>
            <span className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: "var(--gold-media)" }}>
              Step {String(active + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
            </span>
            <h4 className="mt-2 text-xl font-semibold">{step.title}</h4>
            <p className="mt-2 max-w-[46ch] text-sm" style={{ color: "var(--on-media-dim)" }}>{step.body}</p>
          </div>
          <CurtainOnView />
        </div>

        <div>
          {steps.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.n + i}
                onClick={() => selectStep(i)}
                className="group block w-full border-b border-[var(--line)] py-5 text-left"
              >
                <span className="flex items-center gap-6">
                  <span className={`font-mono text-sm transition-colors duration-300 ${on ? "text-[var(--gold)]" : "text-[var(--muted)] group-hover:text-[var(--gold-ink)]"}`}>{s.n}</span>
                  <span className={`flex-1 uppercase tracking-[0.06em] transition-colors duration-300 ${on ? "text-[var(--bone)]" : "text-[var(--bone-dim)] group-hover:text-[var(--bone)]"}`}>{s.title}</span>
                  <span className="text-lg text-[var(--gold-ink)] transition-all duration-300" style={{ opacity: on ? 1 : 0, transform: on ? "translateX(0)" : "translateX(-8px)" }} aria-hidden="true">→</span>
                </span>
                <span className="mt-3 block h-[2px] w-full overflow-hidden rounded-full bg-[var(--line)]" aria-hidden="true">
                  <span
                    className="block h-full w-full origin-left rounded-full bg-[var(--gold)]"
                    style={{ transform: `scaleX(${on ? Math.min(progress, 1) : 0})`, transition: on ? "none" : "transform 0.3s ease" }}
                  />
                </span>
              </button>
            );
          })}
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
              <div key={t.n} className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
                <div>
                  <div className="font-mono text-sm text-[var(--gold-ink)]">{t.year}</div>
                  <div className="display-m mt-3">{t.pre} <span className="text-[var(--gold-ink)]">{t.accent}</span> {t.post}</div>
                </div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                  <Image src={t.image} alt={`${t.pre} ${t.accent} ${t.post}`} fill sizes="(max-width:768px) 100vw, 45vw" className="object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={wrap} className="relative" style={{ height: `${timeline.length * 55 + 40}vh` }}>
      {/* Full-bleed scrub theater: media crossfades + settles, titles swap with a
          rise/exit, ghost index numeral, progress rail (largo ProjectsDetailCover). */}
      <div data-nav-tone="dark" className="sticky top-0 h-screen overflow-hidden bg-[#0d0e10]" style={{ color: "var(--on-media)" }}>
        {timeline.map((t, i) => (
          <div
            key={t.image + i}
            className="absolute inset-0 transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.52,0.08,0.18,1)]"
            style={{ opacity: i === idx ? 1 : 0, transform: `scale(${i === idx ? 1 : 1.06})` }}
          >
            <Image src={t.image} alt={`${t.pre} ${t.accent} ${t.post}`} fill sizes="100vw" className="object-cover" />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,10,12,0.88), rgba(9,10,12,0.15) 45%, rgba(9,10,12,0.45))" }} />

        <AnimatePresence mode="wait">
          <motion.span
            key={`n-${idx}`}
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.5, ease: EASE_CURTAIN }}
            className="pointer-events-none absolute right-[3vw] top-1/2 -translate-y-1/2 font-extrabold leading-none"
            style={{ fontSize: "clamp(9rem, 24vw, 22rem)", color: "rgba(246,245,242,0.07)" }}
          >
            {cur.n}
          </motion.span>
        </AnimatePresence>

        <div className="absolute inset-x-0 top-0 pt-28 md:pt-32">
          <div className="shell flex items-center justify-between gap-6">
            <h2 className="text-xl font-extrabold uppercase tracking-[0.06em] md:text-2xl">{d.title}</h2>
            <span className="font-mono text-sm" style={{ color: "var(--on-media-dim)" }}>
              {String(idx + 1).padStart(2, "0")} / {String(timeline.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 pb-12 md:pb-16">
          <div className="shell">
            <AnimatePresence mode="wait">
              <motion.div
                key={`t-${idx}`}
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -26 }}
                transition={{ duration: 0.45, ease: EASE_CURTAIN }}
              >
                <span className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: "var(--gold-media)" }}>{cur.year}</span>
                <div className="mt-3 max-w-[16ch] font-extrabold leading-[0.98] tracking-[-0.03em]" style={{ fontSize: "clamp(2.2rem, 6vw, 5.2rem)" }}>
                  {cur.pre} <span style={{ color: "var(--gold-media)" }}>{cur.accent}</span> {cur.post}
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 flex items-center gap-6">
              <div className="h-px flex-1 overflow-hidden rounded-full" style={{ background: "rgba(246,245,242,0.22)" }}>
                <div className="h-px bg-[var(--gold)] transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${fill}%` }} />
              </div>
              <Link href="/projects" className="link-underline shrink-0 text-sm font-semibold" style={{ color: "var(--gold-media)" }}>
                View full portfolio →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Testimonials (rotating quote theater) ----------------
   One voice on stage at a time: the portrait wipes in through a geometric
   clip, the quote rises word-by-word out of masks, and on rotation the whole
   figure lifts out the top (AnimatePresence exit) as the next enters. */
function Testimonials({ d, heroImage }: { d: HomeData["testimonials"]; heroImage?: { src: string; alt: string } }) {
  const reduced = useReducedMotion();
  const all = useMemo(() => [d.featured, ...d.quotes], [d]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || paused || all.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % all.length), 6000);
    return () => clearInterval(t);
  }, [reduced, paused, all.length]);

  const cur = all[Math.min(idx, all.length - 1)];
  if (!cur) return null;
  const words = cur.quote.split(/\s+/).filter(Boolean);
  const goTo = (delta: number) => setIdx((i) => (i + delta + all.length) % all.length);

  if (reduced) {
    return (
      <section className="section grad-mesh">
        <div className="shell">
          <span className="eyebrow">{d.label}</span>
          <h2 className="display-l mt-5 max-w-[13ch]">{d.title}</h2>
          <div className="mt-12 space-y-10">
            {all.map((t) => (
              <figure key={t.name} className="flex items-start gap-6 border-t border-[var(--line)] pt-8">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  {t.image ? <Image src={t.image} alt="" fill sizes="64px" className="object-cover" /> : <span className="grid h-full w-full place-items-center font-bold text-[var(--gold)]">{initials(t.name)}</span>}
                </span>
                <div>
                  <blockquote className="max-w-[52ch] text-lg text-[var(--bone)]">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-3"><span className="font-semibold">{t.name}</span><div className="text-sm text-[var(--muted)]">{t.role}</div></figcaption>
                </div>
              </figure>
            ))}
          </div>
          <CTA href="/contact" label={d.ctaLabel} variant="ghost" />
        </div>
      </section>
    );
  }

  return (
    <section className="section grad-mesh" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="shell relative">
        <div className="absolute left-0 top-0 hidden h-full lg:block" style={{ writingMode: "vertical-rl" }}>
          <span className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">06 / Testimonials</span>
        </div>
        <div className="lg:pl-16">
          <Reveal className="overflow-hidden rounded-2xl border border-[var(--line-strong)]">
            {/* Row 1: statement | context image */}
            <div className="grid lg:grid-cols-2">
              <div className="flex flex-col justify-center border-b border-[var(--line-strong)] p-8 lg:border-b-0 lg:border-r lg:p-14">
                <span className="eyebrow">{d.label}</span>
                <LineMask text={d.title} tag="h2" className="display-l mt-5" />
              </div>
              <div className="relative min-h-[220px] border-b border-[var(--line-strong)] lg:border-b-0">
                {heroImage ? <ParallaxImage src={heroImage.src} alt={heroImage.alt} sizes="(min-width: 1024px) 50vw, 100vw" className="h-full w-full" /> : null}
              </div>
            </div>

            {/* Row 2: portrait | quote */}
            <div className="grid border-t border-[var(--line-strong)] lg:grid-cols-[0.38fr_0.62fr]">
              <div className="relative aspect-[4/5] min-h-[360px] overflow-hidden border-b border-[var(--line-strong)] lg:aspect-auto lg:min-h-[460px] lg:border-b-0 lg:border-r">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={idx}
                    className="absolute inset-0"
                    initial={{ clipPath: "inset(0 0 100% 0)", scale: 1.08 }}
                    animate={{ clipPath: "inset(0 0 0% 0)", scale: 1 }}
                    exit={{ clipPath: "inset(100% 0 0 0)", opacity: 0.4 }}
                    transition={{ duration: 0.75, ease: EASE_CURTAIN }}
                  >
                    {cur.image ? (
                      <Image src={cur.image} alt={`${cur.name} - portrait`} fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-[var(--surface-2)] text-4xl font-bold text-[var(--gold)]">{initials(cur.name)}</span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative p-8 lg:p-14">
                <span aria-hidden="true" className="pointer-events-none absolute left-8 top-6 select-none text-[6rem] font-extrabold leading-none text-[var(--gold)] opacity-[0.16] lg:left-14 lg:top-8 lg:text-[8rem]">&ldquo;</span>
                <AnimatePresence mode="wait">
                  <motion.figure key={idx} className="relative pt-16" exit={{ y: -34, opacity: 0, transition: { duration: 0.35, ease: EASE_CURTAIN } }}>
                    <motion.blockquote
                      aria-label={cur.quote}
                      className="max-w-[46ch] text-2xl leading-snug text-[var(--bone)] md:text-[2.15rem]"
                      initial="hidden"
                      animate="show"
                      variants={{ show: { transition: { staggerChildren: 0.028, delayChildren: 0.15 } } }}
                    >
                      {words.map((w, i) => (
                        <span key={i} className="inline-flex overflow-hidden py-[0.09em] -my-[0.09em] align-bottom">
                          <motion.span
                            aria-hidden="true"
                            className="inline-block will-change-transform"
                            variants={{ hidden: { y: "115%" }, show: { y: "0%", transition: { duration: 0.7, ease: EASE_CURTAIN } } }}
                          >
                            {w}
                          </motion.span>
                          {i < words.length - 1 ? <span aria-hidden="true">&nbsp;</span> : null}
                        </span>
                      ))}
                    </motion.blockquote>
                  </motion.figure>
                </AnimatePresence>
              </div>
            </div>

            {/* Row 3: prev/next + counter | name & role */}
            <div className="grid grid-cols-2 border-t border-[var(--line-strong)]">
              <div className="flex items-center gap-6 border-r border-[var(--line-strong)] p-6 lg:p-8">
                <button onClick={() => goTo(-1)} aria-label="Previous testimonial" className="-m-2.5 p-2.5 text-xl text-[var(--muted)] transition-colors duration-300 hover:text-[var(--gold-ink)]">←</button>
                <span className="font-mono text-sm text-[var(--muted)]">{String(idx + 1).padStart(2, "0")}/{String(all.length).padStart(2, "0")}</span>
                <button onClick={() => goTo(1)} aria-label="Next testimonial" className="-m-2.5 p-2.5 text-xl text-[var(--muted)] transition-colors duration-300 hover:text-[var(--gold-ink)]">→</button>
              </div>
              <div className="flex items-center justify-between gap-4 p-6 lg:p-8">
                <span className="font-semibold">{cur.name}</span>
                <span className="text-sm text-[var(--muted)]">{cur.role}</span>
              </div>
            </div>
          </Reveal>

          {!paused && (
            <div className="mt-4 h-px w-full overflow-hidden rounded-full bg-[var(--line)]">
              <motion.div
                key={`p-${idx}`}
                className="h-px origin-left bg-[var(--gold)]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 6, ease: "linear" }}
              />
            </div>
          )}
          <Reveal delay={100} className="mt-10"><CTA href="/contact" label={d.ctaLabel} variant="ghost" /></Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Clients (ruled grid wall) ----------------
   Wordmarks sit in a hairline grid; cells cascade in on scroll, a gold
   highlight roams the wall on an interval, and hover claims it instantly. */
function Clients({ d }: { d: HomeData["clients"] }) {
  const names = useMemo(() => [...d.rowA, ...d.rowB], [d.rowA, d.rowB]);
  const [hot, setHot] = useState(-1);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || names.length === 0) return;
    const t = setInterval(() => setHot(Math.floor(Math.random() * names.length)), 1500);
    return () => clearInterval(t);
  }, [reduced, names.length]);

  return (
    <section className="section grad-soft">
      <div className="shell">
        <div className="flex items-center justify-between gap-6">
          <Reveal><span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{d.label}</span></Reveal>
          <Reveal delay={80}><span className="font-mono text-xs text-[var(--muted)]">{String(names.length).padStart(2, "0")} - and counting</span></Reveal>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3 lg:grid-cols-4">
          {names.map((c, i) => {
            const on = hot === i;
            return (
              <motion.div
                key={c + i}
                initial={reduced ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: EASE_CURTAIN, delay: reduced ? 0 : (i % 4) * 0.07 + Math.floor(i / 4) * 0.05 }}
                onMouseEnter={() => setHot(i)}
                className="grid min-h-[104px] place-items-center px-6 py-8 transition-colors duration-500"
                style={{ background: on ? "var(--surface-2)" : "var(--ink)" }}
              >
                <span
                  className="text-xl font-bold transition-all duration-500"
                  style={{ color: on ? "var(--gold-ink)" : "var(--bone-dim)", transform: on ? "translateY(-2px)" : "none" }}
                >
                  {c}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Statement band (image-masked wordmark) ---------------- */
function StatementBand({ d }: { d: HomeData["statement"] }) {
  const reduced = useReducedMotion();
  const wordMotionProps = reduced
    ? {}
    : {
        initial: { opacity: 0, scale: 0.82 },
        whileInView: { opacity: 1, scale: 1 },
        viewport: { once: false, amount: 0.4 },
        transition: { duration: 1, ease: EASE_CURTAIN },
      };
  return (
    <section data-nav-tone="dark" className="relative overflow-hidden rounded-t-[2.5rem] bg-[#111315] py-[clamp(5rem,15vw,11rem)]" style={{ color: "var(--on-media)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(rgba(246,245,242,0.6) 1px, transparent 1px)", backgroundSize: "26px 26px" }} aria-hidden="true" />
      <div className="shell relative text-center">
        <span className="eyebrow" style={{ color: "var(--gold-media)" }}>{d.label}</span>
        <motion.h2 className="mt-6 font-extrabold leading-[0.84] tracking-[-0.04em] text-[clamp(2.7rem,13vw,12.5rem)]" {...wordMotionProps}>
          <ImageMaskText text={d.word} image={d.image} />
        </motion.h2>
        <p className="mx-auto mt-8 max-w-[52ch]" style={{ color: "var(--on-media-dim)" }}>
          {d.body}
        </p>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}
function HeadsetIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M19 19v1a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}
function PlusMinusIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14" />
      {!open && <path d="M12 5v14" />}
    </svg>
  );
}

const GOLD_GRADIENT = "linear-gradient(120deg, #d0aa72 0%, #a87f3f 55%, #8f6c39 100%)";

function FAQ({ d }: { d: HomeData["faq"] }) {
  const [open, setOpen] = useState(0);
  const titleWords = d.title.split(" ");
  const titleLead = titleWords.slice(0, -1).join(" ");
  const titleLast = titleWords[titleWords.length - 1];
  return (
    <section className="section bg-[var(--ink-2)]">
      <div className="shell grid gap-12 lg:grid-cols-[0.9fr_1.3fr]">
        <div>
          <Reveal>
            <span className="inline-flex rounded-full border border-[var(--gold)]/40 bg-[var(--surface)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--gold-ink)]">
              {d.label}
            </span>
          </Reveal>
          <h2 className="display-l mt-6 flex flex-wrap gap-x-3">
            <LineMask text={titleLead} tag="span" />
            <LineMask text={titleLast} tag="span" className="grad-text" delay={0.12} />
          </h2>
          <Reveal delay={110}><div className="mt-5 h-1 w-16 rounded-full" style={{ background: GOLD_GRADIENT }} /></Reveal>
          <Reveal delay={140}><p className="mt-6 max-w-[42ch] text-[var(--bone-dim)]">{d.description}</p></Reveal>

          <Reveal delay={180}>
            <div className="hover-lift mt-8 rounded-2xl border border-[var(--line)] p-8" style={{ background: "linear-gradient(160deg, rgba(168,127,63,0.14), rgba(168,127,63,0.03))" }}>
              <span className="grid h-14 w-14 place-items-center rounded-full text-[#17191c]" style={{ background: GOLD_GRADIENT }}>
                <CalendarIcon />
              </span>
              <h3 className="display-m mt-6">{d.cardTitle}</h3>
              <p className="mt-3 text-sm text-[var(--muted)]">{d.cardBody}</p>
              <Link href="/contact" className="btn btn-grad mt-6 w-full justify-center">
                <CalendarIcon className="h-4 w-4" />
                {d.cardCta}
                <span className="btn-icon" aria-hidden="true">→</span>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={220}>
            <Link href="/contact" className="group mt-5 flex items-center gap-4 rounded-2xl border border-[var(--line)] p-5 transition-colors duration-300 hover:border-[var(--line-strong)]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-[var(--gold-ink)]"><HeadsetIcon /></span>
              <span className="flex-1">
                <span className="block font-semibold">{d.supportLabel}</span>
                <span className="block text-sm text-[var(--muted)]">{d.supportBody}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-[var(--gold-ink)] transition-transform duration-300 group-hover:translate-x-1">{d.supportCta} →</span>
            </Link>
          </Reveal>
        </div>

        <div>
          {d.items.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q + i} delay={(i % 5) * 50} className="mb-4 last:mb-0">
                <div
                  className="rounded-2xl border p-6 transition-colors duration-300"
                  style={isOpen ? { borderColor: "rgba(168,127,63,0.35)", background: "linear-gradient(160deg, rgba(168,127,63,0.12), rgba(168,127,63,0.02))" } : { borderColor: "var(--line)" }}
                >
                  <button onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full items-center justify-between gap-6 text-left" aria-expanded={isOpen}>
                    <span className="flex items-center gap-4">
                      <span
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-xs font-bold text-[var(--gold-ink)]"
                        style={{ background: isOpen ? "rgba(168,127,63,0.18)" : "var(--surface-2)" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-lg font-medium md:text-xl">{f.q}</span>
                    </span>
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors duration-300"
                      style={isOpen ? { background: GOLD_GRADIENT, borderColor: "transparent", color: "#17191c" } : { borderColor: "var(--line-strong)", color: "var(--muted)" }}
                    >
                      <PlusMinusIcon open={isOpen} />
                    </span>
                  </button>
                  <div className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden"><p className="max-w-[58ch] py-4 pl-12 text-sm text-[var(--muted)]">{f.a}</p></div>
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
          <LineMask text={d.title} tag="h2" className="display-l max-w-[16ch]" />
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
      else setError(res.error ?? "Something interrupted the send - please try again.");
    });
  };

  return (
    <section data-nav-tone="dark" className="relative overflow-hidden rounded-t-[2.5rem]">
      <div className="absolute inset-0">
        <ParallaxImage src={d.image} alt="" sizes="100vw" range={7} className="h-full w-full" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(112deg, rgba(9,10,12,0.93) 10%, rgba(9,10,12,0.6) 52%, rgba(9,10,12,0.84) 100%)" }} aria-hidden="true" />
      </div>
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
                  <textarea required name="message" rows={4} minLength={10} placeholder="Site, scale, ambitions - anything helps." className={`${ctaFieldCls} resize-none`} />
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

export type HomeLayoutItem = { id: string; enabled: boolean };

export default function Sections({
  data,
  posts,
  contact,
  layout,
}: {
  data: HomeData;
  posts: JournalCard[];
  contact: { email: string; phone: string };
  layout?: HomeLayoutItem[];
}) {
  // id → section element. Order/visibility comes from the CMS `home.layout`
  // block; when it's absent every section renders in the canonical order.
  const renderers: Record<string, React.ReactNode> = {
    about: <About d={data.about} />,
    services: <ServicesSlider d={data.services} />,
    whyChoose: <WhyChoose d={data.whyChoose} />,
    featured: <Featured d={data.featured} />,
    showreel: <Showreel d={data.showreel} />,
    // TEMP comparison: ProcessBeam is a draft alternate treatment of the same
    // content, stacked right after the live Process section so the client can
    // see both and decide which to keep. Remove the loser once they pick.
    process: <Process d={data.process} />,
    timeline: <Timeline d={data.timeline} />,
    testimonials: (
      <Testimonials
        d={data.testimonials}
        heroImage={data.featured.items[2] ? { src: data.featured.items[2].image, alt: data.featured.items[2].title } : undefined}
      />
    ),
    clients: <Clients d={data.clients} />,
    statement: <StatementBand d={data.statement} />,
    faq: <FAQ d={data.faq} />,
    journals: <Journals d={data.journals} posts={posts} />,
    cta: <FinalCTA d={data.cta} contact={contact} />,
  };

  const order = layout && layout.length ? layout : HOME_SECTION_IDS.map((id) => ({ id, enabled: true }));
  const seen = new Set(order.map((s) => s.id));
  // Any section in code but missing from a saved layout (e.g. added later)
  // renders at the end so nothing silently disappears.
  const tail = HOME_SECTION_IDS.filter((id) => !seen.has(id)).map((id) => ({ id, enabled: true }));

  return (
    <>
      {[...order, ...tail].map(({ id, enabled }) =>
        enabled && renderers[id] ? <Fragment key={id}>{renderers[id]}</Fragment> : null,
      )}
    </>
  );
}
