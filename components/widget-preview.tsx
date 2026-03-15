"use client";

import { useCallback, useState } from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

type WidgetPreviewProps = {
  clientId: string;
  widgetColor?: string;
  widgetPosition?: string;
};

export function WidgetPreview({ clientId, widgetColor = "#1a1917", widgetPosition = "bottom-right" }: WidgetPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const embedCode = `<script src="${APP_URL}/widget-loader.js" data-client-id="${clientId}"></script>`;

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(embedCode);
  }, [embedCode]);

  const openTestWidget = useCallback(() => {
    setShowPreview(true);
    const url = `${APP_URL}/widget-loader.js`;
    const script = document.createElement("script");
    script.src = url;
    script.setAttribute("data-client-id", clientId);
    script.onload = () => {
      (window as unknown as { AgentQualifyConfig?: { clientId: string; widgetColor?: string; widgetPosition?: string } }).AgentQualifyConfig = {
        clientId,
        widgetColor,
        widgetPosition,
      };
    };
    document.body.appendChild(script);
  }, [clientId, widgetColor, widgetPosition]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-medium text-zinc-900">Intégration widget</h3>
      <p className="mb-3 text-sm text-zinc-600">
        Collez ce code avant la balise <code className="rounded bg-zinc-100 px-1">&lt;/body&gt;</code> sur le site de votre client.
      </p>
      <pre className="mb-4 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
        {embedCode}
      </pre>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyCode}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Copier le code
        </button>
        <button
          type="button"
          onClick={openTestWidget}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Tester l'agent
        </button>
      </div>
      <p className="mt-4 text-sm text-zinc-500">
        Aperçu : le bouton du widget apparaît en {widgetPosition === "bottom-right" ? "bas à droite" : widgetPosition === "bottom-left" ? "bas à gauche" : widgetPosition}.
      </p>
    </div>
  );
}
