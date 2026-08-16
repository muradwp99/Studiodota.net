import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ScrollExitImage from "@/components/motion/ScrollExitImage";
import ContactForm from "@/components/ContactForm";
import { getBlock } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.contact");
  return pageMetadata({ seo: d.seo, title: d.title, description: d.lede, path: "/contact" });
}

export default async function ContactPage() {
  const [d, site] = await Promise.all([getBlock("page.contact"), getBlock("site")]);

  return (
    <>
      <PageHero eyebrow={d.eyebrow} pageName="Contact" lede={d.lede} image={d.image} imageAlt="" video="/media/contact-hero.mp4" />

      <section className="section pt-16">
        <div className="shell grid gap-14 lg:grid-cols-[1.35fr_0.85fr] lg:gap-20">
          <Reveal from="left">
            <div className="card-grad p-6 md:p-10">
              <span className="eyebrow">{d.formLabel}</span>
              <h2 className="display-m mb-8 mt-3">{d.formTitle}</h2>
              <ContactForm serviceOptions={d.serviceOptions} />
            </div>
          </Reveal>

          <aside className="space-y-8 lg:sticky lg:top-28">
            <Reveal from="right" delay={120}>
              <div>
                <h3 className="eyebrow">Direct</h3>
                <ul className="mt-5 space-y-3 text-[var(--bone-dim)]">
                  <li>
                    <a href={`mailto:${site.email}`} className="link-underline">{site.email}</a>
                  </li>
                  <li>{site.phone}</li>
                </ul>
              </div>
            </Reveal>
            <Reveal from="right" delay={200}>
              <div className="border-t border-[var(--line)] pt-8">
                <h3 className="eyebrow">What to send</h3>
                <p className="mt-5 text-[var(--muted)]">{d.whatToSend}</p>
              </div>
            </Reveal>
            <Reveal from="right" delay={280}>
              <div className="border-t border-[var(--line)] pt-8">
                <h3 className="eyebrow">Turnaround</h3>
                <p className="mt-5 text-[var(--muted)]">{d.turnaround}</p>
              </div>
            </Reveal>
            <ScrollExitImage
              src={d.asideImage}
              alt=""
              sizes="(max-width:1024px) 100vw, 32vw"
              className="mt-2 aspect-[4/3] w-full rounded-2xl"
              delay={0.36}
            />
          </aside>
        </div>
      </section>
    </>
  );
}
