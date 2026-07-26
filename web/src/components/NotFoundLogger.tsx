"use client";

import { useEffect } from "react";
import { logNotFoundMiss } from "@/lib/actions/notfound";

/** Fires once on mount with the real browser path — keeps not-found.tsx itself static. */
export default function NotFoundLogger() {
  useEffect(() => {
    logNotFoundMiss(window.location.pathname);
  }, []);
  return null;
}
