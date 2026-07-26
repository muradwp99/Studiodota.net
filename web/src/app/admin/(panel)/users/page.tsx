import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { listUsers } from "@/lib/actions/users";
import UsersManager from "@/components/admin/UsersManager";

export const metadata = { title: "All Users" };

export default async function AdminUsersIndex() {
  const me = await requireOwner();
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Users</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Admins have full access. Editors manage content only.</p>
        </div>
        <Link href="/admin/users/new" className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#17191c] hover:bg-[var(--gold-hi)]">
          + Add New
        </Link>
      </div>
      <UsersManager initial={users} meId={me.id} />
    </div>
  );
}
