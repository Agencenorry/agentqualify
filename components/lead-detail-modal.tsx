"use client";

import type { Lead } from "@/lib/types";

export function LeadDetailModal({
  lead,
  onClose,
  onRdvBooked,
}: {
  lead: Lead;
  onClose: () => void;
  onRdvBooked?: () => void;
}) {
  const rows = [
    { label: "Nom", value: lead.name },
    { label: "Email", value: lead.email },
    { label: "Société", value: lead.company },
    { label: "Rôle", value: lead.role },
    { label: "Taille d'équipe", value: lead.team_size },
    { label: "Défi principal", value: lead.main_challenge },
    { label: "Budget", value: lead.budget },
    { label: "Score", value: lead.score != null ? String(lead.score) : null },
    { label: "Statut", value: lead.status },
    { label: "Résumé", value: lead.summary },
    { label: "RDV proposé", value: lead.rdv_proposed ? "Oui" : "Non" },
    { label: "RDV pris", value: lead.rdv_booked ? "Oui" : "Non" },
    { label: "Date", value: lead.created_at ? new Date(lead.created_at).toLocaleString("fr-FR") : null },
  ];

  const recommendations = Array.isArray(lead.recommendations) ? lead.recommendations : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Détail du lead</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className="space-y-2 px-6 py-4">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 text-sm">
              <span className="text-zinc-500">{label}</span>
              <span className="text-right text-zinc-900">{value ?? "—"}</span>
            </div>
          ))}
          {recommendations.length > 0 && (
            <div className="mt-6 border-t border-zinc-200 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900">Préparer le RDV</h3>
              <ul className="list-none space-y-2">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-700">
                    <span aria-hidden>💡</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-200 px-6 py-4">
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Envoyer un email
            </a>
          )}
          {onRdvBooked && !lead.rdv_booked && (
            <button
              type="button"
              onClick={onRdvBooked}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Marquer RDV pris
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
