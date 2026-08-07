import Link from "next/link";
import Image from "next/image";
import SocialIcon from "@/components/SocialIcon";
import type { BlockData } from "@/content/defaults";

export default function Footer({ site, pages }: { site: BlockData["site"]; pages: { label: string; href: string }[] }) {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--line)] bg-[var(--ink)]">
      <div className="shell pt-20">
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-[1.05fr_0.55fr_0.75fr_0.9fr_1.05fr]">
          {/* brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <Image src="/logo-wordmark.png" alt={site.name} width={2619} height={846} className="logo-light-only h-10 w-auto" />
              <Image src="/logo-wordmark-white.png" alt={site.name} width={2619} height={846} className="logo-dark-only h-10 w-auto" />
            </div>
            {site.tagline && (
              <span className="mt-3 block text-[0.62rem] uppercase tracking-[0.22em] text-[var(--muted)]">{site.tagline}</span>
            )}
            <p className="mt-6 max-w-[26ch] text-lg font-semibold leading-snug text-[var(--bone-dim)]">
              {site.footerHeadline}
            </p>
          </div>

          <FooterCol title="Pages" items={pages} />

          <div>
            <h2 className="text-lg font-extrabold">Services</h2>
            <ul className="mt-6 space-y-4 text-[var(--bone-dim)]">
              {site.footerServices.map((s) => (
                <li key={s}>
                  {/* Was href="#", which reloads the page and goes nowhere.
                      The services page is the honest destination. */}
                  <Link href="/services" className="hover:text-[var(--bone)]">{s}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* contact — beside the other columns, per the client's markup */}
          <div>
            <h2 className="text-lg font-extrabold">Contact</h2>
            <div className="mt-6 space-y-5 text-sm">
              <div>
                <div className="eyebrow">Email address</div>
                <a href={`mailto:${site.email}`} className="mt-1.5 block text-[var(--bone-dim)] hover:text-[var(--bone)]">
                  {site.email}
                </a>
              </div>
              <div>
                <div className="eyebrow">Phone number</div>
                <p className="mt-1.5 text-[var(--bone-dim)]">{site.phone}</p>
              </div>
              <div>
                <div className="eyebrow">Follow</div>
                <div className="mt-2 flex gap-4 text-[var(--bone-dim)]">
                  {/* Only render a social link that actually goes somewhere. Every
                      href ships as "#" until someone fills it in, which rendered
                      five icons that reloaded the page and went nowhere. The
                      Organization JSON-LD already treats "#" as unset the same
                      way - see sameAs in (site)/layout.tsx. Add the real URLs in
                      admin Settings and the icons reappear. */}
                  {site.socials
                    .filter((s) => s.href && s.href !== "#")
                    .map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        aria-label={s.label}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--gold)]"
                      >
                        <SocialIcon label={s.label} className="h-[18px] w-[18px]" />
                      </a>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* start-a-project CTA — was a map embed keyed to the still-placeholder
              office address (Settings → General), which geocoded to a real but
              unrelated LA location. A live contact prompt is honest in the
              meantime and gives the footer an actual conversion point. */}
          <div className="flex min-h-[260px] flex-col justify-between gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 sm:col-span-2 lg:col-span-1">
            <div>
              <span className="eyebrow">Start a project</span>
              <p className="mt-3 max-w-[26ch] text-lg font-semibold leading-snug text-[var(--bone)]">
                Have a site, a program, or just an idea? Let&apos;s talk it through.
              </p>
            </div>
            <Link href="/contact" className="btn btn-primary w-max">
              Get in touch
              <span className="btn-icon" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* watermark */}
        <div className="pointer-events-none mt-16 select-none text-center">
          <span
            className="font-extrabold uppercase leading-none"
            style={{ fontSize: "clamp(2.5rem, 13vw, 12rem)", color: "var(--watermark)", letterSpacing: "0.02em" }}
          >
            {site.name}
          </span>
        </div>

        <div className="flex flex-col gap-4 border-t border-[var(--line)] py-8 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--bone)]">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--bone)]">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      {/* h2, not h3: the footer sits directly under the page h1 on routes with no
          intervening h2, and an h1 -> h3 jump is a skipped level for anyone
          navigating by headings. Sizing stays visual, via the class. */}
      <h2 className="text-lg font-extrabold">{title}</h2>
      <ul className="mt-6 space-y-4 text-[var(--bone-dim)]">
        {items.map((i) => (
          <li key={i.label}>
            {/* Use the item's real href. This was linking to `#` + a slugified
                label, so every link in the footer's Pages column pointed at an
                anchor that does not exist on the page instead of navigating. */}
            <Link href={i.href} className="hover:text-[var(--bone)]">{i.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
