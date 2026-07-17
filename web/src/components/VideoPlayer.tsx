"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Props = {
  /** YouTube video id (preferred source — editable in the admin CMS) */
  youtubeId?: string;
  /** Or a self-hosted mp4 path (e.g. /media/hero-loop.mp4) */
  mp4?: string;
  poster: string;
  title?: string;
  /**
   * ambient — muted, looping, chrome hidden; the player mounts only while the
   *   card is on screen, so it starts playing when focused and stops when not.
   * cinema — created on click (a user gesture), so it autoplays WITH sound,
   *   with full controls. Used by modals/lightboxes.
   */
  mode?: "ambient" | "cinema";
  className?: string;
  rounded?: string;
};

/** Nudge the YouTube player over the iframe API — `autoplay=1` alone is
 *  ignored by some browsers/webviews, a posted playVideo command is not. */
function ytCommand(frame: HTMLIFrameElement | null, func: string) {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
}

export default function VideoPlayer({
  youtubeId,
  mp4,
  poster,
  title = "Showreel",
  mode = "ambient",
  className = "",
  rounded = "rounded-2xl",
}: Props) {
  const shell = `relative overflow-hidden bg-black ${rounded} ${className}`;
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const reduced = useReducedMotion();
  const cinema = mode === "cinema";
  const [inView, setInView] = useState(cinema);
  const [loaded, setLoaded] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  // On-screen detection via rect math on scroll/resize (IntersectionObserver
  // delivery is unreliable in some webviews; this is deterministic).
  useEffect(() => {
    if (cinema) return;
    const el = ref.current;
    if (!el) return;
    let timer = 0;
    const check = () => {
      timer = 0;
      const r = el.getBoundingClientRect();
      const visY = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      const visX = Math.min(r.right, window.innerWidth) - Math.max(r.left, 0);
      const area = r.height * r.width;
      const vis = visY > 0 && visX > 0 && area > 0 ? (visY * visX) / area : 0;
      setInView(vis >= 0.35);
    };
    const schedule = () => {
      if (!timer) timer = window.setTimeout(check, 120);
    };
    check();
    // Low-frequency safety poll: catches layout shifts that don't fire scroll
    // (filter reflows) and environments with unreliable event delivery.
    const poll = window.setInterval(check, 1200);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(poll);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [cinema]);

  const hasSource = Boolean(youtubeId || mp4);
  // Ambient motion is decorative — keep the still poster under reduced motion.
  const showPlayer = hasSource && (cinema ? true : inView && !reduced) && (mp4 ? true : origin !== "");

  useEffect(() => {
    if (!showPlayer) setLoaded(false);
  }, [showPlayer]);

  const nudge = () => {
    const timers = [250, 1200, 2600].map((ms) =>
      window.setTimeout(() => {
        if (!cinema) ytCommand(frameRef.current, "mute");
        ytCommand(frameRef.current, "playVideo");
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  };

  return (
    <div ref={ref} className={shell}>
      <Image
        src={poster}
        alt={title}
        fill
        sizes="90vw"
        className={`object-cover ${hasSource || reduced ? "" : "ken-burns"}`}
      />
      {showPlayer && mp4 && (
        <video
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted={!cinema}
          loop={!cinema}
          controls={cinema}
          playsInline
          poster={poster}
          onCanPlay={() => setLoaded(true)}
        >
          <source src={mp4} type="video/mp4" />
        </video>
      )}
      {showPlayer && !mp4 && youtubeId && (
        <iframe
          ref={frameRef}
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?${new URLSearchParams({
            autoplay: "1",
            mute: cinema ? "0" : "1",
            controls: cinema ? "1" : "0",
            rel: "0",
            playsinline: "1",
            modestbranding: "1",
            iv_load_policy: "3",
            enablejsapi: "1",
            origin,
            ...(cinema ? {} : { loop: "1", playlist: youtubeId, disablekb: "1", fs: "0" }),
          }).toString()}`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen={cinema}
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"} ${cinema ? "" : "pointer-events-none"}`}
          style={cinema ? { border: 0 } : { border: 0, transform: "scale(1.35)", transformOrigin: "center" }}
          onLoad={() => {
            setLoaded(true);
            nudge();
          }}
        />
      )}
    </div>
  );
}
