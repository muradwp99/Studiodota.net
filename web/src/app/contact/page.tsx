import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start with a vision. Share your brief, site, drawings, and references — we'll turn them into a considered design, guided from first concept through construction.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Start with a vision"
        title="Tell us about your project."
        lede="Share your brief, site details, drawings, or references. We'll turn them into a considered design — guided from first concept through to construction."
        image="/media/renders/urban-oasis.jpg"
        imageAlt="Urban Oasis apartments render"
      />

      <section className="section pt-16">
        <div className="shell grid gap-14 lg:grid-cols-[1.35fr_0.85fr] lg:gap-20">
          <Reveal>
            <div className="card-grad p-6 md:p-10">
              <span className="eyebrow">Enquiry</span>
              <h2 className="display-m mb-8 mt-3">Send us the brief.</h2>
              <ContactForm />
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
                <p className="mt-5 text-[var(--muted)]">
                  A brief or wishlist, the site address or a survey, any existing drawings, and
                  references or moodboards. A rough sketch is a fine place to start.
                </p>
              </div>
              <div>
                <h3 className="eyebrow eyebrow-muted">Turnaround</h3>
                <p className="mt-5 text-[var(--muted)]">
                  Concept design takes a few weeks; full projects run over several months.
                  We&rsquo;ll confirm a clear programme with your proposal.
                </p>
              </div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
                <Image
                  src="/media/renders/atelier-house.jpg"
                  alt="Atelier House — a recent Studiodota residence"
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
