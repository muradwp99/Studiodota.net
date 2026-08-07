/**
 * Shared motion vocabulary, traced from largo.studio and adapted to the
 * Studiodota brand. Keep in sync with the CSS custom properties in
 * globals.css (--ease-largo / --ease-curtain / --ease-panel).
 */

/** UI + text reveals (largo's primary easing). */
export const EASE_LARGO: [number, number, number, number] = [0.37, 0.16, 0.12, 1];
/** Image curtain wipes. */
export const EASE_CURTAIN: [number, number, number, number] = [0.52, 0.08, 0.18, 1];
/** Full-screen cover panels (slight overshoot). */
export const EASE_PANEL: [number, number, number, number] = [0.72, 0.04, 0.5, 1.07];

/** Fired by the Preloader the moment its exit begins — hero intros listen for it. */
export const LOADED_EVENT = "sd:loaded";
/** Set on <html> alongside the event, for late subscribers. */
export const LOADED_ATTR = "data-sd-loaded";

export const isSiteLoaded = () =>
  typeof document !== "undefined" && document.documentElement.hasAttribute(LOADED_ATTR);

export const markSiteLoaded = () => {
  document.documentElement.setAttribute(LOADED_ATTR, "1");
  window.dispatchEvent(new Event(LOADED_EVENT));
};

/** Runs cb once the preloader has finished (immediately if it already has). */
export const onSiteLoaded = (cb: () => void): (() => void) => {
  if (isSiteLoaded()) {
    cb();
    return () => {};
  }
  window.addEventListener(LOADED_EVENT, cb, { once: true });
  return () => window.removeEventListener(LOADED_EVENT, cb);
};

/** Fired by PageTransition the instant its cover panel starts lifting on a
 *  route change (unlike sd:loaded, which only ever fires once per session). */
export const PAGE_REVEAL_EVENT = "sd:page-reveal";
/** Set on <html> while PageTransition's cover panel is up; removed on reveal. */
export const COVERING_ATTR = "data-sd-covering";
