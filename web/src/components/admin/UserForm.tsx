"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser, type UserActionState } from "@/lib/actions/users";
import { inputCls, labelCls, btnPrimaryCls, Notice } from "@/components/admin/ui";

type NewUserInput = { name: string; email: string; password: string; role: "admin" | "editor" };

const EMPTY: NewUserInput = { name: "", email: "", password: "", role: "editor" };

export default function UserForm() {
  const [data, setData] = useState<NewUserInput>(EMPTY);
  const [state, setState] = useState<UserActionState | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const set = <K extends keyof NewUserInput>(k: K, v: NewUserInput[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    setState(null);
  };

  const save = () =>
    startTransition(async () => {
      const res = await createUser(data);
      setState(res);
      if (res.ok) router.push("/admin/users");
    });

  return (
    <div className="max-w-xl space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div>
        <label htmlFor="u-name" className={labelCls}>Display name</label>
        <input id="u-name" className={inputCls} value={data.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div>
        <label htmlFor="u-email" className={labelCls}>Email (login)</label>
        <input id="u-email" type="email" autoComplete="off" className={inputCls} value={data.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div>
        <label htmlFor="u-password" className={labelCls}>Password (10+ characters)</label>
        <input id="u-password" type="password" autoComplete="new-password" className={inputCls} value={data.password} onChange={(e) => set("password", e.target.value)} />
      </div>
      <div>
        <label htmlFor="u-role" className={labelCls}>Role</label>
        <select id="u-role" className={inputCls} value={data.role} onChange={(e) => set("role", e.target.value as NewUserInput["role"])}>
          <option value="editor">Editor — content only (Posts, Pages, Projects, Gallery, Media, Messages)</option>
          <option value="admin">Admin — full access (also Users, Settings, Plugins, Appearance)</option>
        </select>
      </div>
      <Notice state={state} />
      <button
        type="button"
        onClick={save}
        disabled={pending || !data.name || !data.email || !data.password}
        className={btnPrimaryCls}
      >
        {pending ? "Creating…" : "Create user"}
      </button>
    </div>
  );
}
