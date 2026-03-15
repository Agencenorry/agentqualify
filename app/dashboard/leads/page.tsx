import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase";

export default async function LeadsPage() {
  const supabase = createServiceRoleClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, client_id, name, email, company, score, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const clientIds = [...new Set((leads ?? []).map((l) => l.client_id))];
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .in("id", clientIds);
  const clientMap = new Map((clients ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="px-[40px] py-8">
      <p className="text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">Tous les leads</p>
      <h1 className="text-[1.75rem] font-bold text-[var(--text-primary)]">Leads</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Derniers leads qualifiés. Pour gérer les leads par client, allez dans Clients → choisir un client.
      </p>
      <div className="card mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">
                <th className="px-6 py-4 font-medium">Prospect</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Score</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!leads || leads.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Aucun lead. Les leads apparaîtront quand les visiteurs seront qualifiés par l'agent.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="border-b border-[var(--border)] transition hover:bg-[var(--cream)]">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{l.name || "—"}</p>
                        <p className="text-xs text-[var(--text-muted)]">{l.email || ""}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                      {clientMap.get(l.client_id) || l.client_id}
                    </td>
                    <td className="px-6 py-4">
                      {l.score != null ? (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-[var(--text-primary)] bg-[var(--cream)]">
                          {l.score}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-[var(--cream)] text-[var(--text-primary)]">
                        {l.status || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                      {l.created_at ? new Date(l.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/clients/${l.client_id}`}
                        className="text-sm font-medium text-[var(--purple-mid)] hover:underline"
                      >
                        Voir le client →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
