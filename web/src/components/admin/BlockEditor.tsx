"use client";

import { useState, useTransition } from "react";
import { saveBlockDraft, publishBlock, revertBlock, discardDraft, type SaveState } from "@/lib/actions/blocks";
import type { FieldSpec } from "@/lib/pageRegistry";
import FieldsRenderer, { getAt, setAt, type Json, type Path } from "@/components/admin/FieldsRenderer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { btnPrimaryCls, btnGhostCls, Notice } from "@/components/admin/ui";

type DiffRow = { key: string; label: string; field: FieldSpec; live: unknown; draft: unknown };

/** Walks the same field spec FieldsRenderer does, collecting every leaf where
 *  the live and draft values differ. Lists are diffed by position (not true
 *  sequence alignment) — good enough for "what changed", not a real merge tool. */
function collectDiffs(fields: FieldSpec[], live: Json, draft: Json, base: Path = [], prefix = ""): DiffRow[] {
  const rows: DiffRow[] = [];
  for (const f of fields) {
    const path = [...base, f.key];
    if (f.kind === "group") {
      rows.push(...collectDiffs(f.fields, live, draft, path, `${prefix}${f.label} — `));
      continue;
    }
    if (f.kind === "list") {
      const liveArr = Array.isArray(getAt(live, path)) ? (getAt(live, path) as unknown[]) : [];
      const draftArr = Array.isArray(getAt(draft, path)) ? (getAt(draft, path) as unknown[]) : [];
      for (let i = 0; i < Math.max(liveArr.length, draftArr.length); i++) {
        rows.push(...collectDiffs(f.item, live, draft, [...path, i], `${prefix}${f.label} #${i + 1} — `));
      }
      continue;
    }
    const liveVal = getAt(live, path);
    const draftVal = getAt(draft, path);
    if (JSON.stringify(liveVal) === JSON.stringify(draftVal)) continue;
    rows.push({ key: path.join("."), label: `${prefix}${f.label}`, field: f, live: liveVal, draft: draftVal });
  }
  return rows;
}

