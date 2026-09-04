import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SplitReveal from "@/components/SplitReveal";
import LineMask from "@/components/motion/LineMask";
import ImageReveal from "@/components/motion/ImageReveal";
import Arcs from "@/components/motion/Arcs";
import BigTitle from "@/components/motion/BigTitle";
import CountUp from "@/components/CountUp";
import { Parallax } from "@/components/Parallax";
import ReplayReveal from "@/components/about/ReplayReveal";
import { getBlock } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.about");
  return pageMetadata({ seo: d.seo, title: d.title, description: d.lede, path: "/about" });
}

export default async function AboutPage() {
  const d = await getBlock("page.about");
  // Closing headline's last word gets the oversized accent treatment below -
  // a generic lead/last split (not hardcoded to specific copy) so it keeps
  // working if the CMS text changes.
  const ctaWords = d.ctaTitle.trim().split(/\s+/);
  const ctaLead = ctaWords.slice(0, -1).join(" ");
  const ctaLast = ctaWords[ctaWords.length - 1];

  return (
    <>
      {/* Typographic hero — giant title against the practice's arc geometry */}
      <header className="relative overflow-hidden pb-16 pt-40 md:pt-56">
        <Arcs className="absolute -right-[24vw] -top-[22vw] w-[70vw] min-w-[480px]" />
        <div className="shell relative">
          <Reveal><span className="eyebrow">{d.eyebrow}</span></Reveal>
          <BigTitle text="Who we are" tag="h1" className="mt-8" />
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
            {/* Curtain-wipe entrance (ImageReveal) plus a continuous scroll
                drift (Parallax) so the render stays alive while you read,
                not just a one-shot fade-in. */}
            <Parallax amount={20} className="mt-10 hidden lg:block">
              <ImageReveal
                src={d.storyImage}
                alt="Studiodot A - residential design study"
                sizes="(max-width:1024px) 100vw, 38vw"
                className="aspect-[4/5] rounded-2xl"
                curtain="var(--ink)"
              />
            </Parallax>
          </div>
          <div className="space-y-7 text-lg leading-relaxed text-[var(--bone-dim)]">
            <Reveal><p>{d.why1}</p></Reveal>
            <Reveal delay={100}><p>{d.why2}</p></Reveal>
            <Parallax amount={16} className="lg:hidden">
              <ImageReveal
                src={d.storyImage}
                alt="Studiodot A - residential design study"
                sizes="100vw"
                className="aspect-[16/10] rounded-2xl"
                curtain="var(--ink)"
              />
            </Parallax>
          </div>
        </div>
      </section>

      {/* Founder quote — dark statement band with the arc motif */}
      <section data-nav-tone="dark" className="relative overflow-hidden bg-[#111315] py-[clamp(5rem,10vw,8rem)]" style={{ color: "var(--on-media)" }}>
        <Arcs className="absolute -left-[16vw] top-1/2 w-[52vw] min-w-[420px] -translate-y-1/2" stroke="rgba(230,203,146,0.28)" />
        <div className="shell relative">
          <Reveal><span className="eyebrow" style={{ color: "var(--gold-media)" }}>{d.quoteLabel}</span></Reveal>
          {/* Measured against the live layout: at top-6/md:top-8 this glyph's
              own line box directly overlapped the eyebrow label above it
              (verified via getBoundingClientRect + Range - a real collision,
              not just a design opinion). Pushed down to clear the eyebrow
              at both breakpoints; it still hangs over the opening of the
              quote paragraph below, which is the intended pull-quote look. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -left-1 top-20 select-none text-[7rem] font-extrabold leading-none opacity-[0.14] md:top-24 md:text-[10rem]"
            style={{ color: "var(--gold-media)" }}
          >
            &ldquo;
          </span>
          <SplitReveal
            text={`"${d.quote}"`}
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

      {/* Real numbers - hairline rules turn four identical floating blocks
          into one ledger/spec-sheet band (only at lg, where they share a
          single row) instead of a generic equal-width stat-card grid. */}
      <section className="border-y border-[var(--line)] bg-[var(--ink-2)]">
        <div className="shell grid gap-10 py-20 sm:grid-cols-2 lg:grid-cols-4">
          {d.stats.map((s, i) => (
            <ReplayReveal
              key={s.label}
              delay={i * 70}
              className={i > 0 ? "lg:border-l lg:border-[var(--line)] lg:pl-10" : ""}
            >
              <div>
                <div className="display-xl font-display">
                  <CountUp end={Number(s.value)} />
                  <span className="text-[var(--gold)]">{s.suffix}</span>
                </div>
                <p className="mt-3 text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
                  {s.label}
                </p>
              </div>
            </ReplayReveal>
          ))}
        </div>
      </section>

      {/* What we do - the three-beat title is the docx's own rhythm, so each
          sentence gets its own line and its own reveal rather than being
          flattened into one paragraph. */}
      <section className="section">
        <div className="shell">
          <Reveal><span className="eyebrow eyebrow-muted">{d.doLabel}</span></Reveal>
          {/* Each sentence is its own line. The measure has to live on the
              heading itself - `ch` on a wrapper resolves against the wrapper's
              body-size font, which crushes a display-scale line to one word
              per row. */}
          <div className="mt-8">
            {d.doTitle.split(/(?<=\.)\s+/).map((line, i) => (
              <LineMask
                key={line}
                text={line}
                tag="h2"
                className={`display-m max-w-[24ch] ${i === 2 ? "text-[var(--gold-ink)]" : ""}`}
                delay={i * 0.12}
              />
            ))}
          </div>
          <div className="mt-14 grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <Reveal>
              <p className="text-lg leading-relaxed text-[var(--bone-dim)]">{d.doIntro}</p>
            </Reveal>
            {/* Numbered rules turn three loose paragraphs into a read you can
                track, echoing the ledger treatment on the stats band above. */}
            <ol className="space-y-8">
              {d.doBody.map((p, i) => (
                <ReplayReveal key={i} delay={i * 90}>
                  <li className="flex gap-6 border-t border-[var(--line)] pt-6">
                    <span aria-hidden="true" className="font-mono text-sm text-[var(--gold)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-lg leading-relaxed text-[var(--bone-dim)]">{p}</p>
                  </li>
                </ReplayReveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Our capabilities - copy against a drifting render, closing on the
          docx's own one-line statement blown up to display scale. */}
      <section className="section border-t border-[var(--line)]">
        <div className="shell grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <Reveal><span className="eyebrow eyebrow-muted">{d.capabilitiesLabel}</span></Reveal>
            <LineMask text={d.capabilitiesTitle} tag="h2" className="display-m mt-8 max-w-[18ch]" />
            <div className="mt-10 space-y-7">
              {d.capabilities.map((p, i) => (
                <Reveal key={i} delay={i * 110}>
                  <p className="text-lg leading-relaxed text-[var(--bone-dim)]">{p}</p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={240}>
              <p className="mt-12 border-l-2 border-[var(--gold)] pl-6 font-display text-2xl leading-snug md:text-[2rem]">
                {d.capabilitiesClose}
              </p>
            </Reveal>
          </div>
          <Parallax amount={24} className="lg:mt-16">
            <ImageReveal
              src={d.capabilitiesImage}
              alt="Studiodot A - mixed-use development study"
              sizes="(max-width:1024px) 100vw, 46vw"
              className="aspect-[4/5] rounded-2xl"
              curtain="var(--ink)"
            />
          </Parallax>
        </div>
      </section>

      {/* Our qualifications - three words, three beats, on the dark band so
          the section lands as a statement rather than more body copy. */}
      <section data-nav-tone="dark" className="relative overflow-hidden bg-[#111315] py-[clamp(5rem,10vw,8rem)]" style={{ color: "var(--on-media)" }}>
        <Arcs className="absolute -right-[18vw] -bottom-[20vw] w-[56vw] min-w-[420px]" stroke="rgba(230,203,146,0.22)" />
        <div className="shell relative">
          <Reveal><span className="eyebrow" style={{ color: "var(--gold-media)" }}>{d.qualificationsLabel}</span></Reveal>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
            {d.qualificationsTitle.split(/\s+/).filter(Boolean).map((word, i) => (
              <SplitReveal
                key={word}
                text={word}
                tag="span"
                className="display-l"
                stagger={0.03}
                delay={i * 0.14}
              />
            ))}
          </div>
          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
            {d.qualifications.map((p, i) => (
              <Reveal key={i} delay={i * 120}>
                <p className="text-lg leading-relaxed" style={{ color: "var(--on-media-dim)" }}>{p}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={280}>
            <p className="mt-14 max-w-[40ch] font-display text-2xl leading-snug md:text-[2.1rem]">
              {d.qualificationsClose}
            </p>
          </Reveal>
        </div>
      </section>

      {/* How we work */}
      <section className="section border-t border-[var(--line)]">
        <div className="shell">
          <LineMask text={d.processTitle} tag="h2" className="display-l max-w-[14ch]" />
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 lg:grid-cols-4">
            {d.process.map((p, i) => (
              <ReplayReveal key={p.step} delay={i * 70} className="h-full">
                <div className="relative flex h-full flex-col overflow-hidden bg-[var(--ink-2)] p-8">
                  {/* Ghost step numeral - services-page phase-numeral treatment,
                      scaled down for a 4-up grid cell. On this narrow column
                      the numeral's box measurably overlaps the title below it
                      (confirmed live: ~100x24px), so the real content is
                      pulled into its own stacking context to guarantee it
                      renders in front - a watermark behind text, not a
                      collision on top of it. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-2 -top-4 select-none font-extrabold leading-none text-[var(--line-strong)]"
                    style={{ fontSize: "clamp(4.5rem,9vw,7rem)" }}
                  >
                    {p.step}
                  </span>
                  <div className="relative z-10">
                    <span className="font-mono text-sm text-[var(--gold)]">{p.step}</span>
                    <h3 className="mt-5 font-display text-xl">{p.title}</h3>
                    <p className="mt-3 text-sm text-[var(--muted)]">{p.body}</p>
                  </div>
                </div>
              </ReplayReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-[var(--line)]">
        <div className="shell text-center">
          {/* Closing beat: one word blown up past the display-l scale for a
              maximalist last-look, in the same spirit as the giant
              page-name titles. */}
          <Reveal>
            <h2 className="display-l mx-auto max-w-[20ch] text-balance">
              {ctaLead}{ctaLead ? " " : ""}
              <span className="text-[var(--gold-ink)]" style={{ fontSize: "1.45em", fontWeight: 800 }}>
                {ctaLast}
              </span>
            </h2>
          </Reveal>
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
