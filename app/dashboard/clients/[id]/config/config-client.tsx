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
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/dashboard/clients/${client.id}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Retour au client
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
        Configuration de l'agent
      </h1>
      <p className="mb-8 text-zinc-500">{client.name}</p>

      <div className="mb-8">
        <AgentConfigForm client={client} />
      </div>

      <div className="mb-8">
        <TriggerEditor
          clientId={client.id}
          triggers={triggers}
          onUpdate={setTriggers}
        />
      </div>

      <div className="mt-8">
        <WidgetPreview
          clientId={client.id}
          widgetColor={client.widget_color ?? undefined}
          widgetPosition={client.widget_position ?? undefined}
        />
        <p className="mt-3 flex items-center gap-3">
          <a
            href={`/api/chat/init?clientId=${client.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Tester le widget
          </a>
          <span className="text-sm text-zinc-500">
            Ouvre la réponse de l’API init (agentName, greeting, triggers) dans un nouvel onglet.
          </span>
        </p>
        <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Les déclencheurs sont chargés automatiquement. Aucune modification du
          snippet nécessaire après configuration.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Exemple pour un déclenchement manuel : ajoutez{" "}
          <code className="rounded bg-zinc-100 px-1">data-aq-trigger</code> sur
          n'importe quel élément HTML (ex. un bouton « Demander une démo »).
        </p>
      </div>
    </div>
  );
}
