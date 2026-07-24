import SmoothScroll from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ScrollProgress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PluginSlot from "@/components/PluginSlot";
import SiteScripts from "@/components/SiteScripts";
import AppearanceStyle from "@/components/AppearanceStyle";
import Preloader from "@/components/motion/Preloader";
import PageTransition from "@/components/motion/PageTransition";
import { getBlock, getGalleryItems, getProjects } from "@/lib/content";

const SITE_URL = "https://studiodota.net";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [site, nav, menus, servicesPage, galleryItems, projects, integrations, appearance] = await Promise.all([
    getBlock("site"),
    getBlock("nav"),
    getBlock("menus"),
    getBlock("page.services"),
    getGalleryItems(),
    getProjects(),
    getBlock("integrations"),
    getBlock("appearance"),
  ]);

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: SITE_URL,
    email: site.email,
    telephone: site.phone,
    description: site.metaDescription,
    ...(site.ogImage ? { logo: `${SITE_URL}${site.ogImage}`, image: `${SITE_URL}${site.ogImage}` } : {}),
    address: { "@type": "PostalAddress", streetAddress: site.address1, addressLocality: site.address2 },
    sameAs: site.socials.map((s) => s.href).filter((h) => h && h !== "#"),
  };

  const megaServices = servicesPage.items.map((s) => ({
    t: s.title,
    d: s.blurb,
    href: `/services#${s.id}`,
  }));
  const galleryVideos = galleryItems
    .filter((g) => g.type === "video")
    .slice(0, 2)
    .map((g) => ({ img: g.image, t: g.title }));
  const galleryPhotos = galleryItems
    .filter((g) => g.type === "photo")
    .slice(0, 4)
    .map((g) => g.image);
  const megaProjects = projects.slice(0, 3).map((p) => ({ img: p.heroImage, n: p.title, c: p.sector }));

  return (
    <>
      <SiteScripts d={integrations} />
      <AppearanceStyle accent={appearance.accent} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <Preloader />
      <PageTransition />
      <div className="grain" aria-hidden="true" />
      <SmoothScroll />
      <ScrollProgress />
      <Navbar
        siteName={site.name}
        nav={nav}
        menuItems={menus.primary}
        services={megaServices}
        galleryVideos={galleryVideos}
        galleryPhotos={galleryPhotos}
        projects={megaProjects}
      />
      <main>{children}</main>
      <PluginSlot name="site.beforeFooter" />
      <Footer site={site} pages={menus.footerPages} />
      <PluginSlot name="site.floating" />
    </>
  );
}
