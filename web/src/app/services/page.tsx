import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import { services } from "@/content/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Architectural design, interior architecture, urban & masterplanning, renovation, landscape, and sustainability — every stage of your project.",
};

const serviceImage: Record<string, string> = {
  architecture: "atelier-house",
  interior: "interior",
  urban: "harbour-masterplan",
  renovation: "riverside-warehouse",
  landscape: "leafy-precinct",
  sustainability: "meridian-sports",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="What we do"
        title="Every discipline your project needs."
        lede="From first sketch through to handover — one practice covering every stage of architecture and design for private and commercial clients."
      />

      <div className="shell">
        {services.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            className="grid scroll-mt-28 items-center gap-10 border-t border-[var(--line)] py-16 md:grid-cols-2 lg:gap-16"
          >
            <Reveal className={i % 2 === 1 ? "md:order-2" : ""}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[var(--line)]">
                <Image
                  src={`/media/renders/${serviceImage[s.id] ?? "hero"}.jpg`}
                  alt={`${s.title} — example render`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <span className="absolute left-5 top-5 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-[var(--bone)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </Reveal>
            <Reveal delay={90} className={i % 2 === 1 ? "md:order-1" : ""}>
              <div>
                <span className="font-mono text-sm text-[var(--gold)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="display-m mt-4">{s.title}</h2>
                <p className="mt-5 text-[var(--bone-dim)]">{s.detail}</p>
                <p className="mt-4 text-sm text-[var(--muted)]">{s.blurb}</p>
                <Link href="/contact" className="btn btn-ghost mt-8">
                  Enquire about {s.title.toLowerCase()}
                  <span className="btn-icon" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </Reveal>
          </section>
        ))}
      </div>

      <section className="section">
        <div className="shell text-center">
          <Reveal>
            <h2 className="display-l mx-auto max-w-[18ch]">
              Not sure which you need? Start with a vision.
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
