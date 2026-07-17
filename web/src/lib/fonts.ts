import { Archivo } from "next/font/google";

// Archivo — a calm, business-like architectural grotesque. Exposed on the
// same --font-gilroy variable so the rest of the styles are unchanged.
export const sans = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-gilroy",
  display: "swap",
});
