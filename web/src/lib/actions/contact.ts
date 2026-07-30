"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { clientKey } from "@/lib/auth";
import { getBlock } from "@/lib/content";
import { sendMail } from "@/lib/mail";

export type ContactState = { ok?: boolean; error?: string };

const schema = z.object({
  name: z.string().trim().min(1, "Please tell us your name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  message: z.string().trim().min(10, "A sentence or two about the project helps.").max(5000),
  service: z.string().trim().max(80).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  // Honeypot — humans never fill this.
  company: z.string().max(200).optional().default(""),
});

/* Per-IP submission limiting (in-memory; resets on restart). */
const submissions = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_HOUR = 5;

export async function submitContact(input: unknown): Promise<ContactState> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const { name, email, message, service, phone, company } = parsed.data;

  // Bots that fill the honeypot get a quiet "success" and no row.
  if (company) return { ok: true };

  const key = await clientKey();
  const bucket = submissions.get(key);
  if (bucket && Date.now() < bucket.resetAt && bucket.count >= MAX_PER_HOUR) {
    return { error: "Too many enquiries from this connection - please try again later or email us directly." };
  }

  try {
    await db.contactMessage.create({
      data: {
        name,
        email,
        service,
        message: phone ? `Phone: ${phone}\n\n${message}` : message,
      },
    });
    if (!bucket || Date.now() > bucket.resetAt) {
      submissions.set(key, { count: 1, resetAt: Date.now() + 60 * 60 * 1000 });
    } else {
      bucket.count += 1;
    }

    // Honour the 180-day retention promised in the privacy policy — opportunistic
    // purge on each new enquiry, so it needs no scheduler.
    // ponytail: deletes everything past 180d; the policy's "active project"
    // exception can't be honoured without a project-link flag on the message.
    try {
      const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      await db.contactMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });
    } catch (e) {
      console.error("retention purge", e);
    }

    // Notify the studio — never let a mail hiccup fail the enquiry.
    try {
      const [site, integrations] = await Promise.all([getBlock("site"), getBlock("integrations")]);
      const to = integrations.notifyEmail?.trim() || site.email;
      if (to) {
        await sendMail({
          to,
          replyTo: email,
          subject: `New enquiry from ${name}`,
          text: `New enquiry via ${site.name}\n\nName: ${name}\nEmail: ${email}${service ? `\nService: ${service}` : ""}${phone ? `\nPhone: ${phone}` : ""}\n\n${message}\n\n— View in the admin: /admin/messages`,
        });
      }
    } catch (e) {
      console.error("enquiry notification", e);
    }

    return { ok: true };
  } catch (e) {
    console.error("submitContact", e);
    return { error: "Something interrupted the send. Please try again, or email us directly." };
  }
}
