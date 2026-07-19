import HeroScrub from "@/components/home/HeroScrub";
import Sections, { type HomeData, type JournalCard } from "@/components/home/Sections";
import { getBlock, getPosts } from "@/lib/content";

export default async function Home() {
  const [
    hero, about, services, whyChoose, featured, showreel, process, timeline,
    testimonials, clients, statement, faq, journals, cta, site, allPosts,
  ] = await Promise.all([
    getBlock("home.hero"),
    getBlock("home.about"),
    getBlock("home.services"),
    getBlock("home.whyChoose"),
    getBlock("home.featured"),
    getBlock("home.showreel"),
    getBlock("home.process"),
    getBlock("home.timeline"),
    getBlock("home.testimonials"),
    getBlock("home.clients"),
    getBlock("home.statement"),
    getBlock("home.faq"),
    getBlock("home.journals"),
    getBlock("home.cta"),
    getBlock("site"),
    getPosts(),
  ]);

  const data: HomeData = {
    about, services, whyChoose, featured, showreel, process, timeline,
    testimonials, clients, statement, faq, journals, cta,
  };
  const posts: JournalCard[] = allPosts.slice(0, 4).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    date: p.date,
    image: p.image,
    authorName: p.authorName,
    authorRole: p.authorRole,
  }));

  return (
    <>
      <HeroScrub d={hero} />
      <Sections data={data} posts={posts} contact={{ email: site.email, phone: site.phone }} />
    </>
  );
}
