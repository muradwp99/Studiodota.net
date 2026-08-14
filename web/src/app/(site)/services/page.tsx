import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ScrollHighlightText from "@/components/ScrollHighlightText";
import LineMask from "@/components/motion/LineMask";
import ImageReveal from "@/components/motion/ImageReveal";
import { getBlock } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.services");
  return pageMetadata({ seo: d.seo, title: "Services", description: d.lede, path: "/services" });
}

export default async function ServicesPage() {
  const d = await getBlock("page.services");

  return (
    <>
      <PageHero eyebrow={d.eyebrow} pageName="Services" lede={d.lede} image={d.image} imageAlt="" video="/media/services-hero.mp4" />

      <section className="section">
        <div className="shell">
          <h2 className="display-l max-w-[24ch]">
            <ScrollHighlightText text={d.statement} />
          </h2>
        </div>
      </section>

      {/* Five phases — giant ghost numeral behind the content on the right,
          masked titles, ruled scope lists with hover-interactive rows */}
      {d.items.map((s) => (
        <section key={s.id} id={s.id} className="relative scroll-mt-28 overflow-hidden border-t border-[var(--line)]">
          <div className="shell relative z-10 grid gap-x-16 gap-y-10 py-[clamp(3.5rem,8vw,7rem)] lg:grid-cols-[0.45fr_0.55fr]">
            <div>
              <Reveal>
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--gold-ink)]">Phase {s.num}</span>
              </Reveal>
              <LineMask text={s.title} tag="h3" className="display-m mt-3 max-w-[14ch]" />
              <Reveal delay={120}>
                <p className="mt-5 max-w-[42ch] text-[var(--bone-dim)]">{s.blurb}</p>
              </Reveal>
              <div className="group">
                <ImageReveal
                  src={s.image}
                  alt={`${s.title} - project example`}
                  sizes="(max-width:1024px) 100vw, 42vw"
                  className="mt-10 aspect-[4/3] rounded-2xl"
                  imgClassName="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                  curtain="var(--ink)"
                />
              </div>
            </div>
            <div className="relative lg:pt-6">
              <Reveal>
                <span className="eyebrow">What&apos;s included</span>
              </Reveal>
              <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
                {s.tags.map((t, i) => (
                  <Reveal key={t} delay={Math.min(i * 40, 320)}>
                    <li className="group flex items-baseline gap-3 border-b border-[var(--line)] py-3.5 text-sm text-[var(--bone-dim)] transition-colors duration-300 hover:text-[var(--bone)]">
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full bg-[var(--gold)] transition-transform duration-300 group-hover:scale-150" />
                      <span className="transition-transform duration-300 group-hover:translate-x-1">{t}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
              <Reveal delay={160}>
                <Link href="/contact" className="btn btn-ghost mt-9">
                  Enquire about {s.title.toLowerCase()}
                  <span className="btn-icon" aria-hidden="true">→</span>
                </Link>
              </Reveal>
              {/* Fills the empty space below the CTA - column stretches to
                  match the taller left column's image, so this sits right
                  where that gap actually is. */}
              <Reveal className="pointer-events-none absolute inset-x-0 bottom-[-95px] hidden justify-end sm:flex" from="right" delay={80}>
                <span
                  aria-hidden="true"
                  className="select-none font-extrabold leading-none"
                  style={{ fontSize: "clamp(6rem,16vw,26rem)", color: "#cccccc40" }}
                >
                  {s.num}
                </span>
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      <section className="section border-t border-[var(--line)]">
        <div className="shell text-center">
          <LineMask text={d.ctaTitle} tag="h2" className="display-l mx-auto max-w-[22ch]" />
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
