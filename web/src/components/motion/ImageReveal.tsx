"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { EASE_CURTAIN } from "@/lib/motion";

/**
 * largo-style image entrance: a flat curtain wipes off toward the right
 * (scaleX 1→0, .9s) while the image settles from a slight over-scale.
 * Wrapper owns aspect/rounding via className. Reduced motion: plain image.
 */
export default function ImageReveal({
  src,
  alt,
  sizes,
  className = "",
  imgClassName = "object-cover",
  priority = false,
  delay = 0,
  curtain = "var(--ink-2)",
  style,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  delay?: number;
  /** CSS color of the wipe panel — match the section background for a clean pass. */
  curtain?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={style}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={imgClassName} />
      </div>
    );
  }

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      <motion.div
        className="absolute inset-0"
        variants={{
          hidden: { scale: 1.08 },
          show: { scale: 1, transition: { duration: 1.05, ease: EASE_CURTAIN, delay } },
        }}
      >
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={imgClassName} />
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 z-10"
        style={{ background: curtain, transformOrigin: "right center", willChange: "transform" }}
        variants={{
          hidden: { scaleX: 1 },
          show: { scaleX: 0, transition: { duration: 0.9, ease: EASE_CURTAIN, delay } },
        }}
      />
    </motion.div>
  );
}
