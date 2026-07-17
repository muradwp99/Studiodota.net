"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Dir = "up" | "right" | "left" | "none";

const offset: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  right: { x: 64, y: 0 },
  left: { x: -64, y: 0 },
  none: { x: 0, y: 0 },
};

export default function Reveal({
  children,
  className = "",
  delay = 0,
  from = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: Dir;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const o = offset[from];
  const variants: Variants = {
    hidden: { opacity: 0, x: o.x, y: o.y },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.85, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] },
    },
  };
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
    >
      {children}
    </motion.div>
  );
}
