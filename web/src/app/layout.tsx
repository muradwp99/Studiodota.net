import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { sans } from "@/lib/fonts";
import "./globals.css";
import { getBlock } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getBlock("site");
  return {
    metadataBase: new URL("https://studiodota.net"),
    title: {
      default: site.metaTitle,
      template: `%s · ${site.name}`,
    },
    description: site.metaDescription,
    openGraph: {
      title: site.metaTitle,
      description: site.metaDescription,
      type: "website",
      url: "https://studiodota.net",
      siteName: site.name,
      ...(site.ogImage ? { images: [{ url: site.ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: site.metaTitle,
      description: site.metaDescription,
      ...(site.twitterHandle ? { creator: site.twitterHandle } : {}),
      ...(site.ogImage ? { images: [site.ogImage] } : {}),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
