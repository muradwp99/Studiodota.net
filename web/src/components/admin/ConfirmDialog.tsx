"use client";

import { useEffect, useRef } from "react";
import { btnGhostCls, btnPrimaryCls, btnDangerCls } from "@/components/admin/ui";

/**
 * Shared, styled, accessible confirmation dialog — replaces every native
 * window.confirm() and adds the confirmations that don't exist today.
 * `tone`: "reversible" (gold primary, e.g. Move to Trash) or "danger"
 * (quiet-danger, e.g. permanent delete / leave-without-saving). Focus lands on
 * the SAFE button so a stray Enter cancels rather than destroys.
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  pending = false,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "reversible" | "danger";
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Tab") {
        // Minimal focus trap.
        const nodes = panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("lenis-stopped");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(10,11,13,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-bold">{title}</h2>
        <div id="confirm-body" className="mt-2 text-sm text-[var(--bone-dim)]">{body}</div>
        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-[#a33]/30 bg-[#a33]/8 px-3 py-2 text-sm text-[#a33]">{error}</p>
        )}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} className={btnGhostCls} disabled={pending}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={tone === "reversible" ? btnPrimaryCls : btnDangerCls}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
