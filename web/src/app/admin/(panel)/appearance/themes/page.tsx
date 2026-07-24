import { getBlock } from "@/lib/content";
import ThemeAccentEditor from "@/components/admin/ThemeAccentEditor";

export const metadata = { title: "Themes" };

export default async function AdminThemes() {
  const appearance = await getBlock("appearance");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Themes</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">The site&rsquo;s visual identity — colour, fonts, and finish.</p>
      </div>

      <ThemeAccentEditor initial={appearance.accent} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <figure className="overflow-hidden rounded-2xl border-2 border-[var(--gold)] bg-[var(--surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/renders/hero.jpg" alt="Studiodota theme preview" className="aspect-[16/10] w-full object-cover" />
          <figcaption className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold">Studiodota 1.0</span>
              <span className="rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-bold text-[#17191c]">Active</span>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Charcoal &amp; champagne-bronze editorial theme, set in Archivo. Warm paper surfaces with a dark mode built in.
            </p>
          </figcaption>
        </figure>
        <div className="grid place-items-center rounded-2xl border-2 border-dashed border-[var(--line-strong)] p-8 text-center">
          <div>
            <div className="text-3xl text-[var(--muted)]" aria-hidden="true">＋</div>
            <h2 className="mt-2 font-semibold">Add themes</h2>
            <p className="mx-auto mt-2 max-w-[32ch] text-sm text-[var(--muted)]">
              Full theme packs (colour + fonts + layout) are added as code, like plugins — ask your developer (or Claude Code) to create one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
