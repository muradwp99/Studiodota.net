import Link from "next/link";
import Image from "next/image";
import type { BlockData } from "@/content/defaults";

export default function Footer({ site, pages }: { site: BlockData["site"]; pages: { label: string; href: string }[] }) {
  const mapQuery = encodeURIComponent(`${site.address1}, ${site.address2}`);
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
            <h3 className="text-lg font-extrabold">Services</h3>
            <ul className="mt-6 space-y-4 text-[var(--bone-dim)]">
              {site.footerServices.map((s) => (
                <li key={s}>
                  <Link href="#" className="hover:text-[var(--bone)]">{s}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* contact — beside the other columns, per the client's markup */}
          <div>
            <h3 className="text-lg font-extrabold">Contact</h3>
            <div className="mt-6 space-y-5 text-sm">
              <div>
                <div className="eyebrow eyebrow-muted text-[var(--muted)]">Email address</div>
                <a href={`mailto:${site.email}`} className="mt-1.5 block text-[var(--bone-dim)] hover:text-[var(--bone)]">
                  {site.email}
                </a>
              </div>
              <div>
                <div className="eyebrow eyebrow-muted text-[var(--muted)]">Phone number</div>
                <p className="mt-1.5 text-[var(--bone-dim)]">{site.phone}</p>
              </div>
              <div>
                <div className="eyebrow eyebrow-muted text-[var(--muted)]">Our offices</div>
                <p className="mt-1.5 text-[var(--bone-dim)]">{site.address1}<br />{site.address2}</p>
              </div>
              <div>
                <div className="eyebrow eyebrow-muted text-[var(--muted)]">Follow</div>
                <div className="mt-1.5 flex gap-4 text-sm text-[var(--bone-dim)]">
                  {site.socials.map((s) => (
                    <a key={s.label} href={s.href} className="hover:text-[var(--gold)]">{s.label}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* map — address-driven, so fixing the address in Settings updates it */}
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] sm:col-span-2 lg:col-span-1">
            <iframe
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
              title={`Map - ${site.name} offices`}
              className="h-full min-h-[260px] w-full"
              style={{ border: 0, filter: "grayscale(1) contrast(1.04)" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
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
      <h3 className="text-lg font-extrabold">{title}</h3>
      <ul className="mt-6 space-y-4 text-[var(--bone-dim)]">
        {items.map((i) => (
          <li key={i.label}>
            <Link href={`#${i.label.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-[var(--bone)]">{i.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
