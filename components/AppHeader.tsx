"use client";
import Link from "next/link";
import { useAppStore, useCurrentUser, useTenant } from "@/lib/store";

/**
 * Global slim header. The "Viewing as" switcher is a dev affordance standing
 * in for real auth (// SEAM) — it exercises the role gates (Trainee work
 * routes to a Supervisor for sign-off).
 */
export function AppHeader() {
  const tenant = useTenant();
  const user = useCurrentUser();
  const users = useAppStore((s) => s.users);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <Link href="/app" className="text-sm font-semibold tracking-tight text-zinc-900">
          Aivre
        </Link>
        <span className="text-xs text-zinc-400">·</span>
        <span className="text-xs text-zinc-500">{tenant.name}</span>
        <Link href="/" className="text-[11px] text-zinc-400 hover:text-zinc-600">
          ← Website
        </Link>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-400">Viewing as</span>
        <select
          aria-label="Viewing as user"
          value={user.id}
          onChange={(e) => setCurrentUser(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-1.5 py-1 text-xs"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.role}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
