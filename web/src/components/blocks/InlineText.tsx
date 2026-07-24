"use client";

import { createElement, useEffect, useRef } from "react";

/**
 * A contentEditable text node for the live editor. Uncontrolled: the initial
 * value is written to the DOM once on mount and never re-applied on re-render
 * (so the caret never jumps), committing back to React state on blur. Not used
 * on the public site — BlockRenderer only mounts this in edit mode.
 */
export default function InlineText({
  value,
  onCommit,
  tag = "span",
  className,
  style,
  multiline = false,
  placeholder,
}: {
  value: string;
  onCommit: (v: string) => void;
  tag?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  // Reconcile the DOM text with `value` on mount AND whenever `value` changes
  // from outside (e.g. an edit in the settings sidebar). Skip while this field
  // is focused so active inline typing never has its caret clobbered.
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  return createElement(tag ?? "span", {
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    role: "textbox",
    "aria-label": placeholder,
    "data-placeholder": placeholder,
    className: `sd-inline ${className ?? ""}`,
    style: { ...(style || {}), ...(multiline ? { whiteSpace: "pre-wrap" as const } : null) },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      const next = e.currentTarget.textContent ?? "";
      if (next !== value) onCommit(next);
    },
  });
}
