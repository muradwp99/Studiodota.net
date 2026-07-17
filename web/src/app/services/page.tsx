import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ScrollHighlightText from "@/components/ScrollHighlightText";
import { ParallaxImage } from "@/components/Parallax";
import { services } from "@/content/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Architectural design, interior architecture, urban & masterplanning, renovation, landscape, and sustainability — every stage of your project, from first sketch to handover.",
};

const R = (n: string) => `/media/renders/${n}.jpg`;

const serviceImage: Record<string, string> = {
  architecture: "atelier-house",
  interior: "interior",
  urban: "harbour-masterplan",
  renovation: "riverside-warehouse",
  landscape: "leafy-precinct",
  sustainability: "meridian-sports",
};

const serviceTags: Record<string, string[]> = {
  architecture: ["Concept", "Planning", "Technical design", "Delivery"],
  interior: ["Space planning", "Materials", "Lighting", "FF&E"],
  urban: ["Zoning", "Public realm", "Phasing", "Density"],
  renovation: ["Assessment", "Heritage", "Retrofit", "Delivery"],
  landscape: ["Courtyards", "Ecology", "Climate", "Public grounds"],
  sustainability: ["Passive design", "Embodied carbon", "Performance", "Certification"],
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="What we do"
        title="Every discipline your project needs."
        lede="From first sketch through to handover — one practice covering every stage of architecture and design for private and commercial clients."
        image={R("harbour-masterplan")}
        imageAlt="Harbour Quarter masterplan render"
      />

      <section className="section">
        <div className="shell">
          <h2 className="display-l max-w-[24ch]">
            <ScrollHighlightText text="Six disciplines, one continuous practice — so nothing is lost between concept and completion." />
          </h2>
        </div>
      </section>

      {services.map((s, i) => {
        const imgLeft = i % 2 === 0;
        return (
          <section
            key={s.id}
            id={s.id}
            className="scroll-mt-28 border-t border-[var(--line)] py-[clamp(3.5rem,8vw,7rem)]"
          >
            <div className="shell grid items-center gap-10 md:grid-cols-2 lg:gap-16">
              <Reveal from={imgLeft ? "left" : "right"} className={imgLeft ? "" : "md:order-2"}>
                <ParallaxImage
                  src={R(serviceImage[s.id] ?? "hero")}
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
                    {(serviceTags[s.id] ?? []).map((t) => (
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
            <h2 className="display-l mx-auto max-w-[18ch]">Not sure which you need? Start with a vision.</h2>
          </Reveal>
          <Reveal delay={90}>
            <Link href="/contact" className="btn btn-primary mt-8">
              Get a quote
              <span className="btn-icon" aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
