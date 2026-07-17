"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { listMedia, uploadMedia } from "@/lib/actions/media";
import { btnGhostCls, btnPrimaryCls } from "@/components/admin/ui";

type MediaRow = { id: string; path: string; alt: string };

/**
 * Modal media browser + uploader. onSelect receives the public path.
 */
export default function MediaPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}) {
  const [items, setItems] = useState<MediaRow[] | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    listMedia()
      .then((rows) => alive && setItems(rows))
      .catch(() => alive && setError("Could not load the media library."));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const upload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    setError("");
    startTransition(async () => {
      const res = await uploadMedia(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.path) {
        const rows = await listMedia().catch(() => null);
        if (rows) setItems(rows);
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Media library"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: "rgba(10,11,13,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[84vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] p-5">
          <h2 className="text-lg font-bold">Media library</h2>
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="text-xs" />
            <button type="button" onClick={upload} disabled={pending} className={btnPrimaryCls}>
              {pending ? "Uploading…" : "Upload"}
            </button>
            <button type="button" onClick={onClose} className={btnGhostCls} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
        {error && <p className="px-5 pt-4 text-sm text-[#a33]">{error}</p>}
        <div className="grid grid-cols-2 gap-4 overflow-y-auto p-5 sm:grid-cols-3 md:grid-cols-4">
          {items === null && <p className="text-sm text-[var(--muted)]">Loading…</p>}
          {items?.length === 0 && <p className="text-sm text-[var(--muted)]">No media yet — upload your first image above.</p>}
          {items?.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSelect(m.path);
                onClose();
              }}
              className="group overflow-hidden rounded-xl border border-[var(--line)] text-left transition-colors hover:border-[var(--gold)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.path} alt={m.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div className="truncate px-2.5 py-2 font-mono text-[0.62rem] text-[var(--muted)] group-hover:text-[var(--bone)]">
                {m.path}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
