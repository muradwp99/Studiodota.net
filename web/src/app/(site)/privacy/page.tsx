import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";
import { getBlock } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const d = await getBlock("page.privacy");
  return pageMetadata({ seo: d.seo, title: d.title, description: d.lede, path: "/privacy" });
}

export default async function PrivacyPage() {
  const [d, site] = await Promise.all([getBlock("page.privacy"), getBlock("site")]);

  return (
    <>
      <PageHeader eyebrow={d.eyebrow} pageName={d.title} lede={d.lede} />
      <div className="shell pb-28">
        <div className="max-w-[70ch] space-y-10 text-[var(--bone-dim)]">
          {d.sections.map((s, i) => (
            <Reveal key={s.heading} delay={Math.min(i * 60, 300)}>
              <section className={i > 0 ? "border-t border-[var(--line)] pt-8" : ""}>
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--gold-ink)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-3 font-display text-2xl text-[var(--bone)]">{s.heading}</h2>
                <p className="mt-4 leading-relaxed">{s.body}</p>
              </section>
            </Reveal>
          ))}
          <Reveal delay={80}>
            <p className="border-t border-[var(--line)] pt-8 text-sm text-[var(--muted)]">
              Questions about this policy? Contact{" "}
              <a href={`mailto:${site.email}`} className="link-underline text-[var(--bone)]">{site.email}</a>.
            </p>
          </Reveal>
        </div>
      </div>
    </>
  );
}
