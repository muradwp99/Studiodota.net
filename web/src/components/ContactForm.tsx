"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { submitContact } from "@/lib/actions/contact";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { EASE_LARGO } from "@/lib/motion";

type Status = "idle" | "submitting" | "success" | "error";
type Errors = Partial<Record<"name" | "email" | "service" | "message" | "consent", string>>;

// Metadata fields (name/email/phone/company/service) read as a single line,
// not a boxed input - the old `rounded-xl border ... bg-[var(--surface)]`
// box drew a border in the exact fill color of the card it sits on, so it
// was already invisible except for its outline: a box for the sake of a box.
// A line lets the label text and field text share the same left edge too.
const field =
  "w-full border-b border-[var(--line-strong)] bg-transparent px-0 py-3 text-[var(--bone)] outline-none transition-colors duration-300 placeholder:text-[var(--muted)] focus:border-[var(--gold)]";
// The message field is the one thing in this form that's actually the
// enquiry - it gets a shaded well (existing --surface-2 "recessed" token,
// the same one .bezel uses) and a tighter radius than the outer card, so it
// reads as the form's focal point instead of one row among six identical ones.
const fieldArea =
  "w-full rounded-lg border border-[var(--line-strong)] bg-[var(--surface-2)] px-4 py-3.5 text-[var(--bone)] outline-none transition-colors duration-300 placeholder:text-[var(--muted)] focus:border-[var(--gold)]";
const labelCls = "mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--bone-dim)]";
const req = "text-[var(--gold-ink)]";
const errCls = "mt-2 flex items-center gap-2 text-sm text-[var(--gold-ink)]";

