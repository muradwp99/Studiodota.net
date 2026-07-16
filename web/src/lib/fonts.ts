import { Poppins } from "next/font/google";

// Poppins — the closest widely-available Google Fonts match to Gilroy
// (geometric sans). Exposed on the same --font-gilroy variable so the rest
// of the styles are unchanged.
export const sans = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-gilroy",
  display: "swap",
});
