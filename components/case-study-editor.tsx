"use client";

import { useState, useEffect } from "react";
import type { CaseStudy } from "@/lib/types";

type CaseStudyEditorProps = {
  clientId: string;
};

export function CaseStudyEditor({ clientId }: CaseStudyEditorProps) {
  const [list, setList] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CaseStudy | null>(null);
  const [form, setForm] = useState({
    sector: "",
    sector_keywords: "",
    company_name: "",
    result: "",
    description: "",
    logo_url: "",
    case_url: "",
    is_active: true,
  });

  async function fetchList() {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/case-studies`);
    if (res.ok) {
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchList();
  }, [clientId]);

  function openAdd() {
    setEditing(null);
    setForm({
      sector: "",
      sector_keywords: "",
      company_name: "",
      result: "",
      description: "",
      logo_url: "",
      case_url: "",
      is_active: true,
    });
    setModalOpen(true);
  }

  function openEdit(cs: CaseStudy) {
    setEditing(cs);
    setForm({
      sector: cs.sector ?? "",
      sector_keywords: Array.isArray(cs.sector_keywords) ? cs.sector_keywords.join(", ") : "",
      company_name: cs.company_name ?? "",
      result: cs.result ?? "",
      description: cs.description ?? "",
      logo_url: cs.logo_url ?? "",
      case_url: cs.case_url ?? "",
      is_active: cs.is_active !== false,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const sector_keywords = form.sector_keywords.split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
      sector: form.sector.trim(),
      sector_keywords,
      company_name: form.company_name.trim(),
      result: form.result.trim(),
      description: form.description.trim() || null,
      logo_url: form.logo_url.trim() || null,
      case_url: form.case_url.trim() || null,
      is_active: form.is_active,
    };
    if (editing) {
      const res = await fetch(`/api/clients/${clientId}/case-studies/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setList((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
        setModalOpen(false);
      }
    } else {
      const res = await fetch(`/api/clients/${clientId}/case-studies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setList((prev) => [created, ...prev]);
        setModalOpen(false);
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette réalisation ?")) return;
    const res = await fetch(`/api/clients/${clientId}/case-studies/${id}`, { method: "DELETE" });
    if (res.ok) setList((prev) => prev.filter((c) => c.id !== id));
  }

  const sectorColors: Record<string, string> = {
    immobilier: "bg-amber-100 text-amber-800",
    saas: "bg-blue-100 text-blue-800",
    retail: "bg-emerald-100 text-emerald-800",
    santé: "bg-rose-100 text-rose-800",
  };
  const sectorBadgeClass = (s: string) => sectorColors[s.toLowerCase()] ?? "bg-zinc-100 text-zinc-700";

  return (
    <div className="rounded-xl border border-[var(--border)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-[var(--text-primary)]">Réalisations clients</h3>
        <button
          type="button"
          onClick={openAdd}
          className="btn-primary rounded-[10px] px-4 py-2 text-sm"
        >
          + Ajouter une réalisation
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-6 text-center text-sm text-zinc-500">
          Aucune réalisation. Ajoutez-en pour les afficher au prospect quand son secteur correspond.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((cs) => (
            <li
              key={cs.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-4"
            >
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sectorBadgeClass(cs.sector)}`}>
                {cs.sector}
              </span>
              <span className="font-medium text-zinc-900">{cs.company_name}</span>
              <span className="text-sm font-semibold text-zinc-700">{cs.result}</span>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => openEdit(cs)} className="text-sm text-zinc-600 hover:text-zinc-900">
                  Modifier
                </button>
                <button type="button" onClick={() => handleDelete(cs.id)} className="text-sm text-red-600 hover:text-red-700">
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModalOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="mb-4 font-medium text-zinc-900">
              {editing ? "Modifier la réalisation" : "Ajouter une réalisation"}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-zinc-600">Secteur principal</label>
                <input
                  type="text"
                  value={form.sector}
                  onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                  placeholder="ex: Immobilier"
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-600">Mots-clés secteur (séparés par des virgules)</label>
                <input
                  type="text"
                  value={form.sector_keywords}
                  onChange={(e) => setForm((f) => ({ ...f, sector_keywords: e.target.value }))}
                  placeholder="ex: immo, agence, promoteur, foncier"
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-600">Nom de la société</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                  placeholder="ex: Cabinet Martin"
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-600">Résultat clé</label>
                <input
                  type="text"
                  value={form.result}
                  onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
                  placeholder="ex: +340% de leads en 3 mois"
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-600">Description courte (2-3 phrases)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Un cabinet immobilier lyonnais qui..."
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-600">URL du logo (optionnel)</label>
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-600">Lien vers la réalisation (optionnel)</label>
                <input
                  type="url"
                  value={form.case_url}
                  onChange={(e) => setForm((f) => ({ ...f, case_url: e.target.value }))}
                  placeholder="https://..."
                  className="input-base w-full"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-600">Actif</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                Annuler
              </button>
              <button type="button" onClick={handleSave} disabled={!form.sector.trim() || !form.company_name.trim() || !form.result.trim()} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
                {editing ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
