"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { inputCls, labelCls, btnPrimaryCls } from "@/components/admin/ui";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className={labelCls}>Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputCls} placeholder="you@studiodota.net" />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputCls} placeholder="••••••••••••" />
      </div>
      {state.error && (
        <p role="alert" className="rounded-lg border border-[#a33]/30 bg-[#a33]/8 px-4 py-2.5 text-sm text-[#a33]">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${btnPrimaryCls} w-full justify-center`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
