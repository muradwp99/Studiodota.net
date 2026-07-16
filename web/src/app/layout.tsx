import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { sans } from "@/lib/fonts";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ScrollProgress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://studiodota.net"),
  title: {
    default: "Studiodota — Architecture & Design Studio",
    template: "%s · Studiodota",
  },
  description:
    "Studiodota is an architecture and design practice creating buildings and spaces defined by clarity, craft, and lasting value — from concept to completion.",
  openGraph: {
    title: "Studiodota — Architecture & Design Studio",
    description:
      "An architecture and design practice creating buildings and spaces built to endure.",
    type: "website",
    url: "https://studiodota.net",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${GeistMono.variable}`}
    >
      <body>
        <div className="grain" aria-hidden="true" />
        <SmoothScroll />
        <ScrollProgress />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
