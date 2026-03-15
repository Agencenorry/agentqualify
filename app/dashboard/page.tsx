import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase";

async function getStats() {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count: leadsWeek } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfWeek.toISOString());
  const { count: leadsMonth } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth);

  return { leadsWeek: leadsWeek ?? 0, leadsMonth: leadsMonth ?? 0 };
}

async function getClientsWithLeadCount() {
  const supabase = createServiceRoleClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, is_active")
    .order("name");
  if (!clients?.length) return [];
  const out: { id: string; name: string; is_active: boolean; leadsCount: number }[] = [];
  for (const c of clients) {
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("client_id", c.id)
      .gte("created_at", startOfMonth.toISOString());
    out.push({
      id: c.id,
      name: c.name,
      is_active: c.is_active ?? true,
      leadsCount: count ?? 0,
    });
  }
  return out;
}

export default async function DashboardPage() {
  const [stats, clients] = await Promise.all([getStats(), getClientsWithLeadCount()]);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">
        Vue globale
      </h1>
      <div className="mb-8 flex gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Leads cette semaine</p>
          <p className="text-2xl font-semibold text-zinc-900">{stats.leadsWeek}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Leads ce mois</p>
          <p className="text-2xl font-semibold text-zinc-900">{stats.leadsMonth}</p>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="font-medium text-zinc-900">Clients</h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {clients.length === 0 ? (
            <li className="px-6 py-8 text-center text-zinc-500">
              Aucun client.{" "}
              <Link href="/dashboard/clients/new" className="text-zinc-900 underline">
                Créer un client
              </Link>
            </li>
          ) : (
            clients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/clients/${c.id}`}
                  className="flex items-center justify-between px-6 py-4 transition hover:bg-zinc-50"
                >
                  <span className="font-medium text-zinc-900">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500">
                      {c.leadsCount} lead{c.leadsCount !== 1 ? "s" : ""} ce mois
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {c.is_active ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
