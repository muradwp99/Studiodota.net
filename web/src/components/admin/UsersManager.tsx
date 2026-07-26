"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, deleteUser, type UserRow } from "@/lib/actions/users";
import { inputCls, btnDangerCls, Notice } from "@/components/admin/ui";

export default function UsersManager({ initial, meId }: { initial: UserRow[]; meId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const adminCount = initial.filter((u) => u.role === "admin").length;

  const changeRole = (id: string, role: string) =>
    startTransition(async () => {
      const res = await updateUserRole(id, role);
      setError(res.error ?? null);
      if (res.ok) router.refresh();
    });

  const remove = (row: UserRow) => {
    if (!window.confirm(`Remove "${row.name}"? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteUser(row.id);
      setError(res.error ?? null);
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <Notice state={error ? { error } : null} />
      <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {initial.map((u) => {
          const isLastAdmin = u.role === "admin" && adminCount <= 1;
          const isSelf = u.id === meId;
          return (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {u.name} {isSelf && <span className="text-xs font-normal text-[var(--muted)]">(you)</span>}
                </div>
                <div className="text-xs text-[var(--muted)]">{u.email}</div>
              </div>
              <span className="shrink-0 text-xs text-[var(--muted)]">
                {new Date(u.createdAt).toLocaleDateString()}
              </span>
              <select
                aria-label={`Role for ${u.name}`}
                className={`${inputCls} w-auto shrink-0`}
                value={u.role}
                disabled={pending}
                onChange={(e) => changeRole(u.id, e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
              </select>
              <button
                type="button"
                className={`${btnDangerCls} shrink-0`}
                disabled={pending || isSelf || isLastAdmin}
                title={isSelf ? "You can't remove your own account." : isLastAdmin ? "Can't remove the last admin." : undefined}
                onClick={() => remove(u)}
              >
                Remove
              </button>
            </li>
          );
        })}
        {initial.length === 0 && (
          <li className="px-5 py-8 text-center text-sm text-[var(--muted)]">No users yet.</li>
        )}
      </ul>
    </div>
  );
}
