import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import UserForm from "@/components/admin/UserForm";

export const metadata = { title: "Add New User" };

export default async function NewUserPage() {
  await requireOwner();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-xs text-[var(--muted)] hover:text-[var(--gold-ink)]">← All users</Link>
        <h1 className="mt-1 text-2xl font-extrabold">Add new user</h1>
      </div>
      <UserForm />
    </div>
  );
}
