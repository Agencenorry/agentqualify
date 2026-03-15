"use client";

import { useCallback, useState } from "react";

const APP_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL) ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

type WidgetPreviewProps = {
  clientId: string;
  widgetColor?: string;
  widgetPosition?: string;
};

export function WidgetPreview({ clientId, widgetColor = "#1a1917", widgetPosition = "bottom-right" }: WidgetPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const snippet = `<script 
  src="${APP_URL}/widget-loader.js"
  data-client-id="${clientId}">
</script>`;

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(snippet);
  }, [snippet]);

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
    <div className="card p-6">
      <h3 className="mb-2 font-semibold text-[var(--text-primary)]">Intégration widget</h3>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Collez ce code avant la balise <code className="rounded bg-[var(--cream)] px-1">&lt;/body&gt;</code> sur le site de votre client.
      </p>
      <pre className="mb-4 overflow-x-auto rounded-xl bg-[var(--purple-dark)] p-5 font-mono text-sm text-white">
        {snippet}
      </pre>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyCode}
          className="rounded-lg bg-[var(--yellow)] px-4 py-2 text-sm font-semibold text-[var(--purple-dark)] transition hover:opacity-90"
        >
          Copier
        </button>
        <button
          type="button"
          onClick={openTestWidget}
          className="btn-secondary rounded-lg px-4 py-2 text-sm"
        >
          Tester l'agent
        </button>
      </div>
    </div>
  );
}
