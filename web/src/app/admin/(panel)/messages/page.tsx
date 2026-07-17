import { db } from "@/lib/db";
import MessageActions from "@/components/admin/MessageActions";

export const metadata = { title: "Messages" };

function fmt(d: Date) {
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminMessages() {
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Messages</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Enquiries from the contact page and the homepage form.</p>

      {messages.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-10 text-center text-sm text-[var(--muted)]">
          No enquiries yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {messages.map((m) => (
            <li key={m.id} className={`rounded-2xl border bg-[var(--surface)] p-5 ${m.read ? "border-[var(--line)]" : "border-[var(--gold)]/50"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    {!m.read && <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />}
                    <span className="font-semibold">{m.name}</span>
                    <a href={`mailto:${m.email}`} className="truncate text-sm text-[var(--gold-ink)] hover:underline">{m.email}</a>
                  </div>
                  <div className="mt-0.5 font-mono text-[0.65rem] text-[var(--muted)]">
                    {fmt(m.createdAt)}{m.service ? ` · ${m.service}` : ""}
                  </div>
                </div>
                <MessageActions id={m.id} read={m.read} />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--bone-dim)]">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
