import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import LineMask from "@/components/motion/LineMask";
import BigTitle from "@/components/motion/BigTitle";
import Arcs from "@/components/motion/Arcs";
import ImageReveal from "@/components/motion/ImageReveal";
import { Parallax } from "@/components/Parallax";
import VoiceWall from "@/components/testimonials/VoiceWall";
import VideoTestimonial from "@/components/testimonials/VideoTestimonial";
import { getBlock } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.clientVoices");
  return pageMetadata({ seo: d.seo, title: d.title, description: d.lede, path: "/client-voices" });
}

export default async function ClientVoicesPage() {
  const d = await getBlock("page.clientVoices");

  return (
    <>
      {/* Typographic hero, matching the Who we are page's opening beat. */}
      <header className="relative overflow-hidden pb-16 pt-40 md:pt-56">
        <Arcs className="absolute -right-[24vw] -top-[22vw] w-[70vw] min-w-[480px]" />
        <div className="shell relative">
          <Reveal><span className="eyebrow">{d.eyebrow}</span></Reveal>
          <BigTitle text="Client Voices" tag="h1" className="mt-8" />
          <Reveal delay={260}>
            <p className="lede mt-8 max-w-[62ch]">{d.lede}</p>
          </Reveal>
        </div>
      </header>

      {/* The two long-form letters, each given its own full-width stage. */}
      <section className="section border-t border-[var(--line)]">
        <div className="shell space-y-20 md:space-y-28">
          {/* An entry whose transcript hasn't landed yet is skipped rather
              than rendered as a name over an empty quote. */}
          {d.featured.filter((f) => f.paragraphs.length > 0).map((f, i) => (
            <article
              key={f.name}
              className="grid gap-10 border-t border-[var(--line)] pt-12 lg:grid-cols-[0.32fr_0.68fr] lg:gap-16"
            >
              <Reveal delay={i * 60}>
                <div className="lg:sticky lg:top-32">
                  <span
                    aria-hidden="true"
                    className="block select-none font-display text-[4.5rem] font-extrabold leading-none text-[var(--gold)] opacity-[0.22]"
                  >
                    &ldquo;
                  </span>
                  <div className="mt-4 font-display text-2xl">{f.name}</div>
                  <div className="mt-2 max-w-[26ch] text-sm text-[var(--muted)]">{f.role}</div>
                </div>
              </Reveal>
              <div className="space-y-6 text-lg leading-relaxed text-[var(--bone-dim)] md:text-xl md:leading-relaxed">
                {f.paragraphs.map((p, j) => (
                  <Reveal key={j} delay={j * 90}>
                    <p>{p}</p>
                  </Reveal>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Video testimonial - click to play with sound, through the same
          lightbox the showreel and gallery use. */}
      {d.video?.mp4 ? (
        <section data-nav-tone="dark" className="relative overflow-hidden bg-[#111315] py-[clamp(4rem,9vw,7rem)]" style={{ color: "var(--on-media)" }}>
          <Arcs className="absolute -left-[16vw] top-1/2 w-[52vw] min-w-[420px] -translate-y-1/2" stroke="rgba(230,203,146,0.28)" />
          <div className="shell relative">
            <Reveal><span className="eyebrow" style={{ color: "var(--gold-media)" }}>{d.videoLabel}</span></Reveal>
            <VideoTestimonial
              mp4={d.video.mp4}
              poster={d.video.poster}
              name={d.video.name}
              role={d.video.role}
              caption={d.video.caption}
            />
          </div>
        </section>
      ) : null}

      {/* The shorter notes, as a masonry-ish wall that reveals on scroll. */}
      <section className="section">
        <div className="shell">
          <LineMask text="More from our clients." tag="h2" className="display-l max-w-[16ch]" />
          <VoiceWall items={d.items} />
        </div>
      </section>

      {/* A single project render to close the page on the work itself. */}
      {d.heroImage ? (
        <section className="border-t border-[var(--line)]">
          <Parallax amount={22}>
            <ImageReveal
              src={d.heroImage}
              alt="Studiodot A - completed multifamily project"
              sizes="100vw"
              className="aspect-[16/9] md:aspect-[21/9]"
              curtain="var(--ink)"
            />
          </Parallax>
        </section>
      ) : null}

      <section className="section border-t border-[var(--line)]">
        <div className="shell text-center">
          <Reveal>
            <h2 className="display-l mx-auto max-w-[20ch] text-balance">{d.ctaTitle}</h2>
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
