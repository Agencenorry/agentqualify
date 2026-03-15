/**
 * Sert le script widget dynamique pour un client (injecte clientId dans le loader)
 * Réponse : JavaScript avec le clientId en variable pour le widget
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  if (!clientId) {
    return new NextResponse('clientId manquant', { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: client, error } = await supabase
    .from('clients')
    .select('id, widget_color, widget_position')
    .eq('id', clientId)
    .eq('is_active', true)
    .single();

  if (error || !client) {
    return new NextResponse('Client introuvable', { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const widgetLoaderUrl = `${baseUrl}/widget-loader.js`;

  const js = `
(function() {
  window.AgentQualifyConfig = window.AgentQualifyConfig || {};
  window.AgentQualifyConfig.clientId = "${clientId}";
  window.AgentQualifyConfig.widgetColor = ${JSON.stringify(client.widget_color || '#1a1917')};
  window.AgentQualifyConfig.widgetPosition = ${JSON.stringify(client.widget_position || 'bottom-right')};
  var s = document.createElement('script');
  s.src = "${widgetLoaderUrl}";
  s.async = true;
  document.head.appendChild(s);
})();
`.trim();

  return new NextResponse(js, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
