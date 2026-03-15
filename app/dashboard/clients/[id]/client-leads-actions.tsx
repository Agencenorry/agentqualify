"use client";

import { useCallback, useState } from "react";
import { LeadsTable } from "@/components/leads-table";
import type { Lead } from "@/lib/types";
import { markRdvBookedAction } from "./actions";
import { useRouter } from "next/navigation";

function buildCsv(leads: Lead[]): string {
  const headers = [
    "Nom",
    "Email",
    "Société",
    "Rôle",
    "Taille équipe",
    "Défi",
    "Budget",
    "Score",
    "Statut",
    "Résumé",
    "RDV proposé",
    "RDV pris",
    "Date",
  ];
  const rows = leads.map((l) => [
    l.name ?? "",
    l.email ?? "",
    l.company ?? "",
    l.role ?? "",
    l.team_size ?? "",
    l.main_challenge ?? "",
    l.budget ?? "",
    l.score ?? "",
    l.status ?? "",
    (l.summary ?? "").replace(/"/g, '""'),
    l.rdv_proposed ? "Oui" : "Non",
    l.rdv_booked ? "Oui" : "Non",
    l.created_at ? new Date(l.created_at).toLocaleString("fr-FR") : "",
  ]);
  const csvContent = [headers.join(";"), ...rows.map((r) => r.map((c) => `"${c}"`).join(";"))].join("\n");
  return "\uFEFF" + csvContent;
}

export function ClientLeadsActions({
  clientId,
  leads,
}: {
  clientId: string;
  leads: Lead[];
}) {
  const router = useRouter();
  const [leadsState, setLeadsState] = useState(leads);

  const onExportCsv = useCallback(() => {
    const csv = buildCsv(leadsState);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${clientId}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [clientId, leadsState]);

  const onRdvBooked = useCallback(
    async (leadId: string) => {
      await markRdvBookedAction(leadId);
      setLeadsState((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, rdv_booked: true } : l))
      );
      router.refresh();
    },
    [router]
  );

  return (
    <LeadsTable
      leads={leadsState}
      onExportCsv={onExportCsv}
      onRdvBooked={onRdvBooked}
    />
  );
}
