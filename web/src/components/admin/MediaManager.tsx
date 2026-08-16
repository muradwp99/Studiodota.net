"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadMedia, deleteMedia, updateMediaAlt } from "@/lib/actions/media";
import { btnPrimaryCls, inputCls, Notice } from "@/components/admin/ui";

type MediaRow = { id: string; path: string; alt: string; size: number; mime: string; deletable: boolean };

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function MediaManager({ items }: { items: MediaRow[] }) {
  const [state, setState] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const upload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setState({ error: "Choose a file first." });
      return;
    }
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const res = await uploadMedia(fd);
      setState(res);
      if (res.ok) {
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      }
    });
  };

  const remove = (m: MediaRow) => {
    if (!window.confirm(`Delete ${m.path}? Anywhere it's used will show a broken image.`)) return;
    startTransition(async () => {
      const res = await deleteMedia(m.id);
      setState(res.error ? res : null);
      router.refresh();
    });
  };

  const copy = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(path);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("");
    }
  };

  const [alts, setAlts] = useState<Record<string, string>>({});
  const [savedAlt, setSavedAlt] = useState("");
  const altValue = (m: MediaRow) => (m.id in alts ? alts[m.id] : m.alt);
  const saveAlt = (m: MediaRow) => {
    const next = altValue(m);
    if (next === m.alt) return;
    startTransition(async () => {
      const res = await updateMediaAlt(m.id, next);
      if (res.ok) {
        setSavedAlt(m.id);
        setTimeout(() => setSavedAlt(""), 1500);
        router.refresh();
      } else {
        setState(res);
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="text-sm" />
        <button type="button" onClick={upload} disabled={pending} className={btnPrimaryCls}>
          {pending ? "Uploading…" : "Upload image"}
        </button>
        <span className="text-xs text-[var(--muted)]">JPEG / PNG / WebP / AVIF / GIF, up to 10 MB.</span>
      </div>
      <Notice state={state} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((m) => (
          <figure key={m.id} className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.path} alt={m.alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            <figcaption className="space-y-2 p-3">
              <div className="truncate font-mono text-[0.62rem] text-[var(--muted)]" title={m.path}>{m.path}</div>
              <div className="font-mono text-[0.62rem] text-[var(--muted)]">{m.mime} · {formatSize(m.size)}</div>
              <div>
                <input
                  aria-label={`Alt text for ${m.path}`}
                  className={`${inputCls} py-1.5 text-xs`}
                  placeholder="Describe this image (alt text)"
                  value={altValue(m)}
                  onChange={(e) => setAlts((a) => ({ ...a, [m.id]: e.target.value }))}
                  onBlur={() => saveAlt(m)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                />
                {savedAlt === m.id && <span className="mt-1 block text-[0.62rem] text-[var(--gold-ink)]">Saved ✓</span>}
              </div>
              <div className="flex items-center justify-between text-xs">
                <button type="button" className="text-[var(--gold-ink)] hover:underline" onClick={() => copy(m.path)}>
                  {copied === m.path ? "Copied ✓" : "Copy path"}
                </button>
                {m.deletable ? (
                  <button type="button" className="text-[#a33] hover:underline" onClick={() => remove(m)}>Delete</button>
                ) : (
                  <span className="text-[var(--muted)]" title="Original site asset — remove from pages instead">built-in</span>
                )}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
