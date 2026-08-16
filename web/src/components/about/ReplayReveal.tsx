"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Page-local variant of Reveal (About page only) for content the reader
 * scrolls past repeatedly - stat tiles, process steps. Unlike Reveal
 * (viewport once:true), this replays its fade/rise every time the element
 * crosses the viewport boundary in EITHER direction, so it plays an exit as
 * well as an entrance - same `viewport once:false` convention already used
 * for the homepage's ServiceRow. Static under reduced motion.
 */
export default function ReplayReveal({
  children,
  className = "",
  delay = 0,
  amount = 0.3,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  amount?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const variants: Variants = {
    hidden: { opacity: 0, y: 26 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] },
    },
  };
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount }}
    >
      {children}
    </motion.div>
  );
}
