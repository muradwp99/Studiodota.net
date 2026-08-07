import Reveal from "@/components/Reveal";
import BigTitle from "@/components/motion/BigTitle";

export default function PageHeader({
  eyebrow,
  pageName,
  lede,
}: {
  eyebrow: string;
  pageName: string;
  lede?: string;
}) {
  return (
    <header className="shell pb-14 pt-40 md:pt-52">
      <Reveal>
        <span className="eyebrow">{eyebrow}</span>
      </Reveal>
      <BigTitle text={pageName} tag="h1" className="mt-5" />
      {lede && (
        <Reveal delay={130}>
          <p className="lede mt-7 max-w-[52ch]">{lede}</p>
        </Reveal>
      )}
    </header>
  );
}
