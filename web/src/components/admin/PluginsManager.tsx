"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPluginActive, savePluginSettings } from "@/lib/actions/plugins";
import type { FieldSpec } from "@/lib/pageRegistry";
import FieldsRenderer, { setAt, type Json, type Path } from "@/components/admin/FieldsRenderer";
import { btnPrimaryCls, Notice } from "@/components/admin/ui";

export type PluginRow = {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  active: boolean;
  settings: Json;
  settingsFields: FieldSpec[];
};

function PluginItem({ plugin }: { plugin: PluginRow }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Json>(plugin.settings);
  const [state, setState] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () =>
    startTransition(async () => {
      const res = await setPluginActive(plugin.id, !plugin.active);
      setState(res.error ? res : null);
      router.refresh();
    });

  const save = () =>
    startTransition(async () => {
      const res = await savePluginSettings(plugin.id, settings);
      setState(res);
      if (res.ok) router.refresh();
    });

  // Active rows mirror WordPress's plugin list: thin accent edge + faint tint.
  return (
    <li className={`px-5 py-4 ${plugin.active ? "border-l-2 border-[var(--gold)] bg-[var(--gold)]/[0.045]" : "border-l-2 border-transparent"}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-bold">{plugin.name}</span>
        <button
          type="button"
          disabled={pending}
          onClick={toggle}
          className={`text-sm hover:underline disabled:opacity-50 ${plugin.active ? "text-[#a33]" : "text-[var(--gold-ink)]"}`}
        >
          {pending ? "Working…" : plugin.active ? "Deactivate" : "Activate"}
        </button>
        {plugin.active && plugin.settingsFields.length > 0 && (
          <button type="button" className="text-sm text-[var(--gold-ink)] hover:underline" onClick={() => setSettingsOpen((v) => !v)} aria-expanded={settingsOpen}>
            {settingsOpen ? "Close settings" : "Settings"}
          </button>
        )}
      </div>
      <p className="mt-1.5 text-sm text-[var(--bone-dim)]">{plugin.description}</p>
      <p className="mt-1 font-mono text-[0.65rem] text-[var(--muted)]">Version {plugin.version} · By {plugin.author}</p>
      {plugin.active && settingsOpen && (
        <div className="mt-4 space-y-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/40 p-4">
          <FieldsRenderer
            fields={plugin.settingsFields}
            data={settings}
            onChange={(path: Path, value: unknown) => {
              setSettings((s) => setAt(s, path, value) as Json);
              setState(null);
            }}
            idPrefix={`plugin.${plugin.id}`}
          />
          <Notice state={state} />
          <button type="button" onClick={save} disabled={pending} className={btnPrimaryCls}>
            {pending ? "Saving…" : "Save settings"}
          </button>
        </div>
      )}
      {!settingsOpen && <Notice state={state} />}
    </li>
  );
}

export default function PluginsManager({ plugins }: { plugins: PluginRow[] }) {
  return (
    <ul className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      {plugins.map((p) => <PluginItem key={p.id} plugin={p} />)}
      {plugins.length === 0 && <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">No plugins installed.</li>}
    </ul>
  );
}
