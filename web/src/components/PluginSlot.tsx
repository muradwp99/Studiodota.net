import { getBlock } from "@/lib/content";
import { INSTALLED_PLUGINS } from "@/plugins/registry";
import type { PluginSlotName } from "@/plugins/types";

/** Renders every ACTIVE plugin's component registered for this slot. */
export default async function PluginSlot({ name }: { name: PluginSlotName }) {
  const { states } = await getBlock("plugins");
  return (
    <>
      {INSTALLED_PLUGINS.map((p) => {
        const state = states.find((s) => s.id === p.id);
        if (!state?.active) return null;
        const Component = p.slots[name];
        if (!Component) return null;
        const settings = { ...p.defaultSettings, ...(state.settings ?? {}) };
        return <Component key={p.id} settings={settings} />;
      })}
    </>
  );
}
