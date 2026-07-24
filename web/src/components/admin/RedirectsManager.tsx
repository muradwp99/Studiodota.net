"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRedirect, deleteRedirect, type RedirectState } from "@/lib/actions/redirects";
import { inputCls, labelCls, btnPrimaryCls, btnDangerCls, Notice } from "@/components/admin/ui";

type Row = { id: string; from: string; to: string; permanent: boolean };

export default function RedirectsManager({ initial }: { initial: Row[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [perm, setPerm] = useState(true);
  const [state, setState] = useState<RedirectState | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const add = () =>
    start(async () => {
      const r = await saveRedirect({ from, to, permanent: perm });
      setState(r);
      if (r.ok) { setFrom(""); setTo(""); router.refresh(); }
    });

  const remove = (id: string) =>
    start(async () => { await deleteRedirect(id); router.refresh(); });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="from" className={labelCls}>From (old path)</label>
            <input id="from" className={`${inputCls} font-mono text-xs`} value={from} onChange={(e) => { setFrom(e.target.value); setState(null); }} placeholder="/old-page" />
          </div>
          <div>
            <label htmlFor="to" className={labelCls}>To (new path or URL)</label>
            <input id="to" className={`${inputCls} font-mono text-xs`} value={to} onChange={(e) => { setTo(e.target.value); setState(null); }} placeholder="/new-page" />
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" checked={perm} onChange={(e) => setPerm(e.target.checked)} />
          Permanent (301/308) — uncheck for a temporary (302/307) redirect
        </label>
        <div className="mt-4"><Notice state={state} /></div>
        <button type="button" onClick={add} disabled={pending || !from || !to} className={`${btnPrimaryCls} mt-4`}>
          {pending ? "Saving…" : "Add redirect"}
        </button>
      </div>

      {initial.length === 0 ? (
        <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-8 text-center text-sm text-[var(--muted)]">No redirects yet.</p>
      ) : (
        <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {initial.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <code className="font-mono text-xs text-[var(--bone)]">{r.from}</code>
              <span aria-hidden="true" className="text-[var(--muted)]">→</span>
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--gold-ink)]">{r.to}</code>
              <span className="shrink-0 rounded-full border border-[var(--line-strong)] px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.08em] text-[var(--muted)]">{r.permanent ? "301" : "302"}</span>
              <button type="button" onClick={() => remove(r.id)} disabled={pending} className={`${btnDangerCls} shrink-0`}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
