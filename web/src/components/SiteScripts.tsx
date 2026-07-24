"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import RawCode from "@/components/RawCode";
import { CONSENT_EVENT, getConsent, type Consent } from "@/lib/consent";
import type { BlockData } from "@/content/defaults";

/**
 * Site-wide analytics/tracking + custom code, driven by the `integrations`
 * block. Paste an ID in the admin → the correct snippet is injected here.
 * Analytics/marketing pixels load ONLY after cookie consent (see CookieConsent);
 * the raw head/footer code is the admin's own and always loads.
 * Rendered only in the public (site) layout, never in /admin.
 */
export default function SiteScripts({ d }: { d: BlockData["integrations"] }) {
  const ga = d.gaId.trim();
  const gtm = d.gtmId.trim();
  const pixel = d.metaPixelId.trim();
  const tiktok = d.tiktokPixelId.trim();

  const [consent, setC] = useState<Consent>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setC(getConsent());
    const on = (e: Event) => setC((e as CustomEvent).detail as Consent);
    window.addEventListener(CONSENT_EVENT, on);
    return () => window.removeEventListener(CONSENT_EVENT, on);
  }, []);
  const tracking = consent === "accepted";

  return (
    <>
      {tracking && ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}

      {tracking && gtm && (
        <>
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-sync-scripts */}
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtm}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="gtm" />
          </noscript>
        </>
      )}

      {tracking && pixel && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img height="1" width="1" style={{ display: "none" }} src={`https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1`} alt="" />
          </noscript>
        </>
      )}

      {tracking && tiktok && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktok}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}

      {d.headCode?.trim() && <RawCode code={d.headCode} target="head" />}
      {d.footerCode?.trim() && <RawCode code={d.footerCode} target="body" />}
    </>
  );
}
