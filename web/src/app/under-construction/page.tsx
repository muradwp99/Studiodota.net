import type { Metadata } from "next";
import Image from "next/image";
import { getBlock } from "@/lib/content";
import BlueprintPlan from "./BlueprintPlan";

export const metadata: Metadata = {
  title: "Under construction",
  robots: { index: false, follow: false },
};

export default async function UnderConstructionPage() {
  const site = await getBlock("site");

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0b0d10] text-[#f5f5f3]">
      <BlueprintPlan />

      {/* Bottom scrim — the drawing keeps the upper frame, the copy stays readable. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(11,13,16,0.97)_0%,rgba(11,13,16,0.88)_28%,rgba(11,13,16,0.1)_62%,rgba(11,13,16,0.45)_100%)]" />

      <div className="relative z-10 flex min-h-dvh flex-col justify-between px-[var(--edge)] py-10">
        <Image
          src="/logo-wordmark-white.png"
          alt={site.name}
          width={168}
          height={36}
          priority
          className="h-8 w-auto self-start opacity-90"
        />

        <div className="mt-auto max-w-4xl pt-24">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.32em] text-[#c79a55]">
            Our new site is being built
          </p>
          <h1 className="mt-5 font-display text-[clamp(3rem,12vw,10.5rem)] uppercase leading-[0.84] tracking-[-0.03em]">
            Under
            <br />
            construction
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-[rgba(245,245,243,0.72)]">
            Studio Dot A is still designing, drawing and delivering. The drawings are
            on the board — reach us any time in the meantime.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
            <a
              href={`mailto:${site.email}`}
              className="border-b border-[#c79a55] pb-1 text-[#c79a55] transition-colors hover:text-[#e6cb92]"
            >
              {site.email}
            </a>
            <a
              href={`tel:${String(site.phone).replace(/[^\d+]/g, "")}`}
              className="text-[rgba(245,245,243,0.72)] transition-colors hover:text-[#f5f5f3]"
            >
              {site.phone}
            </a>
          </div>
        </div>

        <p className="mt-10 font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[rgba(245,245,243,0.4)]">
          {site.name} — Architecture &amp; Engineering
        </p>
      </div>
    </main>
  );
}
