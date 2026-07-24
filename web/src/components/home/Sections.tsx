"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "@/components/Reveal";
import SplitReveal from "@/components/SplitReveal";
import LineMask from "@/components/motion/LineMask";
import Arcs from "@/components/motion/Arcs";
import { EASE_CURTAIN } from "@/lib/motion";
import ImageMaskText from "@/components/ImageMaskText";
import VideoPlayer from "@/components/VideoPlayer";
import { ParallaxImage, ParallaxX } from "@/components/Parallax";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { submitContact } from "@/lib/actions/contact";
import { HOME_SECTION_IDS } from "@/lib/homeSections";
import type { BlockData } from "@/content/defaults";

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
function About({ d, chips }: { d: HomeData["about"]; chips: { image: string; title: string }[] }) {
  // Manifesto with inline image chips: the statement leads, the architecture
  // stays present INSIDE the sentence (small photo pills between words).
  const words = d.title.split(/\s+/).filter(Boolean);
  const chipAfter: Record<number, number> =
    words.length >= 4 && chips.length >= 2
      ? { [Math.ceil(words.length / 3) - 1]: 0, [words.length - 2]: 1 }
      : {};
  return (
    <section className="section pattern-dots" id="about">
      <div className="shell">
        <Reveal><span className="font-mono text-xs tracking-[0.2em] text-[var(--muted)]">{d.kicker}</span></Reveal>
        <Reveal delay={60}>
          <h2 className="display-2xl mt-10 max-w-[26ch]">
            {words.map((w, i) => (
              <span key={i}>
                {i > 0 ? " " : null}
                {w}
                {chipAfter[i] !== undefined && chips[chipAfter[i]] ? (
                  <span className="relative mx-[0.14em] inline-block h-[0.72em] w-[1.7em] overflow-hidden rounded-full align-[-0.08em]">
                    <Image src={chips[chipAfter[i]].image} alt={chips[chipAfter[i]].title} fill sizes="140px" className="object-cover" />
                  </span>
                ) : null}
              </span>
            ))}
          </h2>
        </Reveal>
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
        <Reveal><span className="font-mono text-xs tracking-[0.2em]" style={{ color: "var(--on-media-dim)" }}>{d.kicker}</span></Reveal>
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
          <CurtainOnView />
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
function Testimonials({ d }: { d: HomeData["testimonials"] }) {
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
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal><span className="eyebrow">{d.label}</span></Reveal>
              <LineMask text={d.title} tag="h2" className="display-l mt-5 max-w-[15ch]" />
            </div>
            <Reveal delay={140}>
              <div className="flex items-center gap-3 pb-2">
                {all.map((t, i) => (
                  <button
                    key={t.name}
                    onClick={() => setIdx(i)}
                    aria-label={`Show quote from ${t.name}`}
                    aria-pressed={i === idx}
                    className="grid h-9 w-9 place-items-center rounded-full border text-xs font-bold transition-all duration-400"
                    style={{
                      borderColor: i === idx ? "var(--gold)" : "var(--line-strong)",
                      background: i === idx ? "var(--gold)" : "transparent",
                      color: i === idx ? "#17191c" : "var(--muted)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[0.38fr_0.62fr] lg:gap-20">
            {/* Portrait: geometric clip wipe in, lift out */}
            <div className="relative mx-auto w-full max-w-[340px]">
              <Arcs className="absolute -left-14 -top-14 w-[125%]" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[var(--line)]">
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
                      <Image src={cur.image} alt={`${cur.name} — portrait`} fill sizes="340px" className="object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-[var(--surface-2)] text-4xl font-bold text-[var(--gold)]">{initials(cur.name)}</span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Quote: word-mask cascade in, lift + fade out */}
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute -left-4 -top-16 select-none text-[9rem] font-extrabold leading-none text-[var(--gold)] opacity-[0.13]">&ldquo;</span>
              <AnimatePresence mode="wait">
                <motion.figure key={idx} exit={{ y: -34, opacity: 0, transition: { duration: 0.35, ease: EASE_CURTAIN } }}>
                  <motion.blockquote
                    aria-label={cur.quote}
                    className="max-w-[44ch] text-xl leading-normal text-[var(--bone)] md:text-2xl"
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
                  <motion.figcaption
                    className="mt-8"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_CURTAIN, delay: 0.5 } }}
                  >
                    <span className="font-semibold">{cur.name}</span>
                    <div className="text-sm text-[var(--muted)]">{cur.role}</div>
                  </motion.figcaption>
                </motion.figure>
              </AnimatePresence>
              {/* per-quote progress */}
              <div className="mt-10 h-px w-full max-w-[320px] overflow-hidden rounded-full bg-[var(--line)]">
                {!paused && (
                  <motion.div
                    key={`p-${idx}`}
                    className="h-px origin-left bg-[var(--gold)]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 6, ease: "linear" }}
                  />
                )}
              </div>
              <Reveal delay={100}><CTA href="/contact" label={d.ctaLabel} variant="ghost" /></Reveal>
            </div>
          </div>
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
          <Reveal delay={80}><span className="font-mono text-xs text-[var(--muted)]">{String(names.length).padStart(2, "0")} — and counting</span></Reveal>
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
  return (
    <section data-nav-tone="dark" className="relative overflow-hidden rounded-t-[2.5rem] bg-[#111315] py-[clamp(5rem,15vw,11rem)]" style={{ color: "var(--on-media)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(rgba(246,245,242,0.6) 1px, transparent 1px)", backgroundSize: "26px 26px" }} aria-hidden="true" />
      <div className="shell relative text-center">
        <span className="eyebrow" style={{ color: "var(--gold-media)" }}>{d.label}</span>
        <h2 className="mt-6 font-extrabold leading-[0.84] tracking-[-0.04em] text-[clamp(2.7rem,13vw,12.5rem)]">
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
    about: <About d={data.about} chips={data.featured.items.slice(0, 2)} />,
    services: <ServicesSlider d={data.services} />,
    whyChoose: <WhyChoose d={data.whyChoose} />,
    featured: <Featured d={data.featured} />,
    showreel: <Showreel d={data.showreel} />,
    process: <Process d={data.process} />,
    timeline: <Timeline d={data.timeline} />,
    testimonials: <Testimonials d={data.testimonials} />,
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
