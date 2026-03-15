"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Paramètres</h1>

      <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-medium text-zinc-900">Profil Norry</h2>
        <p className="text-sm text-zinc-500">
          Connecté avec : <span className="text-zinc-900">{userEmail ?? "—"}</span>
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Pour modifier le mot de passe ou l'email, utilisez la gestion des utilisateurs dans le tableau de bord Supabase (Auth).
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-medium text-zinc-900">Clé API Anthropic</h2>
        <p className="mb-4 text-sm text-zinc-500">
          La clé API Anthropic est configurée côté serveur via la variable d'environnement{" "}
          <code className="rounded bg-zinc-100 px-1">ANTHROPIC_API_KEY</code>. Configurez-la dans les variables d'environnement de votre projet Vercel (ou dans <code className="rounded bg-zinc-100 px-1">.env.local</code> en local).
        </p>
        <p className="text-sm text-zinc-500">
          Aucune action nécessaire ici : le dashboard utilise cette clé pour les appels à Claude.
        </p>
      </section>
    </div>
  );
}
