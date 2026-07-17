"use client";

import { useState } from "react";
import { serviceOptions } from "@/content/site";

type Status = "idle" | "submitting" | "success" | "error";
type Errors = Partial<Record<"name" | "email" | "service" | "message" | "consent", string>>;

const field =
  "w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3 text-[var(--bone)] outline-none transition-colors duration-300 placeholder:text-[var(--muted)] focus:border-[var(--gold)]";
const labelCls = "mb-2 block text-sm text-[var(--bone-dim)]";
const errCls = "mt-2 flex items-center gap-2 text-sm text-[var(--gold-ink)]";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});

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
      // Front-end only for now — wires to POST /api/contact with the backend.
      await new Promise((r) => setTimeout(r, 900));
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bezel">
        <div className="bezel-core flex flex-col items-start gap-4 p-10">
          <span className="eyebrow">Enquiry received</span>
          <h3 className="display-m">Thank you — we&rsquo;ll be in touch.</h3>
          <p className="text-[var(--bone-dim)]">
            We&rsquo;ve got your details and will reply within one business day
            with next steps and an initial quote.
          </p>
          <button
            className="btn btn-ghost mt-2"
            onClick={() => setStatus("idle")}
          >
            Send another enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>
            Full name *
          </label>
          <input id="name" name="name" className={field} placeholder="Jane Architect" />
          {errors.name && (
            <p className={errCls} role="alert">
              <span aria-hidden="true">→</span> {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>
            Email address *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={field}
            placeholder="jane@studio.com"
          />
          {errors.email && (
            <p className={errCls} role="alert">
              <span aria-hidden="true">→</span> {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelCls}>
            Phone number
          </label>
          <input id="phone" name="phone" className={field} placeholder="Optional" />
        </div>
        <div>
          <label htmlFor="company" className={labelCls}>
            Company
          </label>
          <input
            id="company"
            name="company"
            maxLength={120}
            className={field}
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label htmlFor="service" className={labelCls}>
          Service needed *
        </label>
        <select id="service" name="service" defaultValue="" className={field}>
          <option value="" disabled>
            Select the service you need
          </option>
          {serviceOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.service && (
          <p className={errCls} role="alert">
            <span aria-hidden="true">→</span> {errors.service}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className={labelCls}>
          Project details *
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={5000}
          className={field}
          placeholder="Plans, elevations, references, timeline — anything that helps us understand the project."
        />
        {errors.message && (
          <p className={errCls} role="alert">
            <span aria-hidden="true">→</span> {errors.message}
          </p>
        )}
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-[var(--bone-dim)]">
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
        {errors.consent && (
          <p className={errCls} role="alert">
            <span aria-hidden="true">→</span> {errors.consent}
          </p>
        )}
      </div>

      {status === "error" && (
        <p className={errCls} role="alert">
          <span aria-hidden="true">→</span> Something interrupted the send. Please
          try again, or email us directly.
        </p>
      )}

      <button
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
      </button>
    </form>
  );
}
