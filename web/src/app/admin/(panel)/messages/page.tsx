import { db } from "@/lib/db";
import MessageActions from "@/components/admin/MessageActions";
import { TrashBar, TrashRowActions } from "@/components/admin/TrashActions";

export const metadata = { title: "Messages" };

function fmt(d: Date) {
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminMessages({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const isTrash = view === "trash";
  const [messages, allCount, trashCount] = await Promise.all([
    db.contactMessage.findMany({ where: { deletedAt: isTrash ? { not: null } : null }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.contactMessage.count({ where: { deletedAt: null } }),
    db.contactMessage.count({ where: { deletedAt: { not: null } } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Messages</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Enquiries from the contact page and the homepage form.</p>

      <div className="mt-5">
        <TrashBar basePath="/admin/messages" view={isTrash ? "trash" : "all"} allCount={allCount} trashCount={trashCount} />
      </div>

      {messages.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-10 text-center text-sm text-[var(--muted)]">
          {isTrash ? "Trash is empty." : "No enquiries yet."}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {messages.map((m) => (
            <li key={m.id} className={`rounded-2xl border bg-[var(--surface)] p-5 ${m.read || isTrash ? "border-[var(--line)]" : "border-[var(--gold)]/50"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    {!m.read && !isTrash && <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />}
                    <span className="font-semibold">{m.name}</span>
                    <a href={`mailto:${m.email}`} className="truncate text-sm text-[var(--gold-ink)] hover:underline">{m.email}</a>
                  </div>
                  <div className="mt-0.5 font-mono text-[0.65rem] text-[var(--muted)]">
                    {fmt(m.createdAt)}{m.service ? ` · ${m.service}` : ""}
                  </div>
                </div>
                {isTrash
                  ? <TrashRowActions model="contactMessage" id={m.id} title={`enquiry from ${m.name}`} />
                  : <MessageActions id={m.id} read={m.read} />}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--bone-dim)]">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
