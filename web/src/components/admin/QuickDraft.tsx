"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { quickDraft } from "@/lib/actions/dashboard";
import { inputCls, labelCls, btnPrimaryCls } from "@/components/admin/ui";

export default function QuickDraft() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = () =>
    startTransition(async () => {
      setError("");
      const res = await quickDraft({ title, content });
      if (res.ok && res.id) {
        setCreated(res.id);
        setTitle("");
        setContent("");
        router.refresh();
      } else {
        setError(res.error ?? "Could not create the draft.");
      }
    });

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="qd-title" className={labelCls}>Title</label>
        <input id="qd-title" className={inputCls} value={title} onChange={(e) => { setTitle(e.target.value); setCreated(null); }} placeholder="An idea for an article" />
      </div>
      <div>
        <label htmlFor="qd-content" className={labelCls}>Content</label>
        <textarea id="qd-content" rows={4} className={inputCls} value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's on your mind?" />
      </div>
      {error && <p role="alert" className="text-sm text-[#a33]">{error}</p>}
      {created && (
        <p role="status" className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-2.5 text-sm text-[var(--gold-ink)]">
          Draft created — <Link href={`/admin/posts/${created}`} className="font-semibold underline">edit it now</Link> or find it under Posts.
        </p>
      )}
      <button type="button" onClick={save} disabled={pending || !title.trim()} className={btnPrimaryCls}>
        {pending ? "Saving…" : "Save Draft"}
      </button>
    </div>
  );
}
