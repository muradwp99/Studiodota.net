import type { PluginManifest } from "@/plugins/types";
import WhatsAppButton from "./WhatsAppButton";

export const whatsappChat: PluginManifest = {
  id: "whatsapp-chat",
  name: "WhatsApp Chat Button",
  version: "1.0.0",
  author: "Studiodota",
  description:
    "Floating WhatsApp bubble on every page — visitors tap it to start a WhatsApp conversation with the studio.",
  settingsFields: [
    { kind: "text", key: "phone", label: "WhatsApp number (with country code, digits only — e.g. 447700900123)" },
    { kind: "textarea", key: "message", label: "Pre-filled message", rows: 2 },
    { kind: "text", key: "position", label: "Corner (right or left)" },
    { kind: "text", key: "label", label: "Accessible label" },
  ],
  defaultSettings: {
    phone: "",
    message: "Hello Studiodota — I'd like to talk about a project.",
    position: "right",
    label: "Chat with us on WhatsApp",
  },
  slots: {
    "site.floating": WhatsAppButton,
  },
};
