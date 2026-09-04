"use client";

import { useState } from "react";
import Image from "next/image";
import MediaLightbox from "@/components/MediaLightbox";

type Props = {
  mp4: string;
  poster: string;
  name: string;
  role: string;
  caption?: string;
};

/**
 * A client-filmed testimonial. The poster sits on the page and the film opens
 * in the same lightbox the showreel and gallery use, so it plays with sound on
 * a real user gesture rather than autoplaying muted behind the copy.
 */
export default function VideoTestimonial({ mp4, poster, name, role, caption }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-10 grid gap-10 lg:grid-cols-[0.62fr_0.38fr] lg:items-center lg:gap-16">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Play ${name}'s video testimonial`}
          className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.12)]"
        >
          <Image
            src={poster}
            alt=""
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
          <span className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,19,21,0.72), transparent 60%)" }} />
          <span className="pointer-events-none absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[rgba(255,255,255,0.16)] text-2xl backdrop-blur transition-transform duration-500 group-hover:scale-110" style={{ color: "var(--on-media)" }}>
            ▶
          </span>
        </button>

        <div>
          <div className="font-display text-3xl md:text-4xl">{name}</div>
          <div className="mt-2 text-sm" style={{ color: "var(--on-media-dim)" }}>{role}</div>
          {caption ? (
            <p className="mt-6 max-w-[34ch] text-lg leading-relaxed" style={{ color: "var(--on-media-dim)" }}>
              {caption}
            </p>
          ) : null}
        </div>
      </div>

      <MediaLightbox
        active={open ? { title: name, sector: role, image: poster, mp4 } : null}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
