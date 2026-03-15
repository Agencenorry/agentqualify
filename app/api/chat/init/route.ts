/**
 * GET /api/chat/init?clientId=xxx
 * Retourne les infos publiques du client pour initialiser le widget.
 * Pas d'auth — appelé côté visiteur.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId');
  if (!clientId) {
    return NextResponse.json({ error: 'clientId requis' }, { status: 400, headers: corsHeaders() });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data: client, error } = await supabase
      .from('clients')
      .select('agent_name, agent_greeting, widget_color, widget_position, rdv_link, cta_text, cta_url, triggers')
      .eq('id', clientId)
      .eq('is_active', true)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404, headers: corsHeaders() });
    }

    const triggers = Array.isArray(client.triggers) ? client.triggers : [];

    const { data: caseStudiesRows } = await supabase
      .from('case_studies')
      .select('id, sector, sector_keywords, company_name, result, description, logo_url, case_url')
      .eq('client_id', clientId)
      .eq('is_active', true);
    const caseStudies = Array.isArray(caseStudiesRows) ? caseStudiesRows : [];

    const { data: insightsRows } = await supabase
      .from('insights')
      .select('id, challenge_keywords, stat, context, source')
      .eq('client_id', clientId)
      .eq('is_active', true);
    const insights = Array.isArray(insightsRows) ? insightsRows : [];

    return NextResponse.json(
      {
        agentName: client.agent_name ?? 'Alex',
        greeting: client.agent_greeting ?? '',
        widgetColor: client.widget_color ?? '#1a1917',
        widgetPosition: client.widget_position ?? 'bottom-right',
        ctaUrl: client.cta_url ?? client.rdv_link ?? '',
        ctaText: client.cta_text ?? 'Réserver une démo',
        triggers,
        caseStudies,
        insights,
      },
      { headers: corsHeaders() }
    );
  } catch (err) {
    console.error('[api/chat/init]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500, headers: corsHeaders() });
  }
}
