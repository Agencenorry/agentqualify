"use client";

import { useState, useEffect } from "react";
import type { Insight } from "@/lib/types";

type InsightEditorProps = {
  clientId: string;
};

export function InsightEditor({ clientId }: InsightEditorProps) {
  const [list, setList] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Insight | null>(null);
  const [form, setForm] = useState({
    challenge_keywords: "",
    stat: "",
    context: "",
    source: "",
    is_active: true,
  });

  async function fetchList() {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/insights`);
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
      challenge_keywords: "",
      stat: "",
      context: "",
      source: "",
      is_active: true,
    });
    setModalOpen(true);
  }

  function openEdit(i: Insight) {
    setEditing(i);
    setForm({
      challenge_keywords: Array.isArray(i.challenge_keywords) ? i.challenge_keywords.join(", ") : "",
      stat: i.stat ?? "",
      context: i.context ?? "",
      source: i.source ?? "",
      is_active: i.is_active !== false,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const challenge_keywords = form.challenge_keywords.split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
      challenge_keywords,
      stat: form.stat.trim(),
      context: form.context.trim(),
      source: form.source.trim() || null,
      is_active: form.is_active,
    };
    if (editing) {
      const res = await fetch(`/api/clients/${clientId}/insights/${editing.id}`, {
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
      const res = await fetch(`/api/clients/${clientId}/insights`, {
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
    if (!confirm("Supprimer cet insight ?")) return;
    const res = await fetch(`/api/clients/${clientId}/insights/${id}`, { method: "DELETE" });
    if (res.ok) setList((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="rounded-xl border border-[var(--border)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-[var(--text-primary)]">Stats & Insights</h3>
        <button
          type="button"
          onClick={openAdd}
          className="btn-primary rounded-[10px] px-4 py-2 text-sm"
        >
          + Ajouter un insight
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-6 text-center text-sm text-zinc-500">
          Aucun insight. Ajoutez-en pour les afficher quand le prospect mentionne un défi correspondant.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((ins) => (
            <li
              key={ins.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 p-4"
            >
              <span className="font-semibold text-zinc-900">{ins.stat}</span>
              <span className="text-xs text-zinc-500">{ins.context}</span>
              <span className="text-xs text-zinc-400">
                Mots-clés : {Array.isArray(ins.challenge_keywords) ? ins.challenge_keywords.join(", ") : "—"}
              </span>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => openEdit(ins)} className="text-sm text-zinc-600 hover:text-zinc-900">
                  Modifier
                </button>
                <button type="button" onClick={() => handleDelete(ins.id)} className="text-sm text-red-600 hover:text-red-700">
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
              {editing ? "Modifier l'insight" : "Ajouter un insight"}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-zinc-600">Mots-clés défi (séparés par des virgules)</label>
                <input
                  type="text"
                  value={form.challenge_keywords}
                  onChange={(e) => setForm((f) => ({ ...f, challenge_keywords: e.target.value }))}
                  placeholder="ex: leads, prospection, acquisition, conversion"
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-600">Stat</label>
                <input
                  type="text"
                  value={form.stat}
                  onChange={(e) => setForm((f) => ({ ...f, stat: e.target.value }))}
                  placeholder="ex: ×3 leads qualifiés"
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-600">Contexte</label>
                <input
                  type="text"
                  value={form.context}
                  onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
                  placeholder="ex: Les entreprises qui automatisent leur qualification"
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-600">Source (optionnel)</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  placeholder="ex: Étude interne Norry 2024"
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
              <button type="button" onClick={handleSave} disabled={!form.stat.trim() || !form.context.trim()} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
                {editing ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
