import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { stats, process } from "@/content/site";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Studiodota is an architectural 3D-rendering studio. We present projects before they are built — accurate, cinematic, and on time.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="The studio"
        title="An architecture practice built on clarity."
        lede="Studiodota is a team of architects and designers turning briefs, sites, and ambitions into buildings — considered, durable, and made for the people who use them."
      />

      <section className="section border-t border-[var(--line)]">
        <div className="shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <span className="eyebrow eyebrow-muted">Why we exist</span>
          </Reveal>
          <Reveal delay={80}>
            <div className="space-y-6 text-lg text-[var(--bone-dim)]">
              <p>
                Good architecture is quiet. It resolves the real problems —
                light, space, movement, cost, climate — without shouting about
                it. That restraint is where lasting value comes from.
              </p>
              <p>
                We work across scales, from private homes to civic and mixed-use
                schemes, leading each project from first sketch through
                construction. Accurate, collaborative, and dependable.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--ink-2)]">
        <div className="shell grid gap-10 py-20 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
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
            <h2 className="display-l max-w-[14ch]">How we work.</h2>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 lg:grid-cols-4">
            {process.map((p, i) => (
              <Reveal key={p.step} delay={i * 70} className="h-full">
                <div className="flex h-full flex-col bg-[var(--ink-2)] p-8">
                  <span className="font-mono text-sm text-[var(--gold)]">
                    {p.step}
                  </span>
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
            <h2 className="display-l mx-auto max-w-[20ch]">
              Let&rsquo;s build something that lasts.
            </h2>
          </Reveal>
          <Reveal delay={90}>
            <Link href="/contact" className="btn btn-primary mt-8">
              Get a quote
              <span className="btn-icon" aria-hidden="true">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
