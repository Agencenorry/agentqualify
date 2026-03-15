import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase";

export default async function ClientsPage() {
  const supabase = createServiceRoleClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, website_url, contact_email, is_active, agent_name")
    .order("name");

  const withCount: { id: string; name: string; website_url: string | null; is_active: boolean; agent_name: string | null; leadsCount: number }[] = [];
  if (clients?.length) {
    for (const c of clients) {
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("client_id", c.id)
        .gte("created_at", startOfMonth.toISOString());
      withCount.push({
        id: c.id,
        name: c.name,
        website_url: c.website_url ?? null,
        is_active: c.is_active ?? true,
        agent_name: c.agent_name ?? null,
        leadsCount: count ?? 0,
      });
    }
  }

  function initials(name: string): string {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="px-[40px] py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[1.75rem] font-bold text-[var(--text-primary)]">Clients</h1>
        <Link
          href="/dashboard/clients/new"
          className="btn-primary rounded-[10px] px-5 py-2.5 text-sm font-medium"
        >
          + Nouveau client
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {withCount.length === 0 ? (
          <div className="card col-span-full flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[var(--text-muted)]">Aucun client.</p>
            <Link href="/dashboard/clients/new" className="mt-2 text-[var(--purple-mid)] font-medium hover:underline">
              Créer un client
            </Link>
          </div>
        ) : (
          withCount.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/clients/${c.id}`}
              className="card flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(46,19,67,0.1)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--purple-light)] text-sm font-bold text-[var(--purple-dark)]">
                    {initials(c.name)}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{c.name}</p>
                    {c.website_url && (
                      <p className="text-xs text-[var(--text-muted)] truncate max-w-[180px]">{c.website_url}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    c.is_active ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-[#fef2f2] text-[#dc2626]"
                  }`}
                >
                  {c.is_active ? "Actif" : "Inactif"}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <svg className="h-4 w-4 text-[var(--purple-mid)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>{c.leadsCount} leads ce mois</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="badge-active">
                  <span className="badge-active-dot" />
                  Agent : {c.agent_name || "—"}
                </span>
              </div>
              <div className="mt-4 flex gap-3 border-t border-[var(--border)] pt-4">
                <span className="text-sm font-medium text-[var(--purple-mid)] hover:underline">Leads</span>
                <Link
                  href={`/dashboard/clients/${c.id}/config`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-medium text-[var(--purple-mid)] hover:underline"
                >
                  Config
                </Link>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
