"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import VideoPlayer from "@/components/VideoPlayer";
import ContactForm from "@/components/ContactForm";
import type { PageBlock } from "@/lib/pageBlocks";

/**
 * Pure presentational renderer for block-editor pages. Used by BOTH the public
 * page route and the admin editor canvas — no data fetching, no async.
 */

export type BlockCtx = { serviceOptions: string[] };

const S = (v: unknown) => String(v ?? "");
const paragraphs = (body: unknown) => S(body).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

function btnCls(style: unknown) {
  return `btn ${S(style) === "ghost" ? "btn-ghost" : "btn-primary"}`;
}

function Hero({ p }: { p: Record<string, unknown> }) {
  const full = S(p.height) === "full";
  return (
    <header data-nav-tone="dark" className={`relative flex items-end overflow-hidden ${full ? "min-h-screen" : "min-h-[70vh]"}`}>
      <div className="absolute inset-0">
        {S(p.image) && <Image src={S(p.image)} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,11,12,0.86), rgba(11,11,12,0.2) 55%, rgba(11,11,12,0.5))" }} aria-hidden="true" />
      </div>
      <div className="shell relative w-full pb-14 pt-40 md:pb-20" style={{ color: "var(--on-media)" }}>
        {S(p.eyebrow) && <span className="eyebrow" style={{ color: "var(--gold-media)" }}>{S(p.eyebrow)}</span>}
        <h1 className="display-l mt-5 max-w-[18ch]" style={{ textWrap: "balance" }}>{S(p.title)}</h1>
        {S(p.lede) && <p className="lede mt-6 max-w-[54ch]" style={{ color: "var(--on-media-dim)" }}>{S(p.lede)}</p>}
        {S(p.buttonLabel) && (
          <Link href={S(p.buttonHref) || "/contact"} className="btn btn-grad mt-8">
            {S(p.buttonLabel)}<span className="btn-icon" aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </header>
  );
}

function Heading({ p }: { p: Record<string, unknown> }) {
  const center = S(p.align) === "center";
  const cls = `display-l max-w-[24ch] ${center ? "mx-auto text-center" : ""}`;
  return (
    <div className="section pb-0">
      <div className="shell">
        {Number(p.level) === 3 ? <h3 className={cls.replace("display-l", "display-m")}>{S(p.text)}</h3> : <h2 className={cls}>{S(p.text)}</h2>}
      </div>
    </div>
  );
}

function TextBlock({ p }: { p: Record<string, unknown> }) {
  return (
    <div className="section pb-0 pt-10">
      <div className="shell">
        <div className="max-w-[70ch] space-y-5 text-[var(--bone-dim)]">
          {paragraphs(p.body).map((para, i) => <p key={i} className="leading-relaxed">{para}</p>)}
        </div>
      </div>
    </div>
  );
}

function ImageBlock({ p }: { p: Record<string, unknown> }) {
  if (!S(p.image)) return null;
  return (
    <div className="section pb-0 pt-10">
      <div className="shell">
        <figure>
          <div className={`relative aspect-[16/9] w-full overflow-hidden border border-[var(--line)] ${p.rounded === false ? "" : "rounded-2xl"}`}>
            <Image src={S(p.image)} alt={S(p.caption)} fill sizes="100vw" className="object-cover" />
          </div>
          {S(p.caption) && <figcaption className="mt-3 text-sm text-[var(--muted)]">{S(p.caption)}</figcaption>}
        </figure>
      </div>
    </div>
  );
}

function ImageText({ p }: { p: Record<string, unknown> }) {
  const imgLeft = p.imageLeft !== false;
  return (
    <div className="section pb-0">
      <div className="shell grid items-center gap-10 md:grid-cols-2 lg:gap-16">
        <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl ${imgLeft ? "" : "md:order-2"}`}>
          {S(p.image) && <Image src={S(p.image)} alt={S(p.title)} fill sizes="(max-width:768px) 100vw, 48vw" className="object-cover" />}
        </div>
        <div className={imgLeft ? "" : "md:order-1"}>
          {S(p.title) && <h3 className="display-m">{S(p.title)}</h3>}
          <div className="mt-5 max-w-[46ch] space-y-4 text-[var(--bone-dim)]">
            {paragraphs(p.body).map((para, i) => <p key={i}>{para}</p>)}
          </div>
          {S(p.buttonLabel) && (
            <Link href={S(p.buttonHref) || "/contact"} className="btn btn-ghost mt-7">
              {S(p.buttonLabel)}<span className="btn-icon" aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Gallery({ p }: { p: Record<string, unknown> }) {
  const images = Array.isArray(p.images) ? (p.images as Record<string, unknown>[]) : [];
  if (images.length === 0) return null;
  return (
    <div className="section pb-0 pt-10">
      <div className="shell grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((im, i) => (
          <figure key={i}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              {S(im.image) && <Image src={S(im.image)} alt={S(im.caption)} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />}
            </div>
            {S(im.caption) && <figcaption className="mt-2 text-sm text-[var(--muted)]">{S(im.caption)}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}

function Video({ p }: { p: Record<string, unknown> }) {
  return (
    <div className="section pb-0 pt-10">
      <div className="shell">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
          <VideoPlayer youtubeId={S(p.youtubeId)} poster={S(p.poster) || "/media/renders/hero.jpg"} mode="ambient" rounded="" className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}

function Buttons({ p }: { p: Record<string, unknown> }) {
  const items = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
  if (items.length === 0) return null;
  return (
    <div className="section pb-0 pt-10">
      <div className="shell flex flex-wrap gap-4">
        {items.map((b, i) => (
          <Link key={i} href={S(b.href) || "/"} className={btnCls(b.style)}>
            {S(b.label)}<span className="btn-icon" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Quote({ p }: { p: Record<string, unknown> }) {
  return (
    <div className="section pb-0">
      <div className="shell">
        <figure className="max-w-[46ch]">
          <span className="text-5xl leading-none text-[var(--gold)]" aria-hidden="true">&ldquo;</span>
          <blockquote className="mt-3 text-xl text-[var(--bone)]">{S(p.quote)}</blockquote>
          {(S(p.name) || S(p.role)) && (
            <figcaption className="mt-5">
              {S(p.name) && <span className="font-semibold">{S(p.name)}</span>}
              {S(p.role) && <div className="text-sm text-[var(--muted)]">{S(p.role)}</div>}
            </figcaption>
          )}
        </figure>
      </div>
    </div>
  );
}

function Stats({ p }: { p: Record<string, unknown> }) {
  const items = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
  return (
    <div className="section pb-0">
      <div className="shell grid gap-10 border-y border-[var(--line)] py-12 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s, i) => (
          <div key={i}>
            <div className="display-m font-semibold">{S(s.value)}<span className="text-[var(--gold)]">{S(s.suffix)}</span></div>
            <p className="mt-2 text-sm uppercase tracking-[0.15em] text-[var(--muted)]">{S(s.label)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Features({ p }: { p: Record<string, unknown> }) {
  const items = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
  return (
    <div className="section pb-0">
      <div className="shell">
        {S(p.title) && <h2 className="display-l max-w-[20ch]">{S(p.title)}</h2>}
        <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${S(p.title) ? "mt-12" : ""}`}>
          {items.map((f, i) => (
            <div key={i} className="card overflow-hidden">
              {S(f.image) && (
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image src={S(f.image)} alt={S(f.title)} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold">{S(f.title)}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{S(f.body)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Faq({ p }: { p: Record<string, unknown> }) {
  const items = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
  const [open, setOpen] = useState(0);
  return (
    <div className="section pb-0">
      <div className="shell max-w-3xl space-y-4">
        {items.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="card p-6 transition-colors duration-300 hover:border-[var(--line-strong)]">
              <button onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full items-center justify-between gap-6 text-left">
                <span className="text-lg font-medium">{S(f.q)}</span>
                <span className="text-xl text-[var(--gold)] transition-transform duration-500" style={{ transform: isOpen ? "rotate(45deg)" : "none" }} aria-hidden="true">+</span>
              </button>
              <div className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                <div className="overflow-hidden"><p className="pt-4 text-sm text-[var(--muted)]">{S(f.a)}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cta({ p }: { p: Record<string, unknown> }) {
  return (
    <div className="section pb-0">
      <div className="shell">
        <section data-nav-tone="dark" className="relative overflow-hidden rounded-3xl px-8 py-16 text-center md:py-24" style={{ color: "var(--on-media)" }}>
          <div className="absolute inset-0">
            {S(p.image) && <Image src={S(p.image)} alt="" fill sizes="100vw" className="object-cover" />}
            <div className="absolute inset-0" style={{ background: "rgba(10,11,13,0.72)" }} aria-hidden="true" />
          </div>
          <div className="relative">
            <h2 className="display-l mx-auto max-w-[18ch]">{S(p.title)}</h2>
            {S(p.body) && <p className="mx-auto mt-5 max-w-[48ch]" style={{ color: "var(--on-media-dim)" }}>{S(p.body)}</p>}
            {S(p.buttonLabel) && (
              <Link href={S(p.buttonHref) || "/contact"} className="btn btn-grad mt-8">
                {S(p.buttonLabel)}<span className="btn-icon" aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ContactFormBlock({ p, ctx }: { p: Record<string, unknown>; ctx: BlockCtx }) {
  return (
    <div className="section pb-0">
      <div className="shell">
        <div className="card-grad mx-auto max-w-3xl p-6 md:p-10">
          {S(p.title) && <h2 className="display-m mb-2">{S(p.title)}</h2>}
          {S(p.body) && <p className="mb-6 text-[var(--bone-dim)]">{S(p.body)}</p>}
          <ContactForm serviceOptions={ctx.serviceOptions} />
        </div>
      </div>
    </div>
  );
}

function Clients({ p }: { p: Record<string, unknown> }) {
  const names = Array.isArray(p.names) ? (p.names as unknown[]).map(String).filter(Boolean) : [];
  return (
    <div className="section pb-0 pt-12">
      <div className="shell text-center">
        {S(p.label) && <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">{S(p.label)}</span>}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
          {names.map((n) => <span key={n} className="text-2xl font-bold text-[var(--bone-dim)]">{n}</span>)}
        </div>
      </div>
    </div>
  );
}

function Block({ block, ctx }: { block: PageBlock; ctx: BlockCtx }) {
  const p = block.props ?? {};
  switch (block.type) {
    case "hero": return <Hero p={p} />;
    case "heading": return <Heading p={p} />;
    case "text": return <TextBlock p={p} />;
    case "image": return <ImageBlock p={p} />;
    case "imageText": return <ImageText p={p} />;
    case "gallery": return <Gallery p={p} />;
    case "video": return <Video p={p} />;
    case "buttons": return <Buttons p={p} />;
    case "quote": return <Quote p={p} />;
    case "stats": return <Stats p={p} />;
    case "features": return <Features p={p} />;
    case "faq": return <Faq p={p} />;
    case "cta": return <Cta p={p} />;
    case "divider": return <div className="shell pt-14"><hr className="border-[var(--line)]" /></div>;
    case "spacer": return <div style={{ height: `${Math.min(24, Math.max(0, Number(p.size) || 0))}rem` }} aria-hidden="true" />;
    case "contactForm": return <ContactFormBlock p={p} ctx={ctx} />;
    case "clients": return <Clients p={p} />;
    default: return null;
  }
}

export default function BlockRenderer({ blocks, ctx }: { blocks: PageBlock[]; ctx: BlockCtx }) {
  return (
    <>
      {blocks.map((b) => <Block key={b.id} block={b} ctx={ctx} />)}
      {/* bottom rhythm so the last block breathes before the footer */}
      <div className="pb-[clamp(4rem,9vw,8rem)]" aria-hidden="true" />
    </>
  );
}
