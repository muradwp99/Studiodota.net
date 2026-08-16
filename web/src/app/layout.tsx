import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { sans, display } from "@/lib/fonts";
import "./globals.css";
import { getBlock } from "@/lib/content";
import { jsonLdScript } from "@/lib/jsonLd";

const SITE_URL = "https://studiodota.net";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getBlock("site");
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: site.metaTitle,
      template: `%s · ${site.name}`,
    },
    description: site.metaDescription,
    openGraph: {
      title: site.metaTitle,
      description: site.metaDescription,
      type: "website",
      url: SITE_URL,
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getBlock("site");
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${GeistMono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteLd) }} />
        {children}
      </body>
    </html>
  );
}
