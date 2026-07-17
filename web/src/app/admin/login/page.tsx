import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Sign in · Studiodota Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getAdmin();
  if (user) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ink-2)] p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--gold)] text-lg font-extrabold text-[#17191c]">S</span>
          <div>
            <div className="text-lg font-extrabold uppercase tracking-[0.1em]">Studiodota</div>
            <div className="text-xs text-[var(--muted)]">Content manager</div>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
