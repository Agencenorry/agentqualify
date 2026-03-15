import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase";

export default async function ClientsPage() {
  const supabase = createServiceRoleClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, contact_email, is_active")
    .order("name");

  const withCount: { id: string; name: string; contact_email: string | null; is_active: boolean; leadsCount: number }[] = [];
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
        contact_email: c.contact_email ?? null,
        is_active: c.is_active ?? true,
        leadsCount: count ?? 0,
      });
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Clients</h1>
        <Link
          href="/dashboard/clients/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Nouveau client
        </Link>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <ul className="divide-y divide-zinc-100">
          {withCount.length === 0 ? (
            <li className="px-6 py-12 text-center text-zinc-500">
              Aucun client.{" "}
              <Link href="/dashboard/clients/new" className="text-zinc-900 underline">
                Créer un client
              </Link>
            </li>
          ) : (
            withCount.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/clients/${c.id}`}
                  className="flex items-center justify-between px-6 py-4 transition hover:bg-zinc-50"
                >
                  <div>
                    <span className="font-medium text-zinc-900">{c.name}</span>
                    {c.contact_email && (
                      <p className="text-sm text-zinc-500">{c.contact_email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500">
                      {c.leadsCount} lead(s) ce mois
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
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
