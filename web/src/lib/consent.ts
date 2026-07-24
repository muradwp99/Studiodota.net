/** Cookie consent state, shared by the banner and the tracker loader. */
export const CONSENT_EVENT = "sd:consent";
const KEY = "sd-cookie-consent";

export type Consent = "accepted" | "declined" | null;

export function getConsent(): Consent {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "accepted" || v === "declined" ? v : null;
}

export function setConsent(v: "accepted" | "declined") {
  localStorage.setItem(KEY, v);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
}