/** Renders one side (live or draft) of a diff row, per field kind. */
function DiffValue({ field, value }: { field: FieldSpec; value: unknown }) {
  if (field.kind === "image") {
    const v = String(value ?? "");
    return v ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={v} alt="" className="h-10 w-14 rounded border border-[var(--line)] object-cover" />
    ) : (
      <span className="text-[var(--muted)]">— none —</span>
    );
  }
  // ponytail: SEO is a ~13-field blob not modeled by FieldSpec — flag it as
  // changed rather than building a second field list to diff it in detail.
  if (field.kind === "seo") return <span className="italic text-[var(--muted)]">SEO fields changed</span>;
  if (field.kind === "toggle") return <span>{value ? "On" : "Off"}</span>;
  if (field.kind === "select") {
    const label = field.options.find((o) => o.value === value)?.label;
    return <span>{label ?? String(value ?? "—")}</span>;
  }
  if (field.kind === "stringList") {
    const arr = Array.isArray(value) ? value.map(String) : [];
    return <span>{arr.length ? arr.join(", ") : "— empty —"}</span>;
  }
  const s = String(value ?? "");
  return <span className="whitespace-pre-wrap">{s.length > 160 ? `${s.slice(0, 160)}…` : s || "— empty —"}</span>;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function BlockEditor({
  blockKey,
  title,
  description,
  fields,
  initial,
  draft: initialDraft,
  snapshotAt: initialSnapshotAt,
  updatedAt: initialUpdatedAt,
}: {
  blockKey: string;
  title: string;
  description?: string;
  fields: FieldSpec[];
  initial: Json;
  /** Saved-but-unpublished value, if any. */
  draft?: Json | null;
  /** When the last publish/revert stashed a snapshot — null means nothing to revert to. */
  snapshotAt?: string | null;
  /** Block row's updatedAt, used as an approximate "edited … ago" for the draft. */
  updatedAt?: string | null;
}) {
  const [live, setLive] = useState<Json>(initial);
  const [draftBaseline, setDraftBaseline] = useState<Json | null>(initialDraft ?? null);
  const [snapshotAt, setSnapshotAt] = useState<string | null>(initialSnapshotAt ?? null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(initialUpdatedAt ?? null);
  const [formData, setFormData] = useState<Json>(initialDraft ?? initial);
  const [state, setState] = useState<SaveState | null>(null);
  const [okMessage, setOkMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmRevert, setConfirmRevert] = useState(false);
  const [discardError, setDiscardError] = useState<string | null>(null);
  const [revertError, setRevertError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (path: Path, value: unknown) => {
    setFormData((d) => setAt(d, path, value) as Json);
    setState(null);
  };

  /** Applies a successful action's result to local state — including
   *  re-deriving the visible form as (fresh draft ?? fresh live), the same
   *  rule used to pick the form's starting value on load. */
  const applyResult = (res: SaveState) => {
    setState(res);
    if (!res.ok) return;
    const freshLive = res.data !== undefined ? (res.data as Json) : live;
    const freshDraft = res.draft !== undefined ? (res.draft as Json | null) : draftBaseline;
    if (res.data !== undefined) setLive(freshLive);
    if (res.draft !== undefined) setDraftBaseline(freshDraft);
    if (res.snapshotAt !== undefined) setSnapshotAt(res.snapshotAt ?? null);
    if (res.draft !== undefined) setDraftSavedAt(new Date().toISOString());
    setFormData(freshDraft ?? freshLive);
  };

  const saveDraft = () =>
    startTransition(async () => {
      setOkMessage("Draft saved — not live yet.");
      applyResult(await saveBlockDraft(blockKey, formData));
    });

  const publish = () =>
    startTransition(async () => {
      setOkMessage("Published — the live site is updated.");
      applyResult(await publishBlock(blockKey, formData));
    });

  const discard = () =>
    startTransition(async () => {
      const res = await discardDraft(blockKey);
      if (res.error) { setDiscardError(res.error); return; }
      setDiscardError(null);
      setConfirmDiscard(false);
      setOkMessage("Draft discarded.");
      applyResult(res);
    });

  const revert = () =>
    startTransition(async () => {
      const res = await revertBlock(blockKey);
      if (res.error) { setRevertError(res.error); return; }
      setRevertError(null);
      setConfirmRevert(false);
      setOkMessage("Reverted — the live site is updated.");
      applyResult(res);
    });

  const draftDiffers = draftBaseline != null && JSON.stringify(draftBaseline) !== JSON.stringify(live);
  const diffs = draftBaseline != null ? collectDiffs(fields, live, draftBaseline) : [];

  return (
    <section id={blockKey} className="scroll-mt-24 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={saveDraft} disabled={pending} className={btnGhostCls}>
            {pending ? "Saving…" : "Save Draft"}
          </button>
          <button type="button" onClick={publish} disabled={pending} className={btnPrimaryCls}>
            {pending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <FieldsRenderer fields={fields} data={formData} onChange={update} idPrefix={blockKey} />

      <div className="mt-5 space-y-3">
        <Notice state={state} okMessage={okMessage} />

        {draftDiffers && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-2.5 text-sm text-[var(--gold-ink)]">
            <span>Draft saved — not live yet{draftSavedAt ? ` (edited ${timeAgo(draftSavedAt)})` : ""}.</span>
            <button type="button" onClick={() => setShowPreview((v) => !v)} className="underline hover:no-underline">
              {showPreview ? "Hide changes" : "Preview changes"}
            </button>
            <button type="button" onClick={() => setConfirmDiscard(true)} disabled={pending} className="text-[var(--muted)] underline hover:no-underline disabled:opacity-50">
              Discard draft
            </button>
          </div>
        )}

        {showPreview && draftDiffers && (
          <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/40 p-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--bone-dim)]">Preview changes</h3>
            {diffs.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No visible differences.</p>
            ) : (
              <ul className="space-y-3">
                {diffs.map((d) => (
                  <li key={d.key} className="text-sm">
                    <div className="mb-1 font-semibold text-[var(--bone)]">{d.label}</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Live</span>
                        <div className="text-[var(--bone-dim)]"><DiffValue field={d.field} value={d.live} /></div>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wide text-[var(--gold-ink)]">Draft</span>
                        <div className="text-[var(--bone)]"><DiffValue field={d.field} value={d.draft} /></div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {snapshotAt && (
          <div className="text-sm">
            <button type="button" onClick={() => setConfirmRevert(true)} disabled={pending} className="text-[var(--gold-ink)] underline hover:no-underline disabled:opacity-50">
              Revert to version from {formatWhen(snapshotAt)}
            </button>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={saveDraft} disabled={pending} className={btnGhostCls}>
            {pending ? "Saving…" : "Save Draft"}
          </button>
          <button type="button" onClick={publish} disabled={pending} className={btnPrimaryCls}>
            {pending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard draft?"
        body="The unpublished changes are thrown away. The live version is not affected. This can't be undone."
        confirmLabel="Discard draft"
        tone="danger"
        pending={pending}
        error={discardError}
        onConfirm={discard}
        onCancel={() => { setConfirmDiscard(false); setDiscardError(null); }}
      />
      <ConfirmDialog
        open={confirmRevert}
        title="Revert to the previous version?"
        body={snapshotAt ? `This replaces the current live content with the version from ${formatWhen(snapshotAt)}. This can't be undone.` : ""}
        confirmLabel="Revert"
        tone="danger"
        pending={pending}
        error={revertError}
        onConfirm={revert}
        onCancel={() => { setConfirmRevert(false); setRevertError(null); }}
      />
    </section>
  );
}
