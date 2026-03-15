"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "./actions";

export default function NewClientPage() {
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createClientAction({
      name,
      website_url: websiteUrl || undefined,
      contact_email: contactEmail || undefined,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.id) {
      router.push(`/dashboard/clients/${result.id}/config`);
    }
  }

  return (
    <div className="px-[40px] py-8">
      <h1 className="mb-8 text-[1.75rem] font-bold text-[var(--text-primary)]">Nouveau client</h1>
      <form onSubmit={handleSubmit} className="card max-w-md space-y-4 p-6">
        <div>
          <label htmlFor="name" className="mb-1 block text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)]">
            Nom du client *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-base w-full"
          />
        </div>
        <div>
          <label htmlFor="website" className="mb-1 block text-sm font-medium text-zinc-700">
            URL du site
          </label>
          <input
            id="website"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
            className="input-base w-full"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
            Email de contact
          </label>
          <input
            id="email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="input-base w-full"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary rounded-[10px] px-4 py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Création..." : "Créer et configurer l'agent"}
        </button>
      </form>
    </div>
  );
}
