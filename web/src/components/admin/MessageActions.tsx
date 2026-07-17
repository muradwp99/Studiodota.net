"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMessageRead, deleteMessage } from "@/lib/actions/collections";

export default function MessageActions({ id, read }: { id: string; read: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <span className="flex shrink-0 items-center gap-3 text-xs">
      <button
        type="button"
        disabled={pending}
        className="text-[var(--gold-ink)] hover:underline disabled:opacity-50"
        onClick={() =>
          startTransition(async () => {
            await setMessageRead(id, !read);
            router.refresh();
          })
        }
      >
        {read ? "Mark unread" : "Mark read"}
      </button>
      <button
        type="button"
        disabled={pending}
        className="text-[#a33] hover:underline disabled:opacity-50"
        onClick={() => {
          if (!window.confirm("Delete this message permanently?")) return;
          startTransition(async () => {
            await deleteMessage(id);
            router.refresh();
          });
        }}
      >
        Delete
      </button>
    </span>
  );
}
