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
  const [{ count: convCount }, { count: leadsCount }] = await Promise.all([
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("client_id", clientId),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("client_id", clientId),
  ]);
  const { count: qualifiedCount } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("is_qualified", true);
  const totalConv = convCount ?? 0;
  const rate = totalConv > 0 ? Math.round(((qualifiedCount ?? 0) / totalConv) * 100) : 0;
  return {
    conversations: totalConv,
    leads: leadsCount ?? 0,
    qualificationRate: rate,
  };
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
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{client.name}</h1>
          <p className="text-sm text-zinc-500">Dashboard leads</p>
        </div>
        <Link
          href={`/dashboard/clients/${id}/config`}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Configurer l'agent
        </Link>
      </div>
      <div className="mb-6 flex gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-zinc-500">Conversations</p>
          <p className="text-xl font-semibold text-zinc-900">{stats.conversations}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-zinc-500">Leads</p>
          <p className="text-xl font-semibold text-zinc-900">{stats.leads}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-zinc-500">Taux de qualification</p>
          <p className="text-xl font-semibold text-zinc-900">{stats.qualificationRate}%</p>
        </div>
      </div>
      <ClientLeadsActions clientId={id} leads={leads} />
    </div>
  );
}
