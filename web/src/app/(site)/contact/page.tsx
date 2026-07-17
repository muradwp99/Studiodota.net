import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";
import { getBlock } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.contact");
  return { title: "Contact", description: d.lede };
}

export default async function ContactPage() {
  const [d, site] = await Promise.all([getBlock("page.contact"), getBlock("site")]);

  return (
    <>
      <PageHero eyebrow={d.eyebrow} title={d.title} lede={d.lede} image={d.image} imageAlt="" />

      <section className="section pt-16">
        <div className="shell grid gap-14 lg:grid-cols-[1.35fr_0.85fr] lg:gap-20">
          <Reveal>
            <div className="card-grad p-6 md:p-10">
              <span className="eyebrow">{d.formLabel}</span>
              <h2 className="display-m mb-8 mt-3">{d.formTitle}</h2>
              <ContactForm serviceOptions={d.serviceOptions} />
            </div>
          </Reveal>

          <Reveal delay={120}>
            <aside className="space-y-10 lg:sticky lg:top-28">
              <div>
                <h3 className="eyebrow eyebrow-muted">Direct</h3>
                <ul className="mt-5 space-y-3 text-[var(--bone-dim)]">
                  <li>
                    <a href={`mailto:${site.email}`} className="link-underline">{site.email}</a>
                  </li>
                  <li>{site.phone}</li>
                </ul>
              </div>
              <div>
                <h3 className="eyebrow eyebrow-muted">What to send</h3>
                <p className="mt-5 text-[var(--muted)]">{d.whatToSend}</p>
              </div>
              <div>
                <h3 className="eyebrow eyebrow-muted">Turnaround</h3>
                <p className="mt-5 text-[var(--muted)]">{d.turnaround}</p>
              </div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                <Image
                  src={d.asideImage}
                  alt=""
                  fill
                  sizes="(max-width:1024px) 100vw, 32vw"
                  className="object-cover"
                />
              </div>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
