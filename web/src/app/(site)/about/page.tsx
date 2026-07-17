import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { getBlock } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.about");
  return { title: "Studio", description: d.lede };
}

export default async function AboutPage() {
  const d = await getBlock("page.about");

  return (
    <>
      <PageHeader eyebrow={d.eyebrow} title={d.title} lede={d.lede} />

      <section className="section border-t border-[var(--line)]">
        <div className="shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <span className="eyebrow eyebrow-muted">{d.whyLabel}</span>
          </Reveal>
          <Reveal delay={80}>
            <div className="space-y-6 text-lg text-[var(--bone-dim)]">
              <p>{d.why1}</p>
              <p>{d.why2}</p>
            </div>
          </Reveal>
        </div>
      </section>

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

      <section className="section">
        <div className="shell">
          <Reveal>
            <h2 className="display-l max-w-[14ch]">{d.processTitle}</h2>
          </Reveal>
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
          <Reveal>
            <h2 className="display-l mx-auto max-w-[20ch]">{d.ctaTitle}</h2>
          </Reveal>
          <Reveal delay={90}>
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
