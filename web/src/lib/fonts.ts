import { Archivo } from "next/font/google";
import localFont from "next/font/local";

// Archivo — a calm, business-like architectural grotesque. Exposed on the
// same --font-gilroy variable so the rest of the styles are unchanged.
export const sans = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-gilroy",
  display: "swap",
});

// The studio's real display face, for the .display-* headline scale only —
// body copy stays on Archivo above. Only the ExtraBold weight is used (every
// .display-* rule is 600-800 already), so a single static face covers them
// all instead of needing the full Gilroy family.
export const display = localFont({
  src: "../fonts/gilroy/Gilroy-ExtraBold.otf",
  weight: "800",
  variable: "--font-gilroy-display",
  display: "swap",
});
