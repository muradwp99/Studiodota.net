import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start with a vision. Share your plans and get a quote for architectural 3D rendering, animation, and immersive visualisation.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Start with a vision"
        title="Tell us about your project."
        lede="Share your brief, site details, drawings, or references. We'll turn them into a considered design — guided from first concept through construction."
      />

      <div className="shell section grid gap-14 pt-6 lg:grid-cols-[1.4fr_0.9fr] lg:gap-20">
        <Reveal>
          <ContactForm />
        </Reveal>

        <Reveal delay={120}>
          <aside className="space-y-10">
            <div>
              <h3 className="eyebrow eyebrow-muted">Direct</h3>
              <ul className="mt-5 space-y-3 text-[var(--bone-dim)]">
                <li>
                  <a href={`mailto:${site.email}`} className="link-underline">
                    {site.email}
                  </a>
                </li>
                <li>{site.phone}</li>
              </ul>
            </div>
            <div>
              <h3 className="eyebrow eyebrow-muted">What to send</h3>
              <p className="mt-5 text-[var(--muted)]">
                A brief or wishlist, the site address or a survey, any existing
                drawings, and references or moodboards. A rough sketch is a fine
                place to start.
              </p>
            </div>
            <div>
              <h3 className="eyebrow eyebrow-muted">Turnaround</h3>
              <p className="mt-5 text-[var(--muted)]">
                Concept design takes a few weeks; full projects run over several
                months. We&rsquo;ll confirm a clear programme with your proposal.
              </p>
            </div>
          </aside>
        </Reveal>
      </div>
    </>
  );
}
