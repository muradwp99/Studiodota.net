"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { trashItem, restoreItem, purgeItem, type TrashModel } from "@/lib/actions/trash";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

/** "All (n) | Trash (n)" switcher above a list. Plain links via ?view=. */
export function TrashBar({ basePath, view, allCount, trashCount, extraQuery = "" }: { basePath: string; view: "all" | "trash"; allCount: number; trashCount: number; extraQuery?: string }) {
  const q = extraQuery ? `&${extraQuery}` : "";
  const link = (v: "all" | "trash", label: string, count: number) => (
    <Link
      href={v === "all" ? `${basePath}${extraQuery ? `?${extraQuery}` : ""}` : `${basePath}?view=trash${q}`}
      aria-current={view === v ? "page" : undefined}
      className={`text-sm transition-colors ${view === v ? "font-semibold text-[var(--bone)]" : "text-[var(--muted)] hover:text-[var(--gold-ink)]"}`}
    >
      {label} <span className="text-[var(--muted)]">({count})</span>
    </Link>
  );
  return (
    <div className="flex items-center gap-3">
      {link("all", "All", allCount)}
      <span className="text-[var(--line-strong)]" aria-hidden="true">|</span>
      {link("trash", "Trash", trashCount)}
    </div>
  );
}

/** Small "Trash" action for a live-list row → moves the item to Trash. */
export function RowTrashButton({ model, id, title }: { model: TrashModel; id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const confirm = () =>
    startTransition(async () => {
      const res = await trashItem(model, id);
      if (res.error) setError(res.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });

  return (
    <>
      <button type="button" onClick={() => { setError(null); setOpen(true); }} className="shrink-0 text-xs text-[var(--muted)] transition-colors hover:text-[#a33]">
        Trash
      </button>
      <ConfirmDialog
        open={open}
        title="Move to Trash?"
        body={<>&ldquo;{title}&rdquo; will be moved to Trash. You can restore it any time.</>}
        confirmLabel="Move to Trash"
        tone="reversible"
        pending={pending}
        error={error}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

/** Restore + Delete-permanently, for a row inside the Trash view. */
export function TrashRowActions({ model, id, title }: { model: TrashModel; id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const restore = () =>
    startTransition(async () => {
      const res = await restoreItem(model, id);
      if (res.error) setError(res.error);
      else router.refresh();
    });

  const purge = () =>
    startTransition(async () => {
      const res = await purgeItem(model, id);
      if (res.error) setError(res.error);
      else {
        setOpen(false);
        router.refresh();
      }
    });

  return (
    <span className="flex shrink-0 items-center gap-3 text-xs">
      <button type="button" onClick={restore} disabled={pending} className="text-[var(--gold-ink)] hover:underline disabled:opacity-50">
        Restore
      </button>
      <button type="button" onClick={() => { setError(null); setOpen(true); }} disabled={pending} className="text-[#a33] hover:underline disabled:opacity-50">
        Delete permanently
      </button>
      <ConfirmDialog
        open={open}
        title="Delete permanently?"
        body={
          model === "media"
            ? <>&ldquo;{title}&rdquo; will be permanently deleted and the file removed. Anywhere it&rsquo;s still used will show a broken image. This can&rsquo;t be undone.</>
            : <>&ldquo;{title}&rdquo; will be permanently deleted. This can&rsquo;t be undone.</>
        }
        confirmLabel="Delete permanently"
        tone="danger"
        pending={pending}
        error={error}
        onConfirm={purge}
        onCancel={() => setOpen(false)}
      />
    </span>
  );
}
