import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ProjectCard from "@/components/ProjectCard";
import {
  services,
  projects,
  outcomes,
  stats,
  process,
  testimonials,
} from "@/content/site";

export default function HomeSections() {
  return (
    <>
      {/* Statement */}
      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <Reveal>
            <span className="eyebrow">Architectural visuals that win confidence</span>
          </Reveal>
          <Reveal delay={80}>
            <p className="display-m text-[var(--bone)]">
              We turn plans, drawings, and design direction into precise 3D
              models, realistic materials, and atmospheric light — visuals ready
              for presentations, approvals, and marketing.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Services */}
      <section className="section border-t border-[var(--line)]">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal>
                <span className="eyebrow eyebrow-muted">What we do</span>
              </Reveal>
              <Reveal delay={60}>
                <h2 className="display-l mt-4 max-w-[16ch]">
                  Every visual your project needs.
                </h2>
              </Reveal>
            </div>
            <Reveal delay={120}>
              <Link href="/services" className="btn btn-ghost">
                View all services
                <span className="btn-icon" aria-hidden="true">
                  →
                </span>
              </Link>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 80}>
                <Link href={`/services#${s.id}`} className="group block h-full">
                  <div className="bezel h-full">
                    <div className="bezel-core flex h-full flex-col p-7">
                      <span className="font-mono text-xs text-[var(--gold)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-5 font-display text-2xl leading-tight">
                        {s.title}
                      </h3>
                      <p className="mt-3 flex-1 text-sm text-[var(--muted)]">
                        {s.blurb}
                      </p>
                      <span className="mt-6 flex items-center gap-2 text-sm text-[var(--bone-dim)] transition-colors duration-300 group-hover:text-[var(--gold)]">
                        See our work
                        <span className="transition-transform duration-500 group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Work */}
      <section className="section border-t border-[var(--line)]">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal>
                <span className="eyebrow eyebrow-muted">Selected work</span>
              </Reveal>
              <Reveal delay={60}>
                <h2 className="display-l mt-4 max-w-[18ch]">
                  Projects that speak for themselves.
                </h2>
              </Reveal>
            </div>
            <Reveal delay={120}>
              <p className="max-w-[26ch] text-sm text-[var(--muted)]">
                Over 400 projects delivered across residential, commercial, and
                institutional sectors.
              </p>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {projects.slice(0, 4).map((p, i) => (
              <Reveal key={p.slug} delay={(i % 2) * 90}>
                <ProjectCard project={p} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12">
            <Link href="/projects" className="btn btn-ghost">
              View all our work
              <span className="btn-icon" aria-hidden="true">
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Cinematic full-bleed band (Loft) */}
      <section className="relative h-[80vh] min-h-[500px] w-full overflow-hidden">
        <Image
          src="/media/renders/hero.jpg"
          alt="Cinematic architectural render at dawn above a sea of cloud"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(10,12,12,0.92), transparent 45%, rgba(10,12,12,0.45))",
          }}
        />
        <div className="absolute inset-0 flex items-end pb-16 md:pb-24">
          <div className="shell">
            <Reveal>
              <span className="eyebrow">Photoreal, decision-grade</span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="display-l mt-4 max-w-[20ch]">
                Renders your committee can approve on sight.
              </h2>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="section border-t border-[var(--line)]">
        <div className="shell">
          <Reveal>
            <h2 className="display-l max-w-[20ch]">
              Stop losing bids to better-presented competitors.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
            {outcomes.map((o, i) => (
              <Reveal key={o.no} delay={i * 90} className="h-full">
                <div className="flex h-full flex-col bg-[var(--ink-2)] p-9">
                  <span className="font-mono text-sm text-[var(--gold)]">
                    {o.no} / Outcome
                  </span>
                  <h3 className="mt-6 font-display text-2xl leading-tight">
                    {o.title}
                  </h3>
                  <p className="mt-4 text-sm text-[var(--muted)]">{o.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[var(--line)] bg-[var(--ink-2)]">
        <div className="shell grid gap-10 py-20 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 70}>
              <div>
                <div className="display-l font-display text-[var(--bone)]">
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

      {/* Process */}
      <section className="section">
        <div className="shell">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <Reveal>
              <div className="lg:sticky lg:top-28">
                <span className="eyebrow eyebrow-muted">How it works</span>
                <h2 className="display-l mt-4 max-w-[12ch]">Start with a vision.</h2>
                <p className="lede mt-6">
                  Share your plans, references, or design direction. We handle
                  the rest — from model to polished, export-ready visuals.
                </p>
              </div>
            </Reveal>
            <div className="divide-y divide-[var(--line)]">
              {process.map((p, i) => (
                <Reveal key={p.step} delay={i * 70}>
                  <div className="flex gap-7 py-8">
                    <span className="font-mono text-sm text-[var(--gold)]">
                      {p.step}
                    </span>
                    <div>
                      <h3 className="font-display text-2xl leading-tight">
                        {p.title}
                      </h3>
                      <p className="mt-3 text-sm text-[var(--muted)]">{p.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section border-t border-[var(--line)]">
        <div className="shell">
          <Reveal>
            <span className="eyebrow eyebrow-muted">Client testimonials</span>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 90} className="h-full">
                <figure className="bezel h-full">
                  <div className="bezel-core flex h-full flex-col p-8">
                    <span className="font-display text-4xl leading-none text-[var(--gold)]">
                      &ldquo;
                    </span>
                    <blockquote className="mt-4 flex-1 text-[0.98rem] leading-relaxed text-[var(--bone-dim)]">
                      {t.quote}
                    </blockquote>
                    <figcaption className="mt-6 border-t border-[var(--line)] pt-5">
                      <div className="text-sm text-[var(--bone)]">{t.name}</div>
                      <div className="text-xs text-[var(--muted)]">{t.org}</div>
                    </figcaption>
                  </div>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Wordmark band — image-filled type (Find / Loft) */}
      <section className="section overflow-hidden border-t border-[var(--line)]">
        <div className="shell text-center">
          <Reveal>
            <span className="eyebrow eyebrow-muted">From concept to render</span>
          </Reveal>
          <Reveal delay={80}>
            <div
              className="clip-word mt-8"
              style={{ fontSize: "clamp(3rem, 15vw, 13rem)" }}
            >
              STUDIODOTA
            </div>
          </Reveal>
          <Reveal delay={140}>
            <p className="lede mx-auto mt-8 text-center">
              We turn drawings into decisions — the studio behind visuals that
              win the room.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-9 flex flex-wrap justify-center gap-x-7 gap-y-2 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--muted)]">
              {["Photoreal CGI", "3D Animation", "360° Tours", "VR & AR", "Product Viz"].map(
                (t, i) => (
                  <span key={t} className="flex items-center gap-7">
                    {i > 0 && <span className="text-[var(--gold)]">/</span>}
                    {t}
                  </span>
                )
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="shell">
          <div className="bezel">
            <div className="bezel-core relative overflow-hidden px-8 py-20 text-center sm:px-16">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(60% 80% at 50% 0%, rgba(201,169,106,0.18), transparent 70%)",
                }}
              />
              <div className="relative">
                <Reveal>
                  <h2 className="display-l mx-auto max-w-[20ch]">
                    Let&rsquo;s present your project before it&rsquo;s built.
                  </h2>
                </Reveal>
                <Reveal delay={90}>
                  <p className="lede mx-auto mt-6 text-center">
                    Share your plans and get a quote. Precise models, real
                    materials, and light that sells the vision.
                  </p>
                </Reveal>
                <Reveal delay={150}>
                  <div className="mt-9 flex flex-wrap justify-center gap-3">
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
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
