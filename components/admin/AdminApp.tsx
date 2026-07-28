"use client";

import { useEffect, useState } from "react";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  async function checkSession() {
    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      const data = await res.json().catch(() => ({ ok: false }));
      setAuthed(Boolean(data.ok));
    } catch {
      setAuthed(false);
    }
  }

  useEffect(() => {
    checkSession();
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    setAuthed(false);
  }

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zen-bg">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-zen-red-bright border-t-transparent" />
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return <AdminPanel onLogout={logout} />;
}
