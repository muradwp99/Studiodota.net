import { requireAdmin } from "@/lib/auth";
import ProfileForm from "@/components/admin/ProfileForm";

export const metadata = { title: "Profile" };

export default async function AdminProfile() {
  const user = await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Profile</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Your admin account — display name, login email, and password.</p>
      </div>
      <ProfileForm initial={{ name: user.name, email: user.email }} />
    </div>
  );
}
