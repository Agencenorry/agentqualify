"use client";

import { useState } from "react";
import type { Client } from "@/lib/types";

type ConfigFormProps = {
  client: Client;
  onSuccess?: () => void;
};

export function AgentConfigForm({ client, onSuccess }: ConfigFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: client.name,
    website_url: client.website_url ?? "",
    contact_email: client.contact_email ?? "",
    is_active: client.is_active,
    agent_name: client.agent_name ?? "Alex",
    agent_greeting: client.agent_greeting ?? "",
    business_description: client.business_description ?? "",
    business_offers: client.business_offers ?? "",
    icp: client.icp ?? "",
    disqualify_criteria: client.disqualify_criteria ?? "",
    qualification_questions: Array.isArray(client.qualification_questions)
      ? (client.qualification_questions as string[]).join("\n")
      : "",
    rdv_link: client.rdv_link ?? "",
    notification_email: client.notification_email ?? "",
    widget_color: client.widget_color ?? "#1a1917",
    widget_position: client.widget_position ?? "bottom-right",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        qualification_questions: form.qualification_questions
          .split("\n")
          .map((q) => q.trim())
          .filter(Boolean),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de la sauvegarde");
      return;
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-medium text-zinc-900">Informations client</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Nom</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">URL du site</label>
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Email contact</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded border-zinc-300"
            />
            <label htmlFor="is_active" className="text-sm text-zinc-600">Agent actif</label>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-medium text-zinc-900">Agent IA</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Nom de l'agent</label>
            <input
              type="text"
              value={form.agent_name}
              onChange={(e) => setForm((f) => ({ ...f, agent_name: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Message d'accueil</label>
            <textarea
              value={form.agent_greeting}
              onChange={(e) => setForm((f) => ({ ...f, agent_greeting: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Description de l'activité</label>
            <textarea
              value={form.business_description}
              onChange={(e) => setForm((f) => ({ ...f, business_description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Offres / services</label>
            <textarea
              value={form.business_offers}
              onChange={(e) => setForm((f) => ({ ...f, business_offers: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Profil client idéal (ICP)</label>
            <textarea
              value={form.icp}
              onChange={(e) => setForm((f) => ({ ...f, icp: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Critères disqualifiants</label>
            <textarea
              value={form.disqualify_criteria}
              onChange={(e) => setForm((f) => ({ ...f, disqualify_criteria: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Questions de qualification (une par ligne)</label>
            <textarea
              value={form.qualification_questions}
              onChange={(e) => setForm((f) => ({ ...f, qualification_questions: e.target.value }))}
              rows={4}
              placeholder="Quel est votre rôle ?&#10;Quelle est la taille de votre équipe ?"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Lien prise de RDV</label>
            <input
              type="url"
              value={form.rdv_link}
              onChange={(e) => setForm((f) => ({ ...f, rdv_link: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Email notifications</label>
            <input
              type="email"
              value={form.notification_email}
              onChange={(e) => setForm((f) => ({ ...f, notification_email: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-medium text-zinc-900">Widget</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Couleur</label>
            <input
              type="color"
              value={form.widget_color}
              onChange={(e) => setForm((f) => ({ ...f, widget_color: e.target.value }))}
              className="h-10 w-full rounded border border-zinc-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600">Position</label>
            <select
              value={form.widget_position}
              onChange={(e) => setForm((f) => ({ ...f, widget_position: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            >
              <option value="bottom-right">Bas droite</option>
              <option value="bottom-left">Bas gauche</option>
              <option value="top-right">Haut droite</option>
              <option value="top-left">Haut gauche</option>
            </select>
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
