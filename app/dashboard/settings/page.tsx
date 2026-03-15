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
    <div className="px-[40px] py-8">
      <h1 className="mb-8 text-[1.75rem] font-bold text-[var(--text-primary)]">Paramètres</h1>

      <section className="card mb-8 p-6">
        <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Profil Norry</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Connecté avec : <span className="text-[var(--text-primary)]">{userEmail ?? "—"}</span>
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Pour modifier le mot de passe ou l'email, utilisez la gestion des utilisateurs dans le tableau de bord Supabase (Auth).
        </p>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-semibold text-[var(--text-primary)]">Clé API Anthropic</h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          La clé API Anthropic est configurée côté serveur via la variable d'environnement{" "}
          <code className="rounded bg-[var(--cream)] px-1">ANTHROPIC_API_KEY</code>. Configurez-la dans les variables d'environnement de votre projet Vercel (ou dans <code className="rounded bg-[var(--cream)] px-1">.env.local</code> en local).
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Aucune action nécessaire ici : le dashboard utilise cette clé pour les appels à Claude.
        </p>
      </section>
    </div>
  );
}
