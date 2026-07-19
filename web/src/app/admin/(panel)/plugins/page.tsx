import { getBlock } from "@/lib/content";
import { INSTALLED_PLUGINS } from "@/plugins/registry";
import PluginsManager, { type PluginRow } from "@/components/admin/PluginsManager";

export const metadata = { title: "Plugins" };

export default async function AdminPlugins() {
  const { states } = await getBlock("plugins");
  const plugins: PluginRow[] = INSTALLED_PLUGINS.map((p) => {
    const state = states.find((s) => s.id === p.id);
    return {
      id: p.id,
      name: p.name,
      version: p.version,
      author: p.author,
      description: p.description,
      active: state?.active ?? false,
      settings: { ...p.defaultSettings, ...(state?.settings ?? {}) },
      settingsFields: p.settingsFields,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Plugins</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Extend the site without touching its code. New plugins are added as small code modules
          (ask your developer or Claude Code), then activated and configured here.
        </p>
      </div>
      <PluginsManager plugins={plugins} />
    </div>
  );
}
