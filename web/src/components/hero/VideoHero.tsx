import Image from "next/image";
import Link from "next/link";

/**
 * Home 2 hero — looping video background variant.
 * Drop a real file at /public/media/hero-loop.mp4. A cinematic render still
 * (from Magnific) sits behind it and shows whenever the video is absent,
 * so the hero is never blank.
 */
export default function VideoHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* cinematic render base (always visible) */}
      <div className="absolute inset-0">
        <Image
          src="/media/renders/hero.jpg"
          alt="Cinematic architectural render at dawn"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* real video (shows once the asset exists) */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/media/renders/hero.jpg"
      >
        <source src="/media/hero-loop.mp4" type="video/mp4" />
      </video>

      {/* legibility scrim */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,12,12,0.55), rgba(10,12,12,0.15) 35%, rgba(10,12,12,0.35) 65%, rgba(10,12,12,0.92))",
        }}
      />

      {/* content */}
      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <span className="eyebrow mb-6">Studiodota — Showreel</span>
        <h1 className="display-xl max-w-[15ch]">
          See it move before you build it.
        </h1>
        <p className="lede mx-auto mt-7 text-center">
          Cinematic flythroughs, walkthroughs, and photoreal CGI that carry your
          project from planning to marketing.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/contact" className="btn btn-primary">
            Get a quote
            <span className="btn-icon" aria-hidden="true">
              →
            </span>
          </Link>
          <Link href="/projects" className="btn btn-ghost">
            Explore our work
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[var(--muted)]">
        Scroll to explore
      </div>
    </section>
  );
}
