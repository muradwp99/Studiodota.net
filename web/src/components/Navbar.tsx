"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSectionTone } from "@/lib/useSectionTone";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export type NavbarProps = {
  siteName: string;
  nav: { getStartedLabel: string; getStartedHref: string };
  /** Primary menu from Appearance → Menus. Known hrefs keep their mega panels.
   *  Other items with a non-empty `children` array get a simple dropdown. */
  menuItems: { label: string; href: string; children?: { label: string; href: string }[] }[];
  services: { t: string; d: string; href: string }[];
  galleryVideos: { img: string; t: string }[];
  galleryPhotos: string[];
  projects: { img: string; n: string; c: string }[];
};

/** hrefs that open a rich dropdown panel (panel id → content below) */
const MEGA_BY_HREF: Record<string, "Services" | "Gallery" | "Projects"> = {
  "/services": "Services",
  "/gallery": "Gallery",
  "/projects": "Projects",
};
const MEGA_PANELS: Set<string> = new Set(Object.values(MEGA_BY_HREF));

function Sun() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></svg>);
}
function Moon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>);
}
function SearchIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m21 21-4.3-4.3" /></svg>);
}

export default function Navbar({ siteName, nav, menuItems, services, galleryVideos, galleryPhotos, projects: megaProjects }: NavbarProps) {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  /** Which mobile disclosure (sub-menu) is expanded, keyed by a sanitized `"mobile-" + href`. */
  const [mobileSub, setMobileSub] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const d = stored === "dark";
    // localStorage is unreadable during SSR, so theme is resolved post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(d);
    document.documentElement.dataset.theme = d ? "dark" : "light";
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("lenis-stopped", open);
    return () => document.documentElement.classList.remove("lenis-stopped");
  }, [open]);

  // Close the mega-menu/dropdown/mobile disclosure on Escape, outside pointer, or focus leaving the header.
  useEffect(() => {
    if (!active && !mobileSub) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (active) {
          const label = active;
          setActive(null);
          triggerRefs.current[label]?.focus();
        }
        if (mobileSub) {
          const label = mobileSub;
          setMobileSub(null);
          triggerRefs.current[label]?.focus();
        }
      }
    };
    const onOutside = (e: Event) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setActive(null);
        setMobileSub(null);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
    };
  }, [active, mobileSub]);

  const focusFirstIn = (el: Element | null) => {
    el?.querySelector<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])')?.focus();
  };
  const focusFirstInPanel = () => focusFirstIn(panelRef.current);

  const openMega = (k: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setActive(k); };
  const scheduleClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current = setTimeout(() => setActive(null), 150); };
  // `active` also holds a plain item's href while its (non-mega) dropdown is open —
  // the shared mega panel below must only show for the three MEGA_BY_HREF panels.
  const megaOpen = active !== null && MEGA_PANELS.has(active);

  // Adaptive glass: tint follows the section behind the pill. In dark theme
  // every surface is dark, so the nav stays dark there regardless of section.
  const sectionTone = useSectionTone(44);
  const tone = dark ? "dark" : sectionTone;

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50" onMouseLeave={scheduleClose}>
      <div className="pointer-events-none flex justify-center px-4 pt-4">
        <nav data-tone={tone} className="nav-shell pointer-events-auto flex w-[min(1120px,94vw)] items-center justify-between gap-4 rounded-full py-2 pl-4 pr-2 shadow-[0_18px_50px_-24px_rgba(17,19,21,0.4)]">
          <Link href="/" className="flex items-center" onMouseEnter={scheduleClose}>
            <Image
              src={tone === "dark" ? "/logo-wordmark-white.png" : "/logo-wordmark.png"}
              alt={siteName}
              width={2619}
              height={846}
              priority
              className="h-8 w-auto"
            />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {menuItems.map((item) => {
              const panel = MEGA_BY_HREF[item.href];
              if (!panel) {
                const kids = item.children ?? [];
                if (kids.length === 0) {
                  return (
                    <li key={item.label + item.href} onMouseEnter={scheduleClose}>
                      <Link href={item.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--nav-fg-dim)] transition-colors duration-300 hover:bg-[var(--nav-hover-bg)] hover:text-[var(--nav-fg)]">{item.label}</Link>
                    </li>
                  );
                }
                // Plain sub-menu dropdown (not a MEGA_BY_HREF panel) — same open/close/keyboard
                // wiring as the mega items above, reusing `active` + `triggerRefs`, just rendered
                // as a small list under the item instead of the shared full-width mega panel.
                const subId = `nav-sub-${item.href.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
                const subOn = active === item.href;
                return (
                  <li key={item.label + item.href} className="relative flex items-center" onMouseEnter={() => openMega(item.href)}>
                    <Link
                      href={item.href}
                      onClick={() => setActive(null)}
                      className={`rounded-full py-2 pl-3.5 pr-1.5 text-sm font-medium transition-colors duration-300 ${subOn ? "text-[var(--nav-accent)]" : "text-[var(--nav-fg-dim)] hover:text-[var(--nav-fg)]"}`}
                    >
                      {item.label}
                    </Link>
                    <button
                      ref={(el) => { triggerRefs.current[item.href] = el; }}
                      aria-label={`${item.label} menu`}
                      aria-haspopup="true"
                      aria-expanded={subOn}
                      aria-controls={subId}
                      onClick={() => (subOn ? setActive(null) : openMega(item.href))}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          openMega(item.href);
                          requestAnimationFrame(() => focusFirstIn(document.getElementById(subId)));
                        }
                      }}
                      className={`mr-1 grid h-7 w-6 place-items-center rounded-full transition-colors duration-300 ${subOn ? "text-[var(--nav-accent)]" : "text-[var(--nav-fg-dim)] hover:text-[var(--nav-fg)]"}`}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ transform: subOn ? "rotate(180deg)" : "none", transition: "transform 0.3s var(--ease-lux)" }}>
                        <path d="M2.2 3.6 5 6.4 7.8 3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div
                      id={subId}
                      role="region"
                      aria-label={`${item.label} menu`}
                      className="glass pointer-events-auto absolute left-0 top-full mt-2 min-w-[180px] overflow-hidden rounded-xl p-1.5 transition-all duration-300"
                      style={{ opacity: subOn ? 1 : 0, transform: subOn ? "translateY(0)" : "translateY(-8px)", visibility: subOn ? "visible" : "hidden" }}
                    >
                      {kids.map((child) => (
                        <Link
                          key={child.label + child.href}
                          href={child.href}
                          onClick={() => setActive(null)}
                          className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-[var(--bone-dim)] transition-colors duration-300 hover:bg-[var(--surface-2)] hover:text-[var(--bone)]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </li>
                );
              }
              const on = active === panel;
              return (
                <li key={item.label + item.href} className="flex items-center" onMouseEnter={() => openMega(panel)}>
                  <Link
                    href={item.href}
                    onClick={() => setActive(null)}
                    className={`rounded-full py-2 pl-3.5 pr-1.5 text-sm font-medium transition-colors duration-300 ${on ? "text-[var(--nav-accent)]" : "text-[var(--nav-fg-dim)] hover:text-[var(--nav-fg)]"}`}
                  >
                    {item.label}
                  </Link>
                  <button
                    ref={(el) => { triggerRefs.current[panel] = el; }}
                    aria-label={`${item.label} menu`}
                    aria-haspopup="true"
                    aria-expanded={on}
                    aria-controls="nav-mega-panel"
                    onClick={() => (on ? setActive(null) : openMega(panel))}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        openMega(panel);
                        requestAnimationFrame(focusFirstInPanel);
                      }
                    }}
                    className={`mr-1 grid h-7 w-6 place-items-center rounded-full transition-colors duration-300 ${on ? "text-[var(--nav-accent)]" : "text-[var(--nav-fg-dim)] hover:text-[var(--nav-fg)]"}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ transform: on ? "rotate(180deg)" : "none", transition: "transform 0.3s var(--ease-lux)" }}>
                      <path d="M2.2 3.6 5 6.4 7.8 3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <Link href="/search" onMouseEnter={scheduleClose} aria-label="Search" className="grid h-9 w-9 place-items-center rounded-full text-[var(--nav-fg-dim)] transition-colors duration-300 hover:bg-[var(--nav-hover-bg)] hover:text-[var(--nav-fg)]">
              <SearchIcon />
            </Link>
            <AnimatedThemeToggler
              theme={dark ? "dark" : "light"}
              onThemeChange={(t) => {
                setDark(t === "dark");
                localStorage.setItem("theme", t);
              }}
              aria-label="Toggle theme"
              className="grid h-9 w-9 place-items-center rounded-full text-[var(--nav-fg-dim)] transition-colors duration-300 hover:bg-[var(--nav-hover-bg)] hover:text-[var(--nav-fg)]"
            >
              {dark ? <Sun /> : <Moon />}
            </AnimatedThemeToggler>
            <Link href={nav.getStartedHref} className="hidden rounded-full px-5 py-2.5 text-sm font-semibold transition-transform duration-300 hover:scale-[1.03] sm:inline-block" style={{ background: "linear-gradient(120deg,#d0aa72,#a87f3f 55%,#8f6c39)", color: "#17191c" }}>{nav.getStartedLabel}</Link>
            <button className="grid h-9 w-9 place-items-center lg:hidden" aria-label={open ? "Close" : "Menu"} onClick={() => setOpen((v) => !v)}>
              <div className="flex flex-col gap-[5px]">
                <span className={`h-px w-5 bg-[var(--nav-fg)] transition-transform duration-500 ${open ? "translate-y-[6px] rotate-45" : ""}`} />
                <span className={`h-px w-5 bg-[var(--nav-fg)] transition-transform duration-500 ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* Mega panel — only for the three MEGA_BY_HREF entries; plain dropdowns render inline above. */}
      <div className="pointer-events-none hidden justify-center px-4 lg:flex" onMouseEnter={() => megaOpen && openMega(active!)}>
        <div
          id="nav-mega-panel"
          ref={panelRef}
          role="region"
          aria-label={megaOpen ? `${active} menu` : undefined}
          className="glass pointer-events-auto mt-2 w-[min(1120px,94vw)] origin-top overflow-hidden rounded-2xl p-8 transition-all duration-400"
          style={{ opacity: megaOpen ? 1 : 0, transform: megaOpen ? "translateY(0)" : "translateY(-10px)", visibility: megaOpen ? "visible" : "hidden" }}
        >
          {active === "Services" && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {services.map((s) => (
                <Link key={s.t} href={s.href} onClick={() => setActive(null)} className="group rounded-xl p-4 transition-colors duration-300 hover:bg-[var(--surface-2)]">
                  <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" /><span className="font-semibold">{s.t}</span></div>
                  <p className="mt-1 pl-3.5 text-sm text-[var(--muted)]">{s.d}</p>
                </Link>
              ))}
            </div>
          )}
          {active === "Gallery" && (
            <div className={`grid gap-6 ${galleryVideos.length ? "md:grid-cols-[1.2fr_1fr]" : ""}`}>
              {galleryVideos.length > 0 && (
                <div>
                  <div className="eyebrow mb-3">Videos</div>
                  <div className="grid grid-cols-2 gap-3">
                    {galleryVideos.map((v) => (
                      <Link key={v.img} href="/gallery" onClick={() => setActive(null)} className="group relative aspect-video overflow-hidden rounded-xl">
                        <Image src={v.img} alt={v.t} fill sizes="260px" className="img-zoom object-cover" />
                        <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[rgba(255,255,255,0.2)] text-xs text-white backdrop-blur">▶</span>
                        <span className="absolute bottom-2 left-3 text-xs font-medium text-white">{v.t}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="eyebrow mb-3">Photos</div>
                <div className="grid grid-cols-4 gap-2">
                  {galleryPhotos.map((p) => (
                    <Link key={p} href="/gallery" onClick={() => setActive(null)} className="group relative aspect-square overflow-hidden rounded-lg">
                      <Image src={p} alt="" fill sizes="120px" className="img-zoom object-cover" />
                    </Link>
                  ))}
                </div>
                <Link href="/gallery" onClick={() => setActive(null)} className="link-underline mt-4 inline-block text-sm font-semibold text-[var(--gold-ink)]">View full gallery →</Link>
              </div>
            </div>
          )}
          {active === "Projects" && (
            <div className="grid grid-cols-3 gap-4">
              {megaProjects.map((p) => (
                <Link key={p.n} href="/projects" onClick={() => setActive(null)} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl"><Image src={p.img} alt={p.n} fill sizes="300px" className="img-zoom object-cover" /></div>
                  <div className="mt-3 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{p.c}</div>
                  <div className="text-base font-medium transition-colors duration-300 group-hover:text-[var(--gold)]">{p.n}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      <div className={`fixed inset-0 z-40 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} style={{ background: "var(--ink)", backdropFilter: "blur(24px)" }}>
          <div className="shell flex h-full flex-col justify-center gap-3 overflow-y-auto pt-24 pb-12">
            {menuItems.map((item, i) => {
              const kids = item.children ?? [];
              const style = { transitionDelay: open ? `${120 + i * 60}ms` : "0ms", opacity: open ? 1 : 0, transform: open ? "none" : "translateY(20px)" };
              if (kids.length === 0) {
                return (
                  <Link key={item.label + item.href} href={item.href} onClick={() => setOpen(false)} className="text-4xl font-extrabold transition-all duration-500" style={style}>{item.label}</Link>
                );
              }
              // Disclosure pattern: tap expands/collapses the sub-links instead of navigating.
              // Sub-list stays mounted (hidden via class, not removed) so aria-controls always
              // resolves and collapsed links drop out of the tab order via display:none.
              const mobileKey = `mobile-${item.href.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
              const expanded = mobileSub === mobileKey;
              return (
                <div key={item.label + item.href} className="transition-all duration-500" style={style}>
                  <button
                    type="button"
                    ref={(el) => { triggerRefs.current[mobileKey] = el; }}
                    aria-expanded={expanded}
                    aria-controls={mobileKey}
                    onClick={() => setMobileSub(expanded ? null : mobileKey)}
                    className="flex items-center gap-3 text-4xl font-extrabold"
                  >
                    {item.label}
                    <svg width="20" height="20" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.3s var(--ease-lux)" }}>
                      <path d="M2.2 3.6 5 6.4 7.8 3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div id={mobileKey} className={`mt-2 flex-col gap-1 ${expanded ? "flex" : "hidden"}`}>
                    {kids.map((child) => (
                      <Link key={child.label + child.href} href={child.href} onClick={() => setOpen(false)} className="py-1 text-lg font-medium text-[var(--bone-dim)]">{child.label}</Link>
                    ))}
                  </div>
                </div>
              );
            })}
            <Link href={nav.getStartedHref} onClick={() => setOpen(false)} className="btn btn-primary mt-6 w-max">{nav.getStartedLabel}</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
