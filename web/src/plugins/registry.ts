import type { PluginManifest } from "@/plugins/types";
import { whatsappChat } from "@/plugins/whatsapp-chat";

/**
 * Installed plugins. To install a new plugin, create its folder under
 * `src/plugins/<id>/` and add it to this array — it then appears in
 * Admin → Plugins where it can be activated and configured.
 */
export const INSTALLED_PLUGINS: PluginManifest[] = [whatsappChat];

export const getPlugin = (id: string) => INSTALLED_PLUGINS.find((p) => p.id === id);
