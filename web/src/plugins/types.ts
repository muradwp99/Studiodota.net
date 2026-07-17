import type { ComponentType } from "react";
import type { FieldSpec } from "@/lib/pageRegistry";

/**
 * Plugin system. A plugin is a folder under `src/plugins/<id>/` exporting a
 * manifest, registered in `src/plugins/registry.ts`. The client activates /
 * deactivates and edits settings from Admin → Plugins; active plugins render
 * their components into named slots on the public site.
 *
 * To add a plugin with Claude Code: create the folder, export a manifest,
 * add one import line to registry.ts. No other site changes needed.
 */

export type PluginSlotName =
  /** floating UI on every public page (chat bubbles, back-to-top, banners) */
  | "site.floating"
  /** end of every public page, before the footer */
  | "site.beforeFooter"
  /** end of the homepage, after all sections */
  | "home.end";

export type PluginComponentProps = { settings: Record<string, unknown> };

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  /** Settings form definition — rendered in Admin → Plugins with the same
   *  engine as page sections, validated server-side with validateFields. */
  settingsFields: FieldSpec[];
  defaultSettings: Record<string, unknown>;
  /** Components rendered on the public site while the plugin is active. */
  slots: Partial<Record<PluginSlotName, ComponentType<PluginComponentProps>>>;
};
