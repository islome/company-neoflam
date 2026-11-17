"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/[lang]/studio/actions";

export function StudioLogin() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  return (
    <form action={action} className="mx-auto mt-16 flex max-w-sm flex-col gap-4">
      <h1 className="heading-4 text-ink">3D Studio</h1>
      <p className="body-6 text-ink-soft">Staff only. Enter the Studio password.</p>
      <label className="flex flex-col gap-1">
        <span className="caption-1 text-ink">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="body-6 rounded-lg border border-line bg-white px-3 py-2 text-ink"
        />
      </label>
      {state.error && (
        <p role="alert" className="caption-1 text-brand">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="button-md rounded-full bg-ink px-6 py-3 text-white transition-opacity duration-300 hover:opacity-80 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
