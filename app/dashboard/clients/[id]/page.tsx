import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase";
import { LeadsTable } from "@/components/leads-table";
import { ClientLeadsActions } from "./client-leads-actions";
import type { Lead } from "@/lib/types";

async function getClient(id: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data;
}

async function getClientStats(clientId: string) {
  const supabase = createServiceRoleClient();
  const [{ count: leadsCount }] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("client_id", clientId),
  ]);
  const { data: leads } = await supabase.from("leads").select("score, rdv_booked").eq("client_id", clientId);
  const total = leads?.length ?? 0;
  const avgScore = total > 0 && leads?.some((l) => l.score != null)
    ? Math.round(leads!.reduce((s, l) => s + (l.score ?? 0), 0) / leads!.filter((l) => l.score != null).length)
    : null;
  const rdvCount = leads?.filter((l) => l.rdv_booked).length ?? 0;
  return { leads: leadsCount ?? 0, avgScore, rdvBooked: rdvCount };
}

async function getLeads(clientId: string): Promise<Lead[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Lead[];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function ClientDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, stats, leads] = await Promise.all([
    getClient(id),
    getClientStats(id),
    getLeads(id),
  ]);
  if (!client) notFound();

  return (
    <div className="px-[40px] py-8">
      <nav className="mb-4 text-sm text-[var(--text-muted)]">
        <Link href="/dashboard/clients" className="hover:text-[var(--purple-mid)]">Clients</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--text-primary)]">{client.name}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--purple-light)] text-lg font-bold text-[var(--purple-dark)]">
            {initials(client.name)}
          </div>
          <div>
            <h1 className="text-[1.75rem] font-bold text-[var(--text-primary)]">{client.name}</h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                client.is_active ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-[#fef2f2] text-[#dc2626]"
              }`}
            >
              {client.is_active ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/dashboard/clients/${id}/config`}
            className="btn-secondary rounded-[10px] px-4 py-2 text-sm"
          >
            Configurer l'agent
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <p className="text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">Leads total</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.leads}</p>
        </div>
        <div className="card p-6">
          <p className="text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">Score moyen</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.avgScore ?? "—"}</p>
        </div>
        <div className="card p-6">
          <p className="text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">RDV pris</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.rdvBooked}</p>
        </div>
      </div>

      <ClientLeadsActions clientId={id} leads={leads} />
    </div>
  );
}
