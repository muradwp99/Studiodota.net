import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ScrollHighlightText from "@/components/ScrollHighlightText";
import { ParallaxImage } from "@/components/Parallax";
import { getBlock } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.services");
  return { title: "Services", description: d.lede };
}

export default async function ServicesPage() {
  const d = await getBlock("page.services");

  return (
    <>
      <PageHero eyebrow={d.eyebrow} title={d.title} lede={d.lede} image={d.image} imageAlt="" />

      <section className="section">
        <div className="shell">
          <h2 className="display-l max-w-[24ch]">
            <ScrollHighlightText text={d.statement} />
          </h2>
        </div>
      </section>

      {d.items.map((s, i) => {
        const imgLeft = i % 2 === 0;
        return (
          <section
            key={s.id}
            id={s.id}
            className="scroll-mt-28 border-t border-[var(--line)] py-[clamp(3.5rem,8vw,7rem)]"
          >
            <div className="shell grid items-center gap-10 md:grid-cols-2 lg:gap-16">
              <Reveal className={imgLeft ? "" : "md:order-2"}>
                <ParallaxImage
                  src={s.image}
                  alt={`${s.title} — example project`}
                  sizes="(max-width:768px) 100vw, 48vw"
                  range={8}
                  className="aspect-[4/3] w-full rounded-2xl"
                />
              </Reveal>
              <Reveal delay={90} className={imgLeft ? "" : "md:order-1"}>
                <div>
                  <h3 className="display-m">{s.title}</h3>
                  <p className="mt-5 max-w-[46ch] text-[var(--bone-dim)]">{s.detail}</p>
                  <p className="mt-3 max-w-[46ch] text-sm text-[var(--muted)]">{s.blurb}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 text-xs uppercase tracking-[0.08em] text-[var(--bone-dim)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <Link href="/contact" className="btn btn-ghost mt-8">
                    Enquire about {s.title.toLowerCase()}
                    <span className="btn-icon" aria-hidden="true">→</span>
                  </Link>
                </div>
              </Reveal>
            </div>
          </section>
        );
      })}

      <section className="section">
        <div className="shell text-center">
          <Reveal>
            <h2 className="display-l mx-auto max-w-[18ch]">{d.ctaTitle}</h2>
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
