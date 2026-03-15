"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case "grid":
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "users":
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case "target":
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "settings":
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 2.31 1.04 1.437 2.062a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-1.04 2.31-2.062 1.437a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-2.31-1.04-1.437-2.062a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543 1.04-2.31 2.062-1.437.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
}

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("N");

  const nav = [
    { href: "/dashboard", label: "Vue d'ensemble", icon: "grid" },
    { href: "/dashboard/clients", label: "Clients", icon: "users" },
    { href: "/dashboard/leads", label: "Leads", icon: "target" },
    { href: "/dashboard/settings", label: "Paramètres", icon: "settings" },
  ];

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user?.email) {
          const initial = user.email.slice(0, 2).toUpperCase();
          setUserEmail(initial);
        }
      });
  }, []);

  const handleNavClick = () => {
    onClose?.();
  };

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose?.();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col bg-[var(--purple-dark)]
        transition-transform duration-200 ease-out
        md:relative md:translate-x-0 md:inset-auto
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-4 md:p-6">
          <Link href="/dashboard" className="block" onClick={handleNavClick}>
            <span className="text-lg font-semibold text-white">AgentQualify</span>
            <span className="mt-0.5 block text-xs text-[var(--purple-light)]">by Norry</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 md:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 rounded-[10px] px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "border-l-[3px] border-[var(--purple-light)] bg-[rgba(228,198,251,0.15)] text-[var(--purple-light)] pl-[13px]"
                    : "text-white/55 hover:bg-white/[0.07]"
                }`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--purple-light)] text-sm font-semibold text-[var(--purple-dark)]"
            >
              {userEmail}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">Norry</p>
              <p className="text-xs text-white/70">Compte agence</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded-[10px] px-4 py-2 text-left text-sm text-white/55 transition hover:bg-white/[0.07]"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}