/** Small fade+rise wrapper for a validation message, gated on reduced motion. */
function FieldError({ children }: { children?: string }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {children && (
        <motion.p
          className={errCls}
          role="alert"
          initial={{ opacity: 0, y: reduced ? 0 : -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -6 }}
          transition={{ duration: reduced ? 0 : 0.28, ease: EASE_LARGO }}
        >
          <span aria-hidden="true">→</span> {children}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** Draws a checkmark once its wrapper (an `item` stagger child) becomes visible. */
function SuccessIcon() {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      initial={reduced ? false : { scale: 0.6 }}
      animate={{ scale: 1 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: EASE_LARGO }}
    >
      <circle cx="28" cy="28" r="26" stroke="var(--gold)" strokeWidth="2" />
      <motion.path
        d="M17 29 L24.5 36.5 L39 20"
        stroke="var(--gold)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduced ? 0 : 0.45, ease: EASE_LARGO, delay: reduced ? 0 : 0.2 }}
      />
    </motion.svg>
  );
}

export default function ContactForm({ serviceOptions }: { serviceOptions: string[] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const reduced = useReducedMotion();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const service = String(data.get("service") || "");
    const message = String(data.get("message") || "").trim();
    const consent = data.get("consent") === "on";

    const next: Errors = {};
    if (!name) next.name = "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (!service) next.service = "Select the service you need.";
    if (message.length < 10)
      next.message = "A sentence or two about the project helps us quote.";
    if (message.length > 5000) next.message = "Please keep this under 5000 characters.";
    if (!consent) next.consent = "Please agree to the privacy policy to continue.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("submitting");
    try {
      // The visible "Company" input is real user data — fold it into the
      // message body (the action's `company` field is a hidden bot honeypot).
      const companyVal = String(data.get("company") || "").trim();
      const res = await submitContact({
        name,
        email,
        service,
        message: companyVal ? `Company: ${companyVal}\n\n${message}` : message,
        phone: String(data.get("phone") || ""),
        company: "",
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setErrors(res.error ? { message: res.error } : {});
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  // Motion is expressed as data, not branching JSX: under reduced motion the
  // variants collapse to no-ops and hover/focus lifts are simply omitted, so
  // there's one markup path that's either animated or inert.
  const swapTransition = { duration: reduced ? 0 : 0.5, ease: EASE_LARGO };
  const lift = reduced
    ? {}
    : { whileHover: { y: -2 }, whileFocus: { y: -2 }, transition: { duration: 0.2, ease: EASE_LARGO } };
  const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.07, delayChildren: reduced ? 0 : 0.05 } },
  };
  const item: Variants = reduced
    ? { hidden: {}, show: {} }
    : { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_LARGO } } };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === "success" ? (
        <motion.div
          key="success"
          className="bezel"
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -16 }}
          transition={swapTransition}
        >
          <motion.div
            className="bezel-core flex flex-col items-start gap-4 p-10"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={item}>
              <SuccessIcon />
            </motion.div>
            <motion.span variants={item} className="eyebrow">
              Enquiry received
            </motion.span>
            <motion.h3 variants={item} className="display-m">
              Thank you - we&rsquo;ll be in touch.
            </motion.h3>
            <motion.p variants={item} className="text-[var(--bone-dim)]">
              We&rsquo;ve got your details and will reply within one business day
              with next steps and an initial quote.
            </motion.p>
            <motion.button
              variants={item}
              type="button"
              className="btn btn-ghost mt-2"
              onClick={() => setStatus("idle")}
            >
              Send another enquiry
            </motion.button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -16 }}
          transition={swapTransition}
        >
          <motion.form
            onSubmit={onSubmit}
            noValidate
            className="space-y-6"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <motion.div variants={item}>
                <label htmlFor="name" className={labelCls}>
                  Full name <span className={req}>*</span>
                </label>
                <motion.input id="name" name="name" className={field} placeholder="Jane Architect" {...lift} />
                <FieldError>{errors.name}</FieldError>
              </motion.div>
              <motion.div variants={item}>
                <label htmlFor="email" className={labelCls}>
                  Email address <span className={req}>*</span>
                </label>
                <motion.input
                  id="email"
                  name="email"
                  type="email"
                  className={field}
                  placeholder="jane@studio.com"
                  {...lift}
                />
                <FieldError>{errors.email}</FieldError>
              </motion.div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <motion.div variants={item}>
                <label htmlFor="phone" className={labelCls}>
                  Phone number
                </label>
                <motion.input id="phone" name="phone" className={field} placeholder="Optional" {...lift} />
              </motion.div>
              <motion.div variants={item}>
                <label htmlFor="company" className={labelCls}>
                  Company
                </label>
                <motion.input
                  id="company"
                  name="company"
                  maxLength={120}
                  className={field}
                  placeholder="Optional"
                  {...lift}
                />
              </motion.div>
            </div>

            <motion.div variants={item}>
              <label htmlFor="service" className={labelCls}>
                Service needed <span className={req}>*</span>
              </label>
              <div className="relative">
                <motion.select
                  id="service"
                  name="service"
                  defaultValue=""
                  className={`${field} cursor-pointer appearance-none pr-8`}
                  {...lift}
                >
                  <option value="" disabled>
                    Select the service you need
                  </option>
                  {serviceOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </motion.select>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 12 8"
                  className="pointer-events-none absolute right-0 top-1/2 h-2 w-3 -translate-y-1/2 text-[var(--muted)]"
                >
                  <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <FieldError>{errors.service}</FieldError>
            </motion.div>

            <motion.div variants={item} className="pt-2">
              <label htmlFor="message" className={labelCls}>
                Project details <span className={req}>*</span>
              </label>
              <motion.textarea
                id="message"
                name="message"
                rows={5}
                maxLength={5000}
                className={fieldArea}
                placeholder="Plans, elevations, references, timeline - anything that helps us understand the project."
                {...lift}
              />
              <FieldError>{errors.message}</FieldError>
            </motion.div>

            <motion.div variants={item}>
              <label className="flex items-start gap-3 py-3 text-sm text-[var(--bone-dim)]">
                <input
                  type="checkbox"
                  name="consent"
                  className="mt-1 h-4 w-4 accent-[var(--gold)]"
                />
                <span>
                  I agree to the{" "}
                  <a href="/privacy" className="link-underline text-[var(--bone)]">
                    privacy policy
                  </a>
                  . Your details are stored only to respond to this enquiry.
                </span>
              </label>
              <FieldError>{errors.consent}</FieldError>
            </motion.div>

            <FieldError>
              {status === "error" ? "Something interrupted the send. Please try again, or email us directly." : undefined}
            </FieldError>

            <motion.button
              variants={item}
              type="submit"
              disabled={status === "submitting"}
              className="btn btn-primary disabled:opacity-60"
            >
              {status === "submitting" ? "Sending…" : "Submit enquiry"}
              {status !== "submitting" && (
                <span className="btn-icon" aria-hidden="true">
                  →
                </span>
              )}
            </motion.button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
