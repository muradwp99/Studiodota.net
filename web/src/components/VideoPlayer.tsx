"use client";

import Image from "next/image";

// ── Video source (swap these when you add the Kling clip) ───────────────────
// 1. Put a YouTube ID that ALLOWS embedding here (or leave "" to use the mp4).
export const SITE_VIDEO_ID = "";
// 2. Or drop an mp4 at web/public/media/ and point to it here.
export const SITE_VIDEO_MP4 = "";
// 3. Flip to true once a real, working source above is set.
export const VIDEO_ENABLED = false;
// ────────────────────────────────────────────────────────────────────────────

/**
 * Branding-hidden video player with a fail-safe.
 * - When VIDEO_ENABLED: plays the mp4 (native, no branding) or a YouTube embed
 *   with the chrome/logo cropped and interaction blocked (ambient background).
 * - Otherwise: shows the poster with a subtle Ken-Burns motion, so nothing
 *   broken (e.g. an "unavailable" embed) ever ships. Swap the constants above.
 */
export default function VideoPlayer({
  poster,
  title = "Showreel",
  className = "",
  rounded = "rounded-2xl",
}: {
  poster: string;
  title?: string;
  className?: string;
  rounded?: string;
}) {
  const shell = `relative overflow-hidden bg-black ${rounded} ${className}`;

  if (VIDEO_ENABLED && SITE_VIDEO_MP4) {
    return (
      <div className={shell}>
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={poster}
        >
          <source src={SITE_VIDEO_MP4} type="video/mp4" />
        </video>
      </div>
    );
  }

  if (VIDEO_ENABLED && SITE_VIDEO_ID) {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      controls: "0",
      loop: "1",
      playlist: SITE_VIDEO_ID,
      modestbranding: "1",
      rel: "0",
      playsinline: "1",
      disablekb: "1",
      fs: "0",
      iv_load_policy: "3",
    });
    return (
      <div className={shell}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${SITE_VIDEO_ID}?${params.toString()}`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          loading="lazy"
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ border: 0, transform: "scale(1.35)", transformOrigin: "center" }}
        />
        <div className="absolute inset-0" aria-hidden="true" />
      </div>
    );
  }

  // Fail-safe poster (moving still) until a real source is configured.
  return (
    <div className={shell}>
      <Image src={poster} alt={title} fill sizes="90vw" className="ken-burns object-cover" />
    </div>
  );
}
