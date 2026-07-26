"use client";

/* Shared admin form styling + tiny primitives (tokens from globals.css). */

export const inputCls =
  "w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--bone)] outline-none transition-colors duration-200 placeholder:text-[var(--muted)] focus:border-[var(--gold)]";
export const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--bone-dim)]";
export const btnCls =
  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimaryCls = `${btnCls} bg-[var(--gold)] text-[#17191c] hover:bg-[var(--gold-hi)]`;
export const btnGhostCls = `${btnCls} border border-[var(--line-strong)] text-[var(--bone)] hover:border-[var(--gold)] hover:text-[var(--gold-ink)]`;
export const btnDangerCls = `${btnCls} border border-transparent text-[#a33] hover:bg-[#a33]/10`;

/** "3 hours ago" — used next to the revert-to-last-saved-version button. */
export function timeAgo(date: Date | string): string {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function Notice({ state, okMessage }: { state: { ok?: boolean; error?: string; savedAt?: number } | null; okMessage?: string }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p role="alert" className="rounded-lg border border-[#a33]/30 bg-[#a33]/8 px-4 py-2.5 text-sm text-[#a33]">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" className="rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-2.5 text-sm text-[var(--gold-ink)]">
        {okMessage ?? "Saved — the live site is updated."}
      </p>
    );
  }
  return null;
}
