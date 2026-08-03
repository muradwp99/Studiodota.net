import Reveal from "@/components/Reveal";
import LineMask from "@/components/motion/LineMask";

export default function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="shell pb-14 pt-40 md:pt-52">
      <Reveal>
        <span className="eyebrow eyebrow--rule">{eyebrow}</span>
      </Reveal>
      <LineMask text={title} tag="h1" className="display-l mt-5 max-w-[20ch]" delay={0.08} />
      {lede && (
        <Reveal delay={130}>
          <p className="lede mt-7 max-w-[52ch]">{lede}</p>
        </Reveal>
      )}
    </header>
  );
}
