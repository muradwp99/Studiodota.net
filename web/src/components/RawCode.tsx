"use client";

import { useEffect } from "react";

/**
 * Injects admin-authored raw HTML/JS (verification meta, fonts, chat widgets)
 * into <head> or the end of <body>. Scripts inserted via innerHTML don't run,
 * so they're recreated as real <script> nodes. Admin-only input by design.
 */
export default function RawCode({ code, target }: { code: string; target: "head" | "body" }) {
  useEffect(() => {
    if (!code || !code.trim()) return;
    const holder = document.createElement("div");
    holder.innerHTML = code;
    const dest = target === "head" ? document.head : document.body;
    const appended: Node[] = [];
    Array.from(holder.childNodes).forEach((node) => {
      if (node.nodeName === "SCRIPT") {
        const src = node as HTMLScriptElement;
        const s = document.createElement("script");
        Array.from(src.attributes).forEach((a) => s.setAttribute(a.name, a.value));
        if (!src.src) s.textContent = src.textContent;
        dest.appendChild(s);
        appended.push(s);
      } else {
        dest.appendChild(node);
        appended.push(node);
      }
    });
    return () => appended.forEach((n) => n.parentNode?.removeChild(n));
  }, [code, target]);
  return null;
}
