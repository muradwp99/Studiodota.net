"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "@/components/Reveal";

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
            <Reveal delay={70}><h2 className="display-l mt-10 max-w-[16ch]">Architecture that stands for clarity and purpose.</h2></Reveal>
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

/* ---------------- Services (stacked cards, slide from right) ---------------- */
const servicesData = [
  { n: "01", title: "Architectural Design", sub: "Full-service design from first concept to completed building.", tags: ["Concept", "Space planning", "Detailing"], img: "atelier-house" },
  { n: "02", title: "Interior Architecture", sub: "Interiors resolved through light, material, and how people move.", tags: ["Materials", "Lighting", "Layout"], img: "interior" },
  { n: "03", title: "Urban & Masterplanning", sub: "Precincts and public realm planned for the way communities live.", tags: ["Zoning", "Public realm", "Phasing"], img: "harbour-masterplan" },
  { n: "04", title: "Renovation & Restoration", sub: "New life for existing and heritage structures, handled with care.", tags: ["Assessment", "Heritage", "Delivery"], img: "riverside-warehouse" },
];
function Services() {
  return (
    <section className="section grad-warm" id="services">
      <div className="shell">
        <Reveal>
          <div className="flex items-center justify-center gap-3">
            <span className="text-[var(--gold)]">✦</span>
            <span className="font-bold uppercase tracking-[0.2em]">Our Service</span>
          </div>
        </Reveal>
        <div className="mt-14 space-y-8">
          {servicesData.map((s, i) => {
            const imgLeft = i % 2 === 0;
            return (
              <Reveal key={s.n} from={imgLeft ? "right" : "left"}>
                <div className="card-grad group relative overflow-hidden p-6 md:p-10">
                  <div className="pointer-events-none absolute inset-0 pattern-dots opacity-70" aria-hidden="true" />
                  <div
                    className="pointer-events-none absolute inset-0"
                    aria-hidden="true"
                    style={{ background: imgLeft ? "radial-gradient(55% 120% at 100% 0%, rgba(176,137,78,0.12), transparent 55%)" : "radial-gradient(55% 120% at 0% 0%, rgba(176,137,78,0.12), transparent 55%)" }}
                  />
                  <div className="relative grid items-center gap-8 md:grid-cols-2">
                    <div className={imgLeft ? "md:order-1" : "md:order-2"}>
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                        <Image src={R(s.img)} alt={s.title} fill sizes="(max-width:768px) 100vw, 45vw" className="img-zoom object-cover" />
                      </div>
                    </div>
                    <div className={imgLeft ? "md:order-2" : "md:order-1"}>
                      <span className="font-mono text-sm text-[var(--gold-ink)]">{s.n}</span>
                      <h3 className="display-m mt-3">{s.title}</h3>
                      <p className="mt-3 max-w-[40ch] text-[var(--bone-dim)]">{s.sub}</p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        {s.tags.map((t) => (
                          <span key={t} className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 text-xs uppercase tracking-[0.08em] text-[var(--bone-dim)] transition-colors duration-300 hover:border-[var(--gold)] hover:text-[var(--gold-ink)]">{t}</span>
                        ))}
                      </div>
                      <Link href="/services" className="group/btn mt-7 inline-flex items-center gap-3 font-semibold uppercase tracking-[0.1em]">
                        View detail <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--gold)] text-[var(--ink)] transition-transform duration-500 group-hover/btn:translate-x-1">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
        <CTA href="/services" label="View all services" center />
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

/* ---------------- Featured: Inside, Outside (filter tabs) ---------------- */
const gallery = [
  { id: "trellis", name: "Trellis", label: "Multi-residential", cat: "Living", img: "atelier-house" },
  { id: "claremont", name: "The Claremont Hotel", label: "Hotels & hospitality", cat: "Playing", img: "interior" },
  { id: "seaglass", name: "Sea Glass", label: "Multi-residential", cat: "Living", img: "urban-oasis" },
  { id: "dune", name: "Dune", label: "Multi-residential", cat: "Living", img: "leafy-precinct" },
  { id: "bankst", name: "Bank Street", label: "Build to rent", cat: "Working", img: "riverside-warehouse" },
  { id: "meridian", name: "Meridian Centre", label: "Sport & civic", cat: "Playing", img: "meridian-sports" },
  { id: "harbour", name: "Harbour Quarter", label: "Masterplan", cat: "Working", img: "harbour-masterplan" },
];
const tabs = ["All", "Living", "Playing", "Working"] as const;
function Featured() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const items = gallery.filter((g) => tab === "All" || g.cat === tab);
  return (
    <section className="section bg-[var(--ink-2)] pattern-grid">
      <div className="shell">
        <Reveal><h2 className="display-l text-center">Inside, <span className="text-[var(--muted)]">Outside</span></h2></Reveal>

        <div className="mt-6 flex flex-wrap justify-center gap-2 lg:hidden">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-4 py-2 text-sm transition-colors ${tab === t ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--line-strong)] text-[var(--bone-dim)]"}`}>{t}</button>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto]">
          <motion.div layout className="grid auto-rows-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {items.map((g, i) => {
                const tall = tab === "All" && i === 0;
                return (
                  <motion.div key={g.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className={tall ? "lg:row-span-2" : ""}>
                    <Link href="/projects" className="group block h-full">
                      <div className={`relative w-full overflow-hidden rounded-xl ${tall ? "h-full min-h-[320px]" : "aspect-[4/3]"}`}>
                        <Image src={R(g.img)} alt={g.name} fill sizes="(max-width:1024px) 100vw, 33vw" className="img-zoom object-cover" />
                      </div>
                      <div className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{g.label}</div>
                      <div className="text-xl font-medium transition-colors duration-300 group-hover:text-[var(--gold)]">{g.name}</div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          <div className="hidden flex-col gap-3 lg:flex">
            {tabs.map((t) => {
              const on = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex w-16 flex-1 items-center justify-center rounded-full border text-sm transition-all duration-300 hover:scale-[1.04]"
                  style={{
                    writingMode: "vertical-rl",
                    letterSpacing: "0.16em",
                    minHeight: "104px",
                    background: on ? "linear-gradient(180deg,#d0aa72,#8f6c39)" : "transparent",
                    color: on ? "#17191c" : "var(--bone-dim)",
                    borderColor: on ? "transparent" : "var(--line-strong)",
                    fontWeight: on ? 700 : 500,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
        <CTA href="/projects" label="View all projects" center />
      </div>
    </section>
  );
}

/* ---------------- Showreel ---------------- */
const reel = [
  { img: "atelier-house", t: "Atelier House", k: "Residential" },
  { img: "interior", t: "Studio Vale", k: "Interior" },
  { img: "meridian-sports", t: "Meridian", k: "Civic" },
  { img: "urban-oasis", t: "Urban Oasis", k: "Residential" },
  { img: "harbour-masterplan", t: "Harbour Quarter", k: "Masterplan" },
];
function Showreel() {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
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
  }, [playing]);
  return (
    <section ref={wrap} className="relative" style={{ height: `${reel.length * 40}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="shell w-full">
          <div className="flex items-end justify-between">
            <span className="eyebrow">Showreel</span>
            <Link href="/projects" className="link-underline hidden text-sm font-semibold text-[var(--gold-ink)] sm:inline-block">Explore the gallery →</Link>
          </div>
          <div className="relative mt-8">
            <div className="flex h-[64vh] min-h-[380px] items-stretch gap-3">
            {reel.map((r, i) => {
              const isActive = i === active;
              return (
                <button key={r.img} onClick={() => setActive(i)}
                  className="group relative overflow-hidden rounded-2xl transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ flex: isActive ? "1 1 58%" : "1 1 11%", opacity: isActive ? 1 : 0.55, filter: isActive ? "none" : "grayscale(0.9)" }}
                  aria-label={r.t}>
                  <Image src={R(r.img)} alt={r.t} fill sizes="60vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                  {isActive && (
                    <>
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,19,21,0.8), transparent 55%)" }} />
                      <span onClick={(e) => { e.stopPropagation(); setPlaying(true); }} className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[rgba(255,255,255,0.16)] text-xl backdrop-blur transition-transform duration-500 hover:scale-110" style={{ color: "var(--on-media)" }}>▶</span>
                      <div className="absolute inset-x-0 bottom-0 p-6" style={{ color: "var(--on-media)" }}>
                        <div className="font-mono text-sm tracking-[0.25em]">{r.t.toUpperCase()}</div>
                        <div className="mt-1 font-mono text-xs tracking-[0.25em]" style={{ color: "var(--on-media-dim)" }}>{r.k.toUpperCase()} — 2026</div>
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {playing && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4 }} className="absolute inset-0 z-20 overflow-hidden rounded-2xl bg-black">
                <video className="h-full w-full object-cover" autoPlay muted loop playsInline poster={R(reel[active].img)}><source src="/media/hero-loop.mp4" type="video/mp4" /></video>
                <button onClick={() => setPlaying(false)} aria-label="Close" className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-[rgba(255,255,255,0.16)] text-lg backdrop-blur transition-transform duration-300 hover:scale-110" style={{ color: "var(--on-media)" }}>✕</button>
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
  useEffect(() => {
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
  }, []);
  const cur = timeline[idx];
  const fill = (idx / (timeline.length - 1)) * 100;
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

/* ---------------- Get in touch ---------------- */
function FinalCTA() {
  const [sent, setSent] = useState(false);
  return (
    <section className="section">
      <div className="shell">
        <div className="relative grid overflow-hidden rounded-3xl border border-[var(--line)] md:grid-cols-2" style={{ background: "radial-gradient(85% 130% at 100% 0%, rgba(176,137,78,0.12), transparent 55%), var(--surface)" }}>
          <div className="relative min-h-[280px]">
            <Image src={R("meridian-sports")} alt="" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(17,19,21,0.15), rgba(17,19,21,0.5))" }} />
            <div className="absolute bottom-8 left-8 max-w-[16ch]" style={{ color: "var(--on-media)" }}>
              <div className="font-mono text-sm uppercase tracking-[0.2em]" style={{ color: "var(--on-media-dim)" }}>Let&rsquo;s build</div>
              <div className="mt-2 text-3xl font-extrabold leading-tight">Dream big, <span style={{ color: "var(--gold-media)" }}>build bigger.</span></div>
            </div>
          </div>
          <div className="p-10 md:p-14">
            <Reveal><span className="eyebrow">Get in touch</span></Reveal>
            <Reveal delay={70}><h2 className="display-m mt-4 max-w-[18ch]">Your architectural odyssey starts here.</h2></Reveal>
            {sent ? (
              <p className="mt-8 text-[var(--bone-dim)]">Thank you — we&rsquo;ll be in touch within one business day.</p>
            ) : (
              <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input required placeholder="Your name" className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ink-2)] px-4 py-3 outline-none transition-colors duration-300 placeholder:text-[var(--muted)] focus:border-[var(--gold)]" />
                  <input required type="email" placeholder="Email address" className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ink-2)] px-4 py-3 outline-none transition-colors duration-300 placeholder:text-[var(--muted)] focus:border-[var(--gold)]" />
                </div>
                <textarea required rows={3} placeholder="Tell us about your project" className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ink-2)] px-4 py-3 outline-none transition-colors duration-300 placeholder:text-[var(--muted)] focus:border-[var(--gold)]" />
                <button type="submit" className="btn btn-primary">Get in touch <span className="btn-icon" aria-hidden="true">→</span></button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Sections() {
  return (
    <>
      <About />
      <Services />
      <WhyChoose />
      <Featured />
      <Showreel />
      <Process />
      <Timeline />
      <Testimonials />
      <Clients />
      <FAQ />
      <Journals />
      <FinalCTA />
    </>
  );
}
