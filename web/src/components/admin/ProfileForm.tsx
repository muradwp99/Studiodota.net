"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, changePassword } from "@/lib/actions/users";
import { inputCls, labelCls, btnPrimaryCls, Notice } from "@/components/admin/ui";

export default function ProfileForm({ initial }: { initial: { name: string; email: string } }) {
  const [profile, setProfile] = useState(initial);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [profileState, setProfileState] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pwState, setPwState] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const saveProfile = () =>
    startTransition(async () => {
      const res = await updateProfile(profile);
      setProfileState(res);
      if (res.ok) router.refresh();
    });

  const savePassword = () => {
    if (pw.next !== pw.confirm) {
      setPwState({ error: "New passwords don't match." });
      return;
    }
    startTransition(async () => {
      const res = await changePassword({ current: pw.current, next: pw.next });
      setPwState(res);
      if (res.ok) setPw({ current: "", next: "", confirm: "" });
    });
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-bold">Profile</h2>
        <div>
          <label htmlFor="pf-name" className={labelCls}>Display name</label>
          <input id="pf-name" className={inputCls} value={profile.name} onChange={(e) => { setProfile((p) => ({ ...p, name: e.target.value })); setProfileState(null); }} />
        </div>
        <div>
          <label htmlFor="pf-email" className={labelCls}>Email (login)</label>
          <input id="pf-email" type="email" className={inputCls} value={profile.email} onChange={(e) => { setProfile((p) => ({ ...p, email: e.target.value })); setProfileState(null); }} />
        </div>
        <Notice state={profileState} />
        <button type="button" onClick={saveProfile} disabled={pending} className={btnPrimaryCls}>
          {pending ? "Saving…" : "Save profile"}
        </button>
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <h2 className="text-sm font-bold">Change password</h2>
        <div>
          <label htmlFor="pw-current" className={labelCls}>Current password</label>
          <input id="pw-current" type="password" autoComplete="current-password" className={inputCls} value={pw.current} onChange={(e) => { setPw((p) => ({ ...p, current: e.target.value })); setPwState(null); }} />
        </div>
        <div>
          <label htmlFor="pw-next" className={labelCls}>New password (10+ characters)</label>
          <input id="pw-next" type="password" autoComplete="new-password" className={inputCls} value={pw.next} onChange={(e) => { setPw((p) => ({ ...p, next: e.target.value })); setPwState(null); }} />
        </div>
        <div>
          <label htmlFor="pw-confirm" className={labelCls}>Confirm new password</label>
          <input id="pw-confirm" type="password" autoComplete="new-password" className={inputCls} value={pw.confirm} onChange={(e) => { setPw((p) => ({ ...p, confirm: e.target.value })); setPwState(null); }} />
        </div>
        <Notice state={pwState} />
        <button type="button" onClick={savePassword} disabled={pending || !pw.current || !pw.next} className={btnPrimaryCls}>
          {pending ? "Saving…" : "Change password"}
        </button>
      </section>
    </div>
  );
}
