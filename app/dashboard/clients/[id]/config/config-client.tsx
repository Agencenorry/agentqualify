"use client";

import { useState } from "react";
import Link from "next/link";
import { AgentConfigForm } from "@/components/agent-config-form";
import { WidgetPreview } from "@/components/widget-preview";
import { TriggerEditor } from "@/components/trigger-editor";
import type { Client, Trigger } from "@/lib/types";

type ConfigClientProps = {
  client: Client;
};

export function ConfigClient({ client }: ConfigClientProps) {
  const [triggers, setTriggers] = useState<Trigger[]>(
    Array.isArray(client.triggers) ? client.triggers : []
  );

  return (
    <div className="px-[40px] py-8">
      <nav className="mb-4 text-sm text-[var(--text-muted)]">
        <Link href="/dashboard/clients" className="hover:text-[var(--purple-mid)]">Clients</Link>
        <span className="mx-2">/</span>
        <Link href={`/dashboard/clients/${client.id}`} className="hover:text-[var(--purple-mid)]">{client.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--text-primary)]">Configuration</span>
      </nav>

      <h1 className="mb-2 text-[1.75rem] font-bold text-[var(--text-primary)]">Configuration de l'agent</h1>
      <p className="mb-8 text-[var(--text-muted)]">{client.name}</p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card mb-8 p-6">
            <AgentConfigForm client={client} />
          </div>
          <div className="card p-6">
            <TriggerEditor
              clientId={client.id}
              triggers={triggers}
              onUpdate={setTriggers}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <WidgetPreview
              clientId={client.id}
              widgetColor={client.widget_color ?? undefined}
              widgetPosition={client.widget_position ?? undefined}
            />
            <div className="card p-6">
              <h3 className="mb-2 font-semibold text-[var(--text-primary)]">Aperçu</h3>
              <p className="mb-4 text-sm text-[var(--text-muted)]">
                Le widget s'affiche en {client.widget_position === "bottom-right" ? "bas à droite" : client.widget_position === "bottom-left" ? "bas à gauche" : client.widget_position ?? "bas à droite"}.
              </p>
              <div className="h-24 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--cream)] flex items-center justify-center text-[var(--text-muted)] text-sm">
                Mini preview
              </div>
            </div>
            <p className="flex items-center gap-3 text-sm">
              <a
                href={`/api/chat/init?clientId=${client.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--cream)]"
              >
                Tester le widget
              </a>
              <span className="text-[var(--text-muted)]">
                Ouvre l'API init dans un nouvel onglet.
              </span>
            </p>
            <p className="rounded-lg border border-[var(--purple-light)] bg-[rgba(228,198,251,0.2)] px-4 py-3 text-sm text-[var(--text-primary)]">
              Les déclencheurs sont chargés automatiquement. Aucune modification du snippet nécessaire.
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Pour un déclenchement manuel : ajoutez <code className="rounded bg-[var(--cream)] px-1">data-aq-trigger</code> sur un élément HTML.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
