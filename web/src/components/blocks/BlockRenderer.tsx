"use client";

import { createElement, useState, Fragment, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import VideoPlayer from "@/components/VideoPlayer";
import ContactForm from "@/components/ContactForm";
import InlineText from "@/components/blocks/InlineText";
import type { PageBlock } from "@/lib/pageBlocks";
import { nodeCss, wrapperAttrs } from "@/lib/nodes/css";

/**
 * Renderer for block-editor pages. Used by BOTH the public route (no `edit`)
 * and the admin canvas (with `edit`, which turns text nodes into inline,
 * click-to-type fields). The no-edit output is byte-identical to before.
 */

export type BlockCtx = { serviceOptions: string[] };
type Edit = ((path: (string | number)[], value: string) => void) | undefined;

const S = (v: unknown) => String(v ?? "");
const paragraphs = (body: unknown) => S(body).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

function btnCls(style: unknown) {
  return `btn ${S(style) === "ghost" ? "btn-ghost" : "btn-primary"}`;
}

/** Editable text in edit mode, plain text (or nothing, if hideEmpty) otherwise. */
function T({
  edit, path, value, tag = "span", className, style, multiline, placeholder, hideEmpty,
}: {
  edit: Edit; path: (string | number)[]; value: string;
  tag?: keyof React.JSX.IntrinsicElements; className?: string; style?: React.CSSProperties;
  multiline?: boolean; placeholder?: string; hideEmpty?: boolean;
}) {
  if (!edit) {
    if (hideEmpty && !value) return null;
    return createElement(tag ?? "span", { className, style }, value);
  }
  return (
    <InlineText tag={tag} className={className} style={style} value={value} multiline={multiline} placeholder={placeholder} onCommit={(v) => edit(path, v)} />
  );
}

/** In edit mode a link never navigates. */
const linkGuard = (edit: Edit) => (edit ? (e: React.MouseEvent) => e.preventDefault() : undefined);

function Hero({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  const full = S(p.height) === "full";
  return (
    <header data-nav-tone="dark" className={`relative flex items-end overflow-hidden ${full ? "min-h-screen" : "min-h-[70vh]"}`}>
      <div className="absolute inset-0">
        {S(p.image) && <Image src={S(p.image)} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,11,12,0.86), rgba(11,11,12,0.2) 55%, rgba(11,11,12,0.5))" }} aria-hidden="true" />
      </div>
      <div className="shell relative w-full pb-14 pt-40 md:pb-20" style={{ color: "var(--on-media)" }}>
        <T edit={edit} path={["eyebrow"]} value={S(p.eyebrow)} tag="span" className="eyebrow" style={{ color: "var(--gold-media)" }} hideEmpty placeholder="Eyebrow" />
        <T edit={edit} path={["title"]} value={S(p.title)} tag="h1" className="display-l mt-5 max-w-[18ch]" style={{ textWrap: "balance" }} placeholder="Headline" />
        <T edit={edit} path={["lede"]} value={S(p.lede)} tag="p" className="lede mt-6 max-w-[54ch]" style={{ color: "var(--on-media-dim)" }} multiline hideEmpty placeholder="Lede…" />
        {(edit || S(p.buttonLabel)) && (
          <Link href={S(p.buttonHref) || "/contact"} onClick={linkGuard(edit)} className="btn btn-grad mt-8">
            <T edit={edit} path={["buttonLabel"]} value={S(p.buttonLabel)} placeholder="Button" /><span className="btn-icon" aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </header>
  );
}

function Heading({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  const center = S(p.align) === "center";
  const cls = `display-l max-w-[24ch] ${center ? "mx-auto text-center" : ""}`;
  const isH3 = Number(p.level) === 3;
  return (
    <div className="section pb-0">
      <div className="shell">
        <T edit={edit} path={["text"]} value={S(p.text)} tag={isH3 ? "h3" : "h2"} className={isH3 ? cls.replace("display-l", "display-m") : cls} placeholder="Heading" />
      </div>
    </div>
  );
}

function TextBlock({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  return (
    <div className="section pb-0 pt-10">
      <div className="shell">
        <div className="max-w-[70ch] space-y-5 text-[var(--bone-dim)]">
          {edit ? (
            <InlineText tag="div" className="leading-relaxed" value={S(p.body)} multiline placeholder="Write something…" onCommit={(v) => edit(["body"], v)} />
          ) : (
            paragraphs(p.body).map((para, i) => <p key={i} className="leading-relaxed">{para}</p>)
          )}
        </div>
      </div>
    </div>
  );
}

function ImageBlock({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  if (!S(p.image) && !edit) return null;
  return (
    <div className="section pb-0 pt-10">
      <div className="shell">
        <figure>
          <div className={`relative aspect-[16/9] w-full overflow-hidden border border-[var(--line)] ${p.rounded === false ? "" : "rounded-2xl"}`}>
            {S(p.image) ? (
              <Image src={S(p.image)} alt={S(p.caption)} fill sizes="100vw" className="object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-[var(--muted)]">Pick an image in the panel →</div>
            )}
          </div>
          <T edit={edit} path={["caption"]} value={S(p.caption)} tag="figcaption" className="mt-3 text-sm text-[var(--muted)]" hideEmpty placeholder="Caption" />
        </figure>
      </div>
    </div>
  );
}

function ImageText({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  const imgLeft = p.imageLeft !== false;
  return (
    <div className="section pb-0">
      <div className="shell grid items-center gap-10 md:grid-cols-2 lg:gap-16">
        <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl ${imgLeft ? "" : "md:order-2"}`}>
          {S(p.image) && <Image src={S(p.image)} alt={S(p.title)} fill sizes="(max-width:768px) 100vw, 48vw" className="object-cover" />}
        </div>
        <div className={imgLeft ? "" : "md:order-1"}>
          <T edit={edit} path={["title"]} value={S(p.title)} tag="h3" className="display-m" hideEmpty placeholder="Title" />
          <div className="mt-5 max-w-[46ch] space-y-4 text-[var(--bone-dim)]">
            {edit ? (
              <InlineText tag="div" value={S(p.body)} multiline placeholder="Body…" onCommit={(v) => edit(["body"], v)} />
            ) : (
              paragraphs(p.body).map((para, i) => <p key={i}>{para}</p>)
            )}
          </div>
          {(edit || S(p.buttonLabel)) && (
            <Link href={S(p.buttonHref) || "/contact"} onClick={linkGuard(edit)} className="btn btn-ghost mt-7">
              <T edit={edit} path={["buttonLabel"]} value={S(p.buttonLabel)} placeholder="Button" /><span className="btn-icon" aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Gallery({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
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
            <T edit={edit} path={["images", i, "caption"]} value={S(im.caption)} tag="figcaption" className="mt-2 text-sm text-[var(--muted)]" hideEmpty placeholder="Caption" />
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

function Buttons({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  const items = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
  if (items.length === 0) return null;
  return (
    <div className="section pb-0 pt-10">
      <div className="shell flex flex-wrap gap-4">
        {items.map((b, i) => (
          <Link key={i} href={S(b.href) || "/"} onClick={linkGuard(edit)} className={btnCls(b.style)}>
            <T edit={edit} path={["items", i, "label"]} value={S(b.label)} placeholder="Label" /><span className="btn-icon" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Quote({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  return (
    <div className="section pb-0">
      <div className="shell">
        <figure className="max-w-[46ch]">
          <span className="text-5xl leading-none text-[var(--gold)]" aria-hidden="true">&ldquo;</span>
          <T edit={edit} path={["quote"]} value={S(p.quote)} tag="blockquote" className="mt-3 text-xl text-[var(--bone)]" multiline placeholder="Quote…" />
          {(edit || S(p.name) || S(p.role)) && (
            <figcaption className="mt-5">
              <T edit={edit} path={["name"]} value={S(p.name)} tag="span" className="font-semibold" hideEmpty placeholder="Name" />
              <T edit={edit} path={["role"]} value={S(p.role)} tag="div" className="text-sm text-[var(--muted)]" hideEmpty placeholder="Role / company" />
            </figcaption>
          )}
        </figure>
      </div>
    </div>
  );
}

function Stats({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  const items = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
  return (
    <div className="section pb-0">
      <div className="shell grid gap-10 border-y border-[var(--line)] py-12 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s, i) => (
          <div key={i}>
            <div className="display-m font-semibold">
              <T edit={edit} path={["items", i, "value"]} value={S(s.value)} placeholder="00" />
              <T edit={edit} path={["items", i, "suffix"]} value={S(s.suffix)} className="text-[var(--gold)]" hideEmpty placeholder="+" />
            </div>
            <T edit={edit} path={["items", i, "label"]} value={S(s.label)} tag="p" className="mt-2 text-sm uppercase tracking-[0.15em] text-[var(--muted)]" placeholder="Label" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Features({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  const items = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
  return (
    <div className="section pb-0">
      <div className="shell">
        <T edit={edit} path={["title"]} value={S(p.title)} tag="h2" className="display-l max-w-[20ch]" hideEmpty placeholder="Section title" />
        <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${S(p.title) ? "mt-12" : ""}`}>
          {items.map((f, i) => (
            <div key={i} className="card overflow-hidden">
              {S(f.image) && (
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image src={S(f.image)} alt={S(f.title)} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
                </div>
              )}
              <div className="p-6">
                <T edit={edit} path={["items", i, "title"]} value={S(f.title)} tag="h3" className="text-lg font-semibold" placeholder="Title" />
                <T edit={edit} path={["items", i, "body"]} value={S(f.body)} tag="p" className="mt-2 text-sm text-[var(--muted)]" multiline placeholder="Body" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Faq({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  const items = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
  const [open, setOpen] = useState(0);
  return (
    <div className="section pb-0">
      <div className="shell max-w-3xl space-y-4">
        {items.map((f, i) => {
          const isOpen = open === i || Boolean(edit);
          return (
            <div key={i} className="card p-6 transition-colors duration-300 hover:border-[var(--line-strong)]">
              <button onClick={() => setOpen(isOpen ? -1 : i)} className="flex w-full items-center justify-between gap-6 text-left">
                <T edit={edit} path={["items", i, "q"]} value={S(f.q)} tag="span" className="text-lg font-medium" placeholder="Question" />
                <span className="text-xl text-[var(--gold)] transition-transform duration-500" style={{ transform: isOpen ? "rotate(45deg)" : "none" }} aria-hidden="true">+</span>
              </button>
              <div className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                <div className="overflow-hidden">
                  <T edit={edit} path={["items", i, "a"]} value={S(f.a)} tag="p" className="pt-4 text-sm text-[var(--muted)]" multiline placeholder="Answer" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cta({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  return (
    <div className="section pb-0">
      <div className="shell">
        <section data-nav-tone="dark" className="relative overflow-hidden rounded-3xl px-8 py-16 text-center md:py-24" style={{ color: "var(--on-media)" }}>
          <div className="absolute inset-0">
            {S(p.image) && <Image src={S(p.image)} alt="" fill sizes="100vw" className="object-cover" />}
            <div className="absolute inset-0" style={{ background: "rgba(10,11,13,0.72)" }} aria-hidden="true" />
          </div>
          <div className="relative">
            <T edit={edit} path={["title"]} value={S(p.title)} tag="h2" className="display-l mx-auto max-w-[18ch]" placeholder="Title" />
            <T edit={edit} path={["body"]} value={S(p.body)} tag="p" className="mx-auto mt-5 max-w-[48ch]" style={{ color: "var(--on-media-dim)" }} multiline hideEmpty placeholder="Body" />
            {(edit || S(p.buttonLabel)) && (
              <Link href={S(p.buttonHref) || "/contact"} onClick={linkGuard(edit)} className="btn btn-grad mt-8">
                <T edit={edit} path={["buttonLabel"]} value={S(p.buttonLabel)} placeholder="Button" /><span className="btn-icon" aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ContactFormBlock({ p, ctx, edit }: { p: Record<string, unknown>; ctx: BlockCtx; edit: Edit }) {
  return (
    <div className="section pb-0">
      <div className="shell">
        <div className="card-grad mx-auto max-w-3xl p-6 md:p-10">
          <T edit={edit} path={["title"]} value={S(p.title)} tag="h2" className="display-m mb-2" hideEmpty placeholder="Title" />
          <T edit={edit} path={["body"]} value={S(p.body)} tag="p" className="mb-6 text-[var(--bone-dim)]" multiline hideEmpty placeholder="Intro" />
          <ContactForm serviceOptions={ctx.serviceOptions} />
        </div>
      </div>
    </div>
  );
}

function Columns({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  const items = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
  if (items.length === 0) return null;
  const cols = Math.min(4, Math.max(1, items.length));
  return (
    <div className="section pb-0">
      <div className={`shell grid gap-8 sm:grid-cols-2 ${cols >= 3 ? "lg:grid-cols-3" : ""} ${cols >= 4 ? "xl:grid-cols-4" : ""}`}>
        {items.map((c, i) => (
          <div key={i}>
            <T edit={edit} path={["items", i, "heading"]} value={S(c.heading)} tag="h3" className="text-lg font-semibold" hideEmpty placeholder="Heading" />
            <div className="mt-2 text-[var(--bone-dim)]">
              {edit ? (
                <InlineText tag="div" value={S(c.body)} multiline placeholder="Text…" onCommit={(v) => edit(["items", i, "body"], v)} />
              ) : (
                paragraphs(c.body).map((para, j) => <p key={j} className="mt-2 first:mt-0">{para}</p>)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Embed({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  const html = S(p.html);
  return (
    <div className="section pb-0 pt-10">
      <div className="shell">
        {html ? (
          <div className={`[&_iframe]:w-full [&_iframe]:rounded-2xl ${edit ? "pointer-events-none" : ""}`} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="grid min-h-[120px] place-items-center rounded-2xl border border-dashed border-[var(--line-strong)] text-sm text-[var(--muted)]">
            {edit ? "Paste an embed or HTML in the panel →" : null}
          </div>
        )}
        <T edit={edit} path={["caption"]} value={S(p.caption)} tag="p" className="mt-3 text-sm text-[var(--muted)]" hideEmpty placeholder="Caption" />
      </div>
    </div>
  );
}

function Clients({ p, edit }: { p: Record<string, unknown>; edit: Edit }) {
  const names = Array.isArray(p.names) ? (p.names as unknown[]).map(String) : [];
  return (
    <div className="section pb-0 pt-12">
      <div className="shell text-center">
        <T edit={edit} path={["label"]} value={S(p.label)} tag="span" className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]" hideEmpty placeholder="Label" />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
          {names.map((n, i) => (
            <T key={i} edit={edit} path={["names", i]} value={n} tag="span" className="text-2xl font-bold text-[var(--bone-dim)]" hideEmpty placeholder="Name" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Block({ block, ctx, edit }: { block: PageBlock; ctx: BlockCtx; edit: Edit }) {
  const p = block.props ?? {};
  switch (block.type) {
    case "hero": return <Hero p={p} edit={edit} />;
    case "heading": return <Heading p={p} edit={edit} />;
    case "text": return <TextBlock p={p} edit={edit} />;
    case "image": return <ImageBlock p={p} edit={edit} />;
    case "imageText": return <ImageText p={p} edit={edit} />;
    case "gallery": return <Gallery p={p} edit={edit} />;
    case "video": return <Video p={p} />;
    case "buttons": return <Buttons p={p} edit={edit} />;
    case "quote": return <Quote p={p} edit={edit} />;
    case "stats": return <Stats p={p} edit={edit} />;
    case "features": return <Features p={p} edit={edit} />;
    case "faq": return <Faq p={p} edit={edit} />;
    case "cta": return <Cta p={p} edit={edit} />;
    case "columns": return <Columns p={p} edit={edit} />;
    case "container": return null;
    case "embed": return <Embed p={p} edit={edit} />;
    case "divider": return <div className="shell pt-14"><hr className="border-[var(--line)]" /></div>;
    case "spacer": return <div style={{ height: `${Math.min(24, Math.max(0, Number(p.size) || 0))}rem` }} aria-hidden="true" />;
    case "contactForm": return <ContactFormBlock p={p} ctx={ctx} edit={edit} />;
    case "clients": return <Clients p={p} edit={edit} />;
    default: return null;
  }
}

function renderNode(
  node: PageBlock,
  ctx: BlockCtx,
  edit: ((blockId: string, path: (string | number)[], value: string) => void) | undefined,
  flexItem = false,
): ReactNode {
  const editForNode: Edit = edit ? (path, value) => edit(node.id, path, value) : undefined;
  const inner = <Block block={node} ctx={ctx} edit={editForNode} />;
  const kids = node.children?.length ? node.children.map((c) => renderNode(c, ctx, edit, node.type === "container")) : null;
  // solidBox for flex items: a container child must stay a real box — emitted
  // display:contents would make flex layout dissolve it.
  const css = nodeCss(node, { solidBox: flexItem });
  const hasWrap = Boolean(css || kids || node.style || node.advanced);

  if (!hasWrap) return <Fragment key={node.id}>{inner}</Fragment>;

  const { className, id } = wrapperAttrs(node);
  return (
    <div
      key={node.id}
      className={className}
      id={id}
      data-node={node.id}
    >
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {inner}
      {kids}
    </div>
  );
}

export default function BlockRenderer({
  blocks,
  ctx,
  edit,
}: {
  blocks: PageBlock[];
  ctx: BlockCtx;
  /** Editor only: (blockId, path, value) commits an inline text edit. */
  edit?: (blockId: string, path: (string | number)[], value: string) => void;
}) {
  return (
    <>
      {blocks.map((b) => renderNode(b, ctx, edit))}
      {/* bottom rhythm so the last block breathes before the footer */}
      <div className="pb-[clamp(4rem,9vw,8rem)]" aria-hidden="true" />
    </>
  );
}
