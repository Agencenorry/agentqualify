"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const nav = [
    { href: "/dashboard", label: "Vue globale" },
    { href: "/dashboard/clients", label: "Clients" },
    { href: "/dashboard/settings", label: "Paramètres" },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-zinc-200 bg-zinc-900">
      <div className="border-b border-zinc-800 p-4">
        <Link href="/dashboard" className="text-lg font-semibold text-white">
          AgentQualify
        </Link>
        <p className="text-xs text-zinc-400">by Norry</p>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
              pathname === item.href
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-zinc-800 p-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
