"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "@/components/Reveal";
import ScrollHighlightText from "@/components/ScrollHighlightText";
import ImageMaskText from "@/components/ImageMaskText";
import VideoPlayer from "@/components/VideoPlayer";
import { Parallax, ParallaxImage } from "@/components/Parallax";
import { useReducedMotion } from "@/lib/useReducedMotion";

const R = (n: string) => `/media/renders/${n}.jpg`;
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

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
const aboutStats = [
  { end: 20, suffix: "+", l: "Years of experience", d: "Designing spaces that combine function and beauty." },
  { end: 100, suffix: "+", l: "Completed projects", d: "Across residential, commercial, and cultural sectors." },
  { end: 85, suffix: "%", l: "Repeat clients", d: "Reflecting long-term trust and lasting relationships." },
  { end: 12, suffix: "", l: "Countries served", d: "Delivering projects with global reach and local sensitivity." },
];
function About() {
  return (
    <section className="section pattern-dots" id="about">
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Reveal><span className="font-mono text-xs tracking-[0.2em] text-[var(--muted)]">(SD 02) — ABOUT</span></Reveal>
            <h2 className="display-l mt-10 max-w-[16ch]"><ScrollHighlightText text="Architecture that stands for clarity and purpose." /></h2>
            <Reveal delay={130}><CTA href="/about" label="Explore the studio" variant="ghost" /></Reveal>
          </div>
          <Reveal delay={120}>
            <div className="space-y-6 text-[var(--bone-dim)] lg:pt-2">
              <p>Studiodota is an architecture and design practice defined by a minimal yet human-centered philosophy. Guided by decades of collective expertise, we approach every project with rigor, precision, and creativity — buildings shaped with clarity, restraint, and long-lasting value.</p>
              <p>Our practice spans scales and disciplines, from residential and commercial architecture to cultural institutions and urban design. By blending technical expertise with cultural awareness, we create environments that respect context, enhance daily life, and inspire those who experience them.</p>
            </div>
          </Reveal>
        </div>
        <div className="mt-20 grid gap-10 border-t border-[var(--line)] pt-14 sm:grid-cols-2 lg:grid-cols-4">
          {aboutStats.map((s, i) => (
            <Reveal key={s.l} delay={i * 70}>
              <div>
                <div className="display-m grad-text font-semibold"><CountUp end={s.end} suffix={s.suffix} /></div>
                <div className="mt-4 font-semibold">{s.l}</div>
                <p className="mt-2 text-sm text-[var(--muted)]">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Services (Our Service — rows + layered feature cards) ---------------- */
const servicesData = [
  { title: "Architectural Design", sub: "Crafting functional, aesthetic, and purposeful building concepts — from first sketch through to a completed building.", tags: ["Concepting", "Space planning", "Building design"], img: "atelier-house", img2: "urban-oasis" },
  { title: "Interior Architecture", sub: "Shaping interiors that feel comfortable, refined, and balanced through light, material, and considered detail.", tags: ["Moodboarding", "Styling", "Layouting"], img: "interior", img2: "leafy-precinct" },
  { title: "Urban & Masterplanning", sub: "Precincts and public realm planned around the way real communities live, gather, and move.", tags: ["Zoning", "Public realm", "Phasing"], img: "harbour-masterplan", img2: "meridian-sports" },
  { title: "Renovation & Restoration", sub: "New life for existing and heritage structures, handled with precision, restraint, and care.", tags: ["Assessment", "Heritage", "Delivery"], img: "riverside-warehouse", img2: "interior" },
];
function ServicesSlider() {
  const [active, setActive] = useState(0);
  const [x, setX] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const n = servicesData.length;

  useEffect(() => {
    const compute = () => {
      const track = trackRef.current;
      const first = track?.children[0] as HTMLElement | undefined;
      if (!track || !first) return;
      const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      setX(active * (first.getBoundingClientRect().width + gap));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [active, n]);

  const go = (dir: number) => setActive((a) => Math.min(n - 1, Math.max(0, a + dir)));

  return (
    <section id="services" aria-roledescription="carousel" aria-label="Our services" className="section overflow-hidden grad-warm">
      <div className="shell">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[var(--gold-ink)]" aria-hidden="true">✦</span>
                <span className="text-sm font-bold uppercase tracking-[0.2em]">Our Service</span>
              </div>
              <h2 className="display-l mt-4">What we do.</h2>
            </div>
            <div className="hidden font-mono text-sm text-[var(--muted)] sm:block" aria-hidden="true">
              {String(active + 1).padStart(2, "0")}<span className="mx-1 opacity-50">/</span>{String(n).padStart(2, "0")}
            </div>
          </div>
        </Reveal>
      </div>

      <div data-nav-tone="dark" className="mt-10 overflow-hidden px-[var(--edge)]">
        <div
          ref={trackRef}
          className={`flex gap-5 ${reduced ? "" : "transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"}`}
          style={{ transform: `translateX(-${x}px)`, willChange: "transform" }}
        >
          {servicesData.map((s, i) => {
            const isActive = i === active;
            return (
              <article
                key={s.title}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}: ${s.title}`}
                aria-hidden={!isActive}
                className={`relative shrink-0 overflow-hidden rounded-3xl ${reduced ? "" : "transition-opacity duration-[900ms]"}`}
                style={{ width: "min(84vw, 1180px)", height: "clamp(420px, 66vh, 720px)", opacity: isActive ? 1 : 0.5 }}
              >
                <Image src={R(s.img)} alt={s.title} fill sizes="84vw" className="object-cover" />
                <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,11,12,0.9), rgba(11,11,12,0.12) 55%, rgba(11,11,12,0.28))" }} />
                {isActive && (
                  <div className="absolute inset-0 flex items-end justify-between gap-6 p-6 md:p-12" style={{ color: "var(--on-media)" }}>
                    <div className="max-w-[52ch]">
                      <span className="font-mono text-xs uppercase tracking-[0.28em]" style={{ color: "var(--gold-media)" }}>Service {String(i + 1).padStart(2, "0")}</span>
                      <h3 className="mt-3 font-extrabold leading-[0.95] tracking-[-0.03em]" style={{ fontSize: "clamp(2.2rem, 4.8vw, 4.25rem)" }}>{s.title}</h3>
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
                    <div className="flex shrink-0 gap-3">
                      <button onClick={() => go(-1)} disabled={active === 0} aria-label="Previous service" className="grid h-12 w-12 place-items-center rounded-full text-lg backdrop-blur transition-all duration-300 disabled:opacity-30 enabled:hover:scale-105" style={{ background: "rgba(246,245,242,0.16)", color: "var(--on-media)" }}>←</button>
                      <button onClick={() => go(1)} disabled={active === n - 1} aria-label="Next service" className="grid h-12 w-12 place-items-center rounded-full text-lg backdrop-blur transition-all duration-300 disabled:opacity-30 enabled:hover:scale-105" style={{ background: "rgba(246,245,242,0.16)", color: "var(--on-media)" }}>→</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Why choose us ---------------- */
function WhyChoose() {
  return (
    <section className="section pattern-dots">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
              <span className="uppercase tracking-[0.16em] text-[var(--bone-dim)]">Why choose us</span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div>
              <h2 className="display-l max-w-[18ch]">A studio dedicated to better spaces.</h2>
              <p className="mt-5 max-w-[46ch] text-[var(--bone-dim)]">A full-service architecture studio committed to delivering thoughtful, high-quality spaces. Our work blends creativity, technical skill, and attention to detail.</p>
              <div className="mt-7"><Link href="/projects" className="btn btn-primary">Explore our work<span className="btn-icon" aria-hidden="true">→</span></Link></div>
            </div>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          <Reveal><StatImageCard img="atelier-house" prefix="£" end={85} suffix="M +" label="Value delivered across residential and commercial projects." /></Reveal>
          <Reveal delay={80}>
            <div className="grid h-full gap-5">
              <StatDarkCard end={112} suffix=" +" label="Completed architectural works across the UK and internationally." />
              <StatDarkCard end={2} suffix="M sq ft." label="Total built environment we've planned, designed, or overseen." />
            </div>
          </Reveal>
          <Reveal delay={140}><StatImageCard img="riverside-warehouse" end={210} suffix=" +" label="Partners, builders, and clients." rating /></Reveal>
        </div>
      </div>
    </section>
  );
}
function StatImageCard({ img, prefix, end, suffix, label, rating }: { img: string; prefix?: string; end: number; suffix: string; label: string; rating?: boolean }) {
  return (
    <div className="group relative min-h-[420px] overflow-hidden rounded-2xl" style={{ color: "var(--on-media)" }}>
      <Image src={R(img)} alt="" fill sizes="(max-width:1024px) 100vw, 33vw" className="img-zoom object-cover" />
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

/* ---------------- Featured: Inside, Outside (editorial project cards) ---------------- */
const featured = [
  { slug: "urban-oasis", title: "Urban Oasis Apartments", location: "London, UK", year: "2025", img: "urban-oasis" },
  { slug: "atelier-house", title: "Atelier House", location: "Copenhagen, Denmark", year: "2025", img: "atelier-house" },
  { slug: "meridian-sports", title: "Meridian Sports Centre", location: "Manchester, UK", year: "2024", img: "meridian-sports" },
  { slug: "harbour-masterplan", title: "Harbour Quarter Masterplan", location: "Oslo, Norway", year: "2025", img: "harbour-masterplan" },
];

function QuoteMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 46 34" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 0h9l-3 9h-9L12 0Z" />
      <path d="M33 0h9l-3 9h-9L33 0Z" />
      <path d="M7.7 13h9l-7 21h-9l7-21Z" />
      <path d="M28.7 13h9l-7 21h-9l7-21Z" />
    </svg>
  );
}

function FeaturedCard({ p, i }: { p: (typeof featured)[number]; i: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 64 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduced ? 0 : 0.9, delay: reduced ? 0 : (i % 2) * 0.14, ease: [0.22, 1, 0.36, 1] }}
      className="group grid overflow-hidden rounded-lg md:grid-cols-2"
      style={{ background: "#f7f6f3", color: "#17191c" }}
    >
      <div className="flex min-h-[300px] flex-col justify-between gap-10 p-8 md:min-h-[430px] md:p-10">
        <QuoteMark className="h-8 w-auto self-start" />
        <div>
          <h3 className="max-w-[14ch] text-[1.65rem] font-medium leading-[1.12] tracking-[-0.015em] md:text-[2rem]">{p.title}</h3>
          <div className="mt-3 text-sm" style={{ color: "#6b7178" }}>{p.location} / {p.year}</div>
          <Link
            href={`/projects/${p.slug}`}
            className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-[rgba(23,25,28,0.28)] py-2 pl-2.5 pr-5 text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#17191c] hover:bg-[#17191c] hover:text-[#f7f6f3]"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full border border-current text-[0.7rem]" aria-hidden="true">→</span>
            View Details
          </Link>
        </div>
      </div>
      <div className="relative min-h-[280px] overflow-hidden md:min-h-full">
        <Image
          src={R(p.img)}
          alt={p.title}
          fill
          sizes="(max-width:768px) 100vw, 44vw"
          className={`object-cover ${reduced ? "" : "transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"}`}
        />
      </div>
    </motion.article>
  );
}

function Featured() {
  return (
    <section data-nav-tone="dark" className="relative overflow-hidden rounded-t-[2.5rem] bg-[#111315] py-[clamp(5rem,11vw,9rem)]" style={{ color: "var(--on-media)" }}>
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal><span className="font-mono text-xs tracking-[0.2em]" style={{ color: "var(--on-media-dim)" }}>(SD 04) — FEATURED PROJECTS</span></Reveal>
            <Reveal delay={70}><h2 className="display-l mt-6">Inside, <span style={{ color: "rgba(246,245,242,0.45)" }}>Outside</span></h2></Reveal>
          </div>
          <Reveal delay={130}>
            <Link href="/projects" className="link-underline hidden text-sm font-semibold sm:inline-block" style={{ color: "var(--gold-media)" }}>View all projects →</Link>
          </Reveal>
        </div>
        <Parallax amount={26}>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <FeaturedCard p={featured[0]} i={0} />
            <FeaturedCard p={featured[1]} i={1} />
          </div>
        </Parallax>
        <Parallax amount={-26}>
          <div className="mt-6 grid gap-6 lg:ml-[9%] lg:-mr-[3%] lg:grid-cols-2">
            <FeaturedCard p={featured[2]} i={2} />
            <FeaturedCard p={featured[3]} i={3} />
          </div>
        </Parallax>
      </div>
    </section>
  );
}

/* ---------------- Showreel ---------------- */
// yt = placeholder films verified embeddable — swap for the studio's own links in /admin
const reel = [
  { img: "atelier-house", t: "Atelier House", k: "Residential", yt: "zwagmtVuZoI" },
  { img: "interior", t: "Studio Vale", k: "Interior", yt: "daL7TkzyW7k" },
  { img: "meridian-sports", t: "Meridian", k: "Civic", yt: "FnrPZuN0m-0" },
  { img: "urban-oasis", t: "Urban Oasis", k: "Residential", yt: "gToL_3ouPcI" },
  { img: "harbour-masterplan", t: "Harbour Quarter", k: "Masterplan", yt: "lOJO1osi9po" },
];
function Showreel() {
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
  }, [playing, reduced]);
  return (
    <section ref={wrap} className="relative bg-[var(--ink)]" style={{ height: `${reel.length * 40}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="shell relative z-10 w-full">
          <div className="flex items-end justify-between">
            <span className="eyebrow">Showreel</span>
            <Link href="/projects" className="link-underline hidden text-sm font-semibold text-[var(--gold-ink)] sm:inline-block">Explore the gallery →</Link>
          </div>
          <div className="relative mt-8">
            <div className="flex h-[64vh] min-h-[380px] items-stretch gap-3">
            {reel.map((r, i) => {
              const isActive = i === active;
              return (
                <div key={r.img}
                  className={`group relative overflow-hidden rounded-2xl ${reduced ? "" : "transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"}`}
                  style={{ flex: isActive ? "1 1 58%" : "1 1 11%", opacity: isActive ? 1 : 0.55, filter: isActive ? "none" : "grayscale(0.9)" }}>
                  {isActive && r.yt && !playing ? (
                    <div className="absolute inset-0">
                      <VideoPlayer youtubeId={r.yt} poster={R(r.img)} title={r.t} mode="ambient" rounded="" className="h-full w-full" />
                    </div>
                  ) : (
                    <Image src={R(r.img)} alt={r.t} fill sizes="60vw" className={`object-cover ${reduced ? "" : "transition-transform duration-[1200ms] group-hover:scale-105"}`} />
                  )}
                  {!isActive && (
                    <button onClick={() => setActive(i)} aria-label={`View ${r.t}`} className="absolute inset-0 z-10" />
                  )}
                  {isActive && (
                    <>
                      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,19,21,0.8), transparent 55%)" }} />
                      <button onClick={() => setPlaying(true)} aria-label={`Play ${r.t} showreel`} className={`absolute left-1/2 top-1/2 z-10 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[rgba(255,255,255,0.16)] text-xl backdrop-blur hover:scale-110 ${reduced ? "" : "transition-transform duration-500"}`} style={{ color: "var(--on-media)" }}>▶</button>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6" style={{ color: "var(--on-media)" }}>
                        <div className="font-mono text-sm tracking-[0.25em]">{r.t.toUpperCase()}</div>
                        <div className="mt-1 font-mono text-xs tracking-[0.25em]" style={{ color: "var(--on-media-dim)" }}>{r.k.toUpperCase()} — 2026</div>
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
                <VideoPlayer youtubeId={reel[active].yt} poster={R(reel[active].img)} className="h-full w-full" rounded="" title={reel[active].t} mode="cinema" />
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
const processSteps = [
  { n: "01", t: "Consultation", d: "We start by understanding your brief, references, and goals in a focused kickoff.", img: "interior" },
  { n: "02", t: "Technical planning", d: "Measured drawings, structure, and a shared programme with clear milestones.", img: "atelier-house" },
  { n: "03", t: "Design development", d: "Materials, structure, and detail resolved against annotated design reviews.", img: "meridian-sports" },
  { n: "04", t: "Author supervision", d: "We guide the design through each review round — no guesswork, no drift.", img: "riverside-warehouse" },
  { n: "05", t: "Construction support", d: "On-site coordination and detailing through construction to protect the design intent.", img: "urban-oasis" },
  { n: "06", t: "Project completion", d: "The completed building handed over — documented, resolved, and ready to occupy.", img: "harbour-masterplan" },
];
function Process() {
  const [active, setActive] = useState(0);
  const step = processSteps[active];
  return (
    <section className="section bg-[var(--ink-2)]">
      <div className="shell grid gap-12 lg:grid-cols-2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl lg:sticky lg:top-28">
          {processSteps.map((s, i) => (
            <Image key={s.img} src={R(s.img)} alt={s.t} fill sizes="(max-width:1024px) 100vw, 45vw" className="object-cover transition-opacity duration-700" style={{ opacity: i === active ? 1 : 0 }} />
          ))}
          <div className="absolute inset-x-0 bottom-0 p-7" style={{ background: "rgba(17,19,21,0.5)", color: "var(--on-media)" }}>
            <div className="font-mono text-sm text-[var(--gold-hi)]">{step.n}</div>
            <h4 className="mt-1 text-xl font-semibold">{step.t}</h4>
            <p className="mt-2 max-w-[46ch] text-sm" style={{ color: "var(--on-media-dim)" }}>{step.d}</p>
          </div>
        </div>
        <div>
          <Reveal><span className="eyebrow">Our work process</span></Reveal>
          <Reveal delay={70}><p className="mt-5 text-[var(--bone-dim)]">At Studiodota, great architecture begins with understanding. Our process is clear, transparent, and client-focused — from first sketch to handover. Click each step to see how we work.</p></Reveal>
          <div className="mt-8 border-t border-[var(--line)]">
            {processSteps.map((s, i) => (
              <button key={s.n} onClick={() => setActive(i)} className="flex w-full items-center gap-6 border-b border-[var(--line)] py-5 text-left transition-colors duration-300">
                <span className={`font-mono text-sm ${i === active ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>{s.n}</span>
                <span className={`flex-1 uppercase tracking-[0.06em] transition-colors duration-300 ${i === active ? "text-[var(--bone)]" : "text-[var(--bone-dim)]"}`}>{s.t}</span>
                <span className="text-lg text-[var(--gold-ink)] transition-all duration-300" style={{ opacity: i === active ? 1 : 0, transform: i === active ? "translateX(0)" : "translateX(-8px)" }} aria-hidden="true">→</span>
              </button>
            ))}
          </div>
          <CTA href="/contact" label="Start your project" variant="ghost" />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Timeline (scroll-driven) ---------------- */
const timeline = [
  { year: "2021", n: "01.", pre: "The", accent: "Pinnacle", post: "Residence", img: "atelier-house" },
  { year: "2022", n: "02.", pre: "Urban", accent: "Haven", post: "Apartments", img: "urban-oasis" },
  { year: "2023", n: "03.", pre: "Leafy", accent: "Court", post: "Precinct", img: "leafy-precinct" },
  { year: "2024", n: "04.", pre: "Riverside", accent: "Works", post: "District", img: "riverside-warehouse" },
  { year: "2025", n: "05.", pre: "Meridian", accent: "Sports", post: "Centre", img: "meridian-sports" },
  { year: "2026", n: "06.", pre: "The", accent: "Horizon", post: "Masterplan", img: "harbour-masterplan" },
];
function Timeline() {
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
  }, [reduced]);
  const cur = timeline[idx];
  const fill = (idx / (timeline.length - 1)) * 100;

  if (reduced) {
    return (
      <section className="section">
        <div className="shell">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-extrabold uppercase tracking-[0.06em] md:text-4xl">Projects timeline</h2>
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
                  <Image src={R(t.img)} alt={t.post} fill sizes="(max-width:768px) 100vw, 45vw" className="object-cover" />
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
            <h2 className="text-2xl font-extrabold uppercase tracking-[0.06em] md:text-4xl">Projects timeline</h2>
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
                    <li key={t.year} className="flex items-center gap-5">
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
                  <Image key={t.img} src={R(t.img)} alt={t.post} fill sizes="(max-width:768px) 100vw, 45vw" className="object-cover transition-opacity duration-700" style={{ opacity: i === idx ? 1 : 0 }} />
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
const rightQuotes = [
  { q: "They operate like an extension of our team. Strategic, calm, and relentless about outcomes.", n: "Jordan Reyes", r: "Head of Product, Vanta" },
  { q: "From day one, they asked the right questions — and delivered a building our clients are proud of.", n: "Aisha Patel", r: "Development Director, Fieldway" },
];
function Testimonials() {
  return (
    <section className="section grad-mesh">
      <div className="shell relative">
        <div className="absolute left-0 top-0 hidden h-full lg:block" style={{ writingMode: "vertical-rl" }}>
          <span className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">06 / Testimonials</span>
        </div>
        <div className="grid gap-14 lg:grid-cols-2 lg:pl-16">
          <div>
            <Reveal><span className="eyebrow">What clients say</span></Reveal>
            <Reveal delay={70}><h2 className="display-l mt-5 max-w-[13ch]">Thoughtful work, fast enough to matter.</h2></Reveal>
            <Reveal delay={130}>
              <figure className="mt-14">
                <span className="text-5xl leading-none text-[var(--gold)]">&ldquo;</span>
                <blockquote className="mt-3 max-w-[40ch] text-xl text-[var(--bone)]">Studiodota turned a complex brief into a building our community immediately embraced. The clarity they bring to every decision shows up in the finished space.</blockquote>
                <figcaption className="mt-6"><span className="font-semibold">Maya Chen</span><div className="text-sm text-[var(--muted)]">Co-founder & CEO, Northline</div></figcaption>
              </figure>
            </Reveal>
            <Reveal delay={180}><CTA href="/contact" label="Work with us" variant="ghost" /></Reveal>
          </div>
          <div className="flex flex-col justify-center divide-y divide-[var(--line)] lg:border-l lg:border-[var(--line)] lg:pl-12">
            {rightQuotes.map((t, i) => (
              <Reveal key={t.n} delay={i * 90}>
                <div className="flex items-start gap-6 py-8 first:pt-0">
                  <div className="flex-1">
                    <blockquote className="text-lg text-[var(--bone)]">&ldquo;{t.q}&rdquo;</blockquote>
                    <div className="mt-4"><span className="font-semibold">{t.n}</span><div className="text-sm text-[var(--muted)]">{t.r}</div></div>
                  </div>
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-[var(--surface-2)] font-bold text-[var(--gold)]">{t.n.split(" ").map((w) => w[0]).join("")}</span>
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
const clientsA = ["Deloitte.", "amazon", "Disney", "Microsoft", "accenture", "EY", "TOYOTA", "CISCO"];
const clientsB = ["AIRBUS", "Booking.com", "1stDIBS", "BELMOND", "MUJI", "Olson Kundig", "One&Only", "Artemide"];
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
function Clients() {
  return (
    <section className="section grad-soft">
      <div className="text-center"><Reveal><span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">We work with world&rsquo;s top companies</span></Reveal></div>
      <div className="mt-14 flex flex-col gap-8">
        <MarqueeRow items={clientsA} />
        <MarqueeRow items={clientsB} rev />
      </div>
    </section>
  );
}

/* ---------------- Statement band (image-masked wordmark) ---------------- */
function StatementBand() {
  return (
    <section data-nav-tone="dark" className="relative overflow-hidden rounded-t-[2.5rem] bg-[#111315] py-[clamp(5rem,15vw,11rem)]" style={{ color: "var(--on-media)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(rgba(246,245,242,0.6) 1px, transparent 1px)", backgroundSize: "26px 26px" }} aria-hidden="true" />
      <div className="shell relative text-center">
        <span className="eyebrow" style={{ color: "var(--gold-media)" }}>The practice</span>
        <h2 className="mt-6 font-extrabold leading-[0.84] tracking-[-0.04em]" style={{ fontSize: "clamp(3.2rem, 15vw, 13rem)" }}>
          <ImageMaskText text="STUDIODOTA" image="/media/renders/harbour-masterplan.jpg" />
        </h2>
        <p className="mx-auto mt-8 max-w-[52ch]" style={{ color: "var(--on-media-dim)" }}>
          Buildings shaped with clarity, restraint, and lasting value — guided from the first sketch to the final resolved detail.
        </p>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
const faqs = [
  { q: "What does your studio specialise in?", a: "Architectural design, interior architecture, urban and masterplanning, and renovation — full-service, from concept through construction." },
  { q: "Do you work with early-stage projects?", a: "Yes — from a feasibility study to a fully developed brief, we can start wherever you are." },
  { q: "How long does a typical project take?", a: "It depends on scale — concept design takes weeks, while full projects run through construction over several months. We agree a clear programme up front." },
  { q: "Can you work within our site and planning constraints?", a: "Absolutely. We design around your brief, budget, site conditions, and local planning context." },
  { q: "What do you need from me to get started?", a: "Your brief and goals, the site address or a survey, and any references — we handle the rest." },
];
function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section bg-[var(--ink-2)]">
      <div className="shell grid gap-12 lg:grid-cols-[0.9fr_1.3fr]">
        <div>
          <Reveal><div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" /><span className="uppercase tracking-[0.16em] text-[var(--bone-dim)]">FAQs</span></div></Reveal>
          <Reveal delay={70}><h2 className="display-l mt-5">Frequently asked questions</h2></Reveal>
          <Reveal delay={130}>
            <div className="hover-lift mt-8 card p-8">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--gold)] font-bold text-[var(--ink)]">SD</span>
              <h3 className="display-m mt-6">Book a 15 min call</h3>
              <p className="mt-3 text-sm text-[var(--muted)]">If you have any questions, just book a 15-minute call with us before starting.</p>
              <Link href="/contact" className="btn btn-primary mt-6 w-full justify-center">Book a free call</Link>
            </div>
          </Reveal>
        </div>
        <div className="space-y-4">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={(i % 5) * 50}>
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

/* ---------------- Journals ---------------- */
const journalGrid = [
  { img: "interior", cat: "Interior design & lifestyle", t: "Discover how minimalism enhances not just aesthetics but wellbeing", date: "14 November 2025" },
  { img: "atelier-house", cat: "Sustainability & green building", t: "Our approach to eco-conscious design integrates modern technology and materials", date: "14 November 2025" },
  { img: "meridian-sports", cat: "Design philosophy", t: "Learn how strategic illumination transforms the way we experience space", date: "14 November 2025" },
];
function Journals() {
  return (
    <section className="section">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal><h2 className="display-l max-w-[16ch]">Discover insights, trends, and inspiration.</h2></Reveal>
          <Reveal delay={80}><Link href="/journal" className="group inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 font-semibold" style={{ background: "linear-gradient(120deg,#d0aa72,#a87f3f 55%,#8f6c39)", color: "#17191c" }}>View all <span className="grid h-9 w-9 place-items-center rounded-full bg-[#17191c] text-[#f5f5f3] transition-transform duration-500 group-hover:translate-x-0.5">↗</span></Link></Reveal>
        </div>
        <Reveal className="mt-12">
          <Link href="/journal" className="group grid overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] md:grid-cols-2">
            <div className="relative aspect-[16/11] w-full overflow-hidden"><Image src={R("harbour-masterplan")} alt="" fill sizes="(max-width:768px) 100vw, 50vw" className="img-zoom object-cover" /></div>
            <div className="flex flex-col justify-center p-8 md:p-12">
              <span className="w-max rounded-full bg-[var(--bone)] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink)]">Must read</span>
              <h3 className="display-m mt-6">The rise of boutique architecture in luxury living</h3>
              <p className="mt-4 max-w-[46ch] text-[var(--bone-dim)]">Discover how boutique architecture is redefining luxury living with its focus on uniqueness, personalization, and timeless design.</p>
              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--gold)] text-sm font-bold text-[var(--ink)]">EC</span><div><div className="font-semibold">Emily Chambers</div><div className="text-xs text-[var(--muted)]">Marketing Consultant</div></div></div>
                <span className="rounded-full bg-[var(--gold)] px-4 py-1.5 text-xs font-semibold text-[var(--ink)]">Lifestyle</span>
              </div>
            </div>
          </Link>
        </Reveal>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {journalGrid.map((j, i) => (
            <Reveal key={j.t} delay={(i % 3) * 70}>
              <Link href="/journal" className="group block">
                <div className="relative aspect-[16/11] w-full overflow-hidden rounded-2xl"><Image src={R(j.img)} alt="" fill sizes="(max-width:768px) 100vw, 33vw" className="img-zoom object-cover" /></div>
                <div className="mt-5">
                  <span className="link-underline text-xs uppercase tracking-[0.12em] text-[var(--gold-ink)]">{j.cat}</span>
                  <h4 className="mt-3 text-lg font-medium leading-snug transition-colors duration-300 group-hover:text-[var(--gold)]">{j.t}</h4>
                  <div className="mt-3 text-sm text-[var(--muted)]">{j.date}</div>
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
const ctaLabel = "font-mono text-[0.62rem] uppercase tracking-[0.22em]";
const ctaField =
  "mt-1.5 w-full border-b border-[rgba(246,245,242,0.28)] bg-transparent py-2.5 outline-none transition-colors duration-300 placeholder:text-[rgba(246,245,242,0.35)] focus:border-[var(--gold-media)]";

function FinalCTA() {
  const [sent, setSent] = useState(false);
  return (
    <section data-nav-tone="dark" className="relative overflow-hidden rounded-t-[2.5rem]">
      <div className="absolute inset-0">
        <ParallaxImage src={R("harbour-masterplan")} alt="" sizes="100vw" range={7} className="h-full w-full" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(112deg, rgba(9,10,12,0.93) 10%, rgba(9,10,12,0.6) 52%, rgba(9,10,12,0.84) 100%)" }} aria-hidden="true" />
      </div>
      <div className="shell relative z-10 grid items-center gap-14 py-[clamp(6rem,14vw,11rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-20" style={{ color: "var(--on-media)" }}>
        <div>
          <Reveal><span className="eyebrow" style={{ color: "var(--gold-media)" }}>Get in touch</span></Reveal>
          <Reveal delay={70}><h2 className="display-l mt-6 max-w-[13ch]">Let&rsquo;s build something lasting.</h2></Reveal>
          <Reveal delay={130}>
            <p className="mt-6 max-w-[44ch]" style={{ color: "var(--on-media-dim)" }}>
              Tell us about your site, your brief, or the idea you can&rsquo;t stop thinking about. We reply within one business day.
            </p>
          </Reveal>
          <Reveal delay={190}>
            <div className="mt-10 space-y-2 text-lg">
              <a href="mailto:studio@studiodota.net" className="link-underline block w-max font-semibold">studio@studiodota.net</a>
              <a href="tel:+442000000000" className="link-underline block w-max" style={{ color: "var(--on-media-dim)" }}>+44 20 0000 0000</a>
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
              <form className="space-y-7" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                <div className="grid gap-7 sm:grid-cols-2">
                  <label className="block">
                    <span className={ctaLabel} style={{ color: "var(--on-media-dim)" }}>Your name</span>
                    <input required name="name" autoComplete="name" placeholder="Jane Smith" className={ctaField} />
                  </label>
                  <label className="block">
                    <span className={ctaLabel} style={{ color: "var(--on-media-dim)" }}>Email</span>
                    <input required name="email" type="email" autoComplete="email" placeholder="jane@studio.com" className={ctaField} />
                  </label>
                </div>
                <label className="block">
                  <span className={ctaLabel} style={{ color: "var(--on-media-dim)" }}>Your project</span>
                  <textarea required name="message" rows={4} placeholder="Site, scale, ambitions — anything helps." className={`${ctaField} resize-none`} />
                </label>
                <button type="submit" className="btn btn-grad w-full justify-center">
                  Start the conversation <span className="btn-icon" aria-hidden="true">→</span>
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Sections() {
  return (
    <>
      <About />
      <ServicesSlider />
      <WhyChoose />
      <Featured />
      <Showreel />
      <Process />
      <Timeline />
      <Testimonials />
      <Clients />
      <StatementBand />
      <FAQ />
      <Journals />
      <FinalCTA />
    </>
  );
}
