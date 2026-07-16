import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Studiodota collects, uses, and retains the information you share.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        lede="Plain-English summary of what we collect when you contact us, why, and how long we keep it."
      />
      <div className="shell pb-28">
        <div className="max-w-[70ch] space-y-10 text-[var(--bone-dim)]">
          <Section title="What we collect">
            When you submit the enquiry form we collect the details you provide —
            your name, email address, optional phone number and company, the
            service you need, and your project description, including any files
            you attach.
          </Section>
          <Section title="Why we collect it">
            Solely to respond to your enquiry, prepare a quote, and deliver the
            work you ask us to do. We do not sell your data or use it for
            advertising.
          </Section>
          <Section title="How long we keep it">
            Enquiry submissions are stored securely and automatically deleted
            after 180 days unless they become part of an active project, in
            which case they are retained for the duration of our working
            relationship and any legal record-keeping obligations.
          </Section>
          <Section title="Your choices">
            You can ask us to access, correct, or delete the information we hold
            about you at any time. Email{" "}
            <a href={`mailto:${site.email}`} className="link-underline text-[var(--bone)]">
              {site.email}
            </a>{" "}
            and we will action the request.
          </Section>
          <Section title="Cookies">
            This site uses only the essential cookies required to function. We do
            not run advertising or cross-site tracking cookies.
          </Section>
          <p className="border-t border-[var(--line)] pt-8 text-sm text-[var(--muted)]">
            Questions about this policy? Contact {site.email}.
          </p>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-[var(--bone)]">{title}</h2>
      <p className="mt-4 leading-relaxed">{children}</p>
    </section>
  );
}
