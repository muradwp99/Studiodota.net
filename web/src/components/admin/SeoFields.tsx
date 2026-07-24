"use client";

import { inputCls, labelCls } from "@/components/admin/ui";

/**
 * Collapsible SEO + indexing controls shared by Project and Post forms.
 * Empty title/description fall back to the item's title/summary on the public
 * page; `noindex` adds a robots noindex tag to that page.
 */
export function SeoFields({
  seoTitle,
  seoDescription,
  noindex,
  fallbackTitle,
  onChange,
}: {
  seoTitle: string;
  seoDescription: string;
  noindex: boolean;
  fallbackTitle?: string;
  onChange: (patch: { seoTitle?: string; seoDescription?: string; noindex?: boolean }) => void;
}) {
  return (
    <details className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 open:pb-5">
      <summary className="cursor-pointer select-none text-sm font-semibold">
        SEO &amp; indexing <span className="font-normal normal-case text-[var(--muted)]">— optional</span>
      </summary>
      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="seoTitle" className={labelCls}>Search title</label>
          <input
            id="seoTitle"
            className={inputCls}
            value={seoTitle}
            maxLength={200}
            placeholder={fallbackTitle ? `Defaults to: ${fallbackTitle}` : "Leave blank to use the title"}
            onChange={(e) => onChange({ seoTitle: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="seoDescription" className={labelCls}>Search description</label>
          <textarea
            id="seoDescription"
            rows={2}
            className={inputCls}
            value={seoDescription}
            maxLength={320}
            placeholder="Leave blank to use the summary/excerpt"
            onChange={(e) => onChange({ seoDescription: e.target.value })}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">{seoDescription.length}/320 · aim for 150–160 characters.</p>
        </div>
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" checked={noindex} onChange={(e) => onChange({ noindex: e.target.checked })} />
          Hide this page from search engines (noindex)
        </label>
      </div>
    </details>
  );
}
