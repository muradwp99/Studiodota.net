import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** GET /admin/messages/export — download live enquiries as CSV. */
export async function GET() {
  await requireAdmin();
  const rows = await db.contactMessage.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const header = ["Date", "Name", "Email", "Service", "Read", "Message"];
  const lines = [header.map(cell).join(",")];
  for (const m of rows) {
    lines.push([m.createdAt.toISOString(), m.name, m.email, m.service, m.read ? "yes" : "no", m.message].map(cell).join(","));
  }
  const csv = "﻿" + lines.join("\r\n"); // BOM so Excel reads UTF-8

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="enquiries.csv"',
    },
  });
}
