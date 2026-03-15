import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase";

async function getStats() {
  const supabase = createServiceRoleClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { count: leadsMonth } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());
  const { count: leadsWeek } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfWeek.toISOString());

  const { data: clients } = await supabase
    .from("clients")
    .select("id")
    .eq("is_active", true);
  const activeClients = clients?.length ?? 0;

  const { count: convTotal } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true });
  const { count: qualifiedTotal } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("is_qualified", true);
  const rate = (convTotal ?? 0) > 0 ? Math.round(((qualifiedTotal ?? 0) / (convTotal ?? 1)) * 100) : 0;

  const { count: rdvBooked } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("rdv_booked", true);

  return {
    leadsMonth: leadsMonth ?? 0,
    leadsWeek: leadsWeek ?? 0,
    activeClients,
    qualificationRate: rate,
    rdvBooked: rdvBooked ?? 0,
  };
}

async function getClientsWithLeadCount() {
  const supabase = createServiceRoleClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, website_url, is_active, agent_name")
    .order("name");
  if (!clients?.length) return [];
  const out: { id: string; name: string; website_url: string | null; is_active: boolean; agent_name: string | null; leadsCount: number }[] = [];
  for (const c of clients) {
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("client_id", c.id)
      .gte("created_at", startOfMonth.toISOString());
    out.push({
      id: c.id,
      name: c.name,
      website_url: c.website_url ?? null,
      is_active: c.is_active ?? true,
      agent_name: c.agent_name ?? null,
      leadsCount: count ?? 0,
    });
  }
  return out;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function DashboardPage() {
  const [stats, clients] = await Promise.all([getStats(), getClientsWithLeadCount()]);

  return (
    <div className="px-[40px] py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">Bonjour 👋</p>
          <h1 className="text-[1.75rem] font-bold text-[var(--text-primary)]">Vue d'ensemble</h1>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="btn-primary rounded-[10px] px-5 py-2.5 text-sm font-medium"
        >
          + Nouveau client
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl border-0 bg-[var(--purple-dark)] p-6 text-white shadow-md">
          <span className="text-[0.7rem] uppercase tracking-widest text-white/80">Clients actifs</span>
          <p className="text-[2.5rem] font-bold text-white">{stats.activeClients}</p>
          <p className="text-xs text-[var(--purple-light)]">↑ Actifs</p>
        </div>
        <div className="card p-6">
          <span className="text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">Leads ce mois</span>
          <p className="mt-1 text-[2.5rem] font-bold text-[var(--text-primary)]">
            <span className="rounded bg-[var(--purple-light)] px-1.5">{stats.leadsMonth}</span>
          </p>
        </div>
        <div className="card p-6">
          <span className="text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">Taux de qualification</span>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--purple-light)] transition-all"
              style={{ width: `${stats.qualificationRate}%` }}
            />
          </div>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{stats.qualificationRate}%</p>
        </div>
        <div className="card flex items-start gap-3 p-6">
          <span className="text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">RDV pris</span>
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-[var(--purple-mid)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[2.5rem] font-bold text-[var(--text-primary)]">{stats.rdvBooked}</span>
          </div>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Clients actifs</h2>
          <Link href="/dashboard/clients" className="text-sm font-medium text-[var(--purple-mid)] hover:underline">
            Voir tout →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 font-medium">Leads ce mois</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Aucun client.{" "}
                    <Link href="/dashboard/clients/new" className="text-[var(--purple-mid)] underline">
                      Créer un client
                    </Link>
                  </td>
                </tr>
              ) : (
                clients.slice(0, 8).map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--border)] transition hover:bg-[var(--cream)]"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/clients/${c.id}`} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--purple-light)] text-sm font-semibold text-[var(--purple-dark)]">
                          {initials(c.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{c.name}</p>
                          {c.website_url && (
                            <p className="text-xs text-[var(--text-muted)]">{c.website_url}</p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-[var(--cream)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]">
                        {c.agent_name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{c.leadsCount}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          c.is_active ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-[#fef2f2] text-[#dc2626]"
                        }`}
                      >
                        {c.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/clients/${c.id}`}
                        className="text-sm font-medium text-[var(--purple-mid)] hover:underline"
                      >
                        Gérer →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
