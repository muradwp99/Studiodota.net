"use client";

import { useState, useTransition } from "react";
import { saveBlock, type SaveState } from "@/lib/actions/blocks";
import type { FieldSpec } from "@/lib/pageRegistry";
import FieldsRenderer, { setAt, type Json, type Path } from "@/components/admin/FieldsRenderer";
import { btnPrimaryCls, Notice } from "@/components/admin/ui";

export default function BlockEditor({
  blockKey,
  title,
  description,
  fields,
  initial,
}: {
  blockKey: string;
  title: string;
  description?: string;
  fields: FieldSpec[];
  initial: Json;
}) {
  const [data, setData] = useState<Json>(initial);
  const [state, setState] = useState<SaveState | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (path: Path, value: unknown) => {
    setData((d) => setAt(d, path, value) as Json);
    setState(null);
  };

  const save = () =>
    startTransition(async () => {
      setState(await saveBlock(blockKey, data));
    });

  return (
    <section id={blockKey} className="scroll-mt-24 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {description && <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>}
        </div>
        <button type="button" onClick={save} disabled={pending} className={btnPrimaryCls}>
          {pending ? "Saving…" : "Save section"}
        </button>
      </div>
      <FieldsRenderer fields={fields} data={data} onChange={update} idPrefix={blockKey} />
      <div className="mt-5 space-y-3">
        <Notice state={state} />
        <div className="flex justify-end">
          <button type="button" onClick={save} disabled={pending} className={btnPrimaryCls}>
            {pending ? "Saving…" : "Save section"}
          </button>
        </div>
      </div>
    </section>
  );
}
