"use client";

import { useState } from "react";
import type { Lead } from "@/lib/types";
import { LeadDetailModal } from "./lead-detail-modal";

function scoreColor(score: number | null): string {
  if (score == null) return "bg-zinc-200 text-zinc-600";
  if (score >= 70) return "bg-emerald-100 text-emerald-700";
  if (score >= 40) return "bg-amber-100 text-amber-700";
  return "bg-zinc-100 text-zinc-600";
}

function statusBadge(status: string | null) {
  if (!status) return null;
  const labels: Record<string, string> = { hot: "Hot", warm: "Warm", cold: "Cold" };
  const styles: Record<string, string> = {
    hot: "bg-red-100 text-red-700",
    warm: "bg-amber-100 text-amber-700",
    cold: "bg-zinc-100 text-zinc-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-zinc-100"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function LeadsTable({
  leads,
  onExportCsv,
  onRdvBooked,
}: {
  leads: Lead[];
  onExportCsv?: () => void;
  onRdvBooked?: (leadId: string) => void;
}) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="font-medium text-zinc-900">Leads</h2>
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Export CSV
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50 text-left text-sm text-zinc-600">
                <th className="px-6 py-3 font-medium">Nom</th>
                <th className="px-6 py-3 font-medium">Société</th>
                <th className="px-6 py-3 font-medium">Score</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Résumé</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                    Aucun lead pour le moment
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                    <td className="px-6 py-3 font-medium text-zinc-900">{lead.name ?? "—"}</td>
                    <td className="px-6 py-3 text-zinc-600">{lead.company ?? "—"}</td>
                    <td className="px-6 py-3">
                      {lead.score != null ? (
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${scoreColor(lead.score)}`}
                          title={`Score: ${lead.score}`}
                        >
                          {lead.score}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-3">{statusBadge(lead.status)}</td>
                    <td className="max-w-[200px] truncate px-6 py-3 text-sm text-zinc-600" title={lead.summary ?? undefined}>
                      {lead.summary ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-zinc-500">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLead(lead)}
                          className="text-sm font-medium text-zinc-700 hover:underline"
                        >
                          Voir
                        </button>
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-sm font-medium text-zinc-700 hover:underline"
                          >
                            Email
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onRdvBooked={onRdvBooked ? () => { onRdvBooked(selectedLead.id); setSelectedLead(null); } : undefined}
        />
      )}
    </>
  );
}
