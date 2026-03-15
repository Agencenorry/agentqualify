"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

/**
 * Protège le dashboard : redirige vers /login si non connecté
 */
export function DashboardAuth({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`);
        return;
      }
      setChecking(false);
    });
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">Chargement...</p>
      </div>
    );
  }

  return <>{children}</>;
}
