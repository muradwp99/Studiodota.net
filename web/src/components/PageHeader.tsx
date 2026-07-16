import Reveal from "@/components/Reveal";

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
        <span className="eyebrow">{eyebrow}</span>
      </Reveal>
      <Reveal delay={70}>
        <h1 className="display-l mt-5 max-w-[20ch]">{title}</h1>
      </Reveal>
      {lede && (
        <Reveal delay={130}>
          <p className="lede mt-7 max-w-[52ch]">{lede}</p>
        </Reveal>
      )}
    </header>
  );
}
