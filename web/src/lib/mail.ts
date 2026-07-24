import nodemailer from "nodemailer";

/**
 * Send transactional email via SMTP. No-ops (returns {skipped}) until SMTP env
 * vars are set, so the app works fully without it — configure to activate:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_SECURE ("true" for 465),
 *   SMTP_USER, SMTP_PASS, SMTP_FROM
 */
export async function sendMail(opts: { to: string; subject: string; text: string; replyTo?: string }): Promise<{ sent?: boolean; skipped?: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  if (!host) return { skipped: true };
  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      replyTo: opts.replyTo,
    });
    return { sent: true };
  } catch (e) {
    console.error("sendMail", e);
    return { error: "send failed" };
  }
}
