import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SplitReveal from "@/components/SplitReveal";
import LineMask from "@/components/motion/LineMask";
import ImageReveal from "@/components/motion/ImageReveal";
import Arcs from "@/components/motion/Arcs";
import { getBlock } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.about");
  return pageMetadata({ seo: d.seo, title: "Who we are", description: d.lede, path: "/about" });
}

export default async function AboutPage() {
  const d = await getBlock("page.about");

  return (
    <>
      {/* Typographic hero — giant title against the practice's arc geometry */}
      <header className="relative overflow-hidden pb-16 pt-40 md:pt-56">
        <Arcs className="absolute -right-[24vw] -top-[22vw] w-[70vw] min-w-[480px]" />
        <div className="shell relative">
          <Reveal><span className="eyebrow">{d.eyebrow}</span></Reveal>
          <LineMask text={d.title} tag="h1" className="display-2xl mt-8 max-w-[15ch]" delay={0.08} />
          <Reveal delay={260}>
            <p className="lede mt-8 max-w-[56ch]">{d.lede}</p>
          </Reveal>
        </div>
      </header>

      {/* The story — docx paragraphs beside a flagship render */}
      <section className="section border-t border-[var(--line)]">
        <div className="shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Reveal><span className="eyebrow eyebrow-muted">{d.whyLabel}</span></Reveal>
            <ImageReveal
              src={d.storyImage}
              alt="Studiodot A - residential design study"
              sizes="(max-width:1024px) 100vw, 38vw"
              className="mt-10 hidden aspect-[4/5] rounded-2xl lg:block"
              curtain="var(--ink)"
            />
          </div>
          <div className="space-y-7 text-lg leading-relaxed text-[var(--bone-dim)]">
            <Reveal><p>{d.why1}</p></Reveal>
            <Reveal delay={100}><p>{d.why2}</p></Reveal>
            <ImageReveal
              src={d.storyImage}
              alt="Studiodot A - residential design study"
              sizes="100vw"
              className="aspect-[16/10] rounded-2xl lg:hidden"
              curtain="var(--ink)"
            />
          </div>
        </div>
      </section>

      {/* Founder quote — dark statement band with the arc motif */}
      <section data-nav-tone="dark" className="relative overflow-hidden bg-[#111315] py-[clamp(5rem,10vw,8rem)]" style={{ color: "var(--on-media)" }}>
        <Arcs className="absolute -left-[16vw] top-1/2 w-[52vw] min-w-[420px] -translate-y-1/2" stroke="rgba(230,203,146,0.28)" />
        <div className="shell relative">
          <Reveal><span className="eyebrow" style={{ color: "var(--gold-media)" }}>{d.quoteLabel}</span></Reveal>
          <SplitReveal
            text={`“${d.quote}”`}
            tag="p"
            className="mt-9 max-w-[46ch] text-xl font-medium leading-snug md:text-[1.7rem]"
            stagger={0.018}
          />
          <Reveal delay={200}>
            <footer className="mt-9">
              <div className="font-semibold">{d.quoteName}</div>
              <div className="mt-1 text-sm" style={{ color: "var(--on-media-dim)" }}>{d.quoteRole}</div>
            </footer>
          </Reveal>
        </div>
      </section>

      {/* Real numbers */}
      <section className="border-y border-[var(--line)] bg-[var(--ink-2)]">
        <div className="shell grid gap-10 py-20 sm:grid-cols-2 lg:grid-cols-4">
          {d.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 70}>
              <div>
                <div className="display-l font-display">
                  {s.value}
                  <span className="text-[var(--gold)]">{s.suffix}</span>
                </div>
                <p className="mt-3 text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
                  {s.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How we work */}
      <section className="section">
        <div className="shell">
          <LineMask text={d.processTitle} tag="h2" className="display-l max-w-[14ch]" />
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 lg:grid-cols-4">
            {d.process.map((p, i) => (
              <Reveal key={p.step} delay={i * 70} className="h-full">
                <div className="flex h-full flex-col bg-[var(--ink-2)] p-8">
                  <span className="font-mono text-sm text-[var(--gold)]">{p.step}</span>
                  <h3 className="mt-5 font-display text-xl">{p.title}</h3>
                  <p className="mt-3 text-sm text-[var(--muted)]">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-[var(--line)]">
        <div className="shell text-center">
          <LineMask text={d.ctaTitle} tag="h2" className="display-l mx-auto max-w-[20ch]" />
          <Reveal delay={120}>
            <Link href="/contact" className="btn btn-primary mt-8">
              {d.ctaLabel}
              <span className="btn-icon" aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
