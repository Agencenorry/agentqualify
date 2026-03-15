/**
 * Route POST sécurisée : proxy vers Claude + qualification + persistance
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic';
import type { Client, Lead, ChatMessage } from '@/lib/types';

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

const QUALIFY_REGEX = /\[QUALIFY:\s*([^\]]+)\]/;

function buildSystemPrompt(client: Client): string {
  const name = client.agent_name || 'Alex';
  const greeting = client.agent_greeting ? `Message d'accueil : ${client.agent_greeting}\n\n` : '';
  const questions = Array.isArray(client.qualification_questions)
    ? client.qualification_questions.join('\n')
    : (client.qualification_questions as unknown as string[])?.join?.('\n') ?? '';

  return `Tu es ${name}, un agent IA de qualification de prospects pour ${client.name}.

${greeting}ACTIVITÉ : ${client.business_description || 'Non précisé'}
OFFRES : ${client.business_offers || 'Non précisé'}
PROFIL CLIENT IDÉAL : ${client.icp || 'Non précisé'}
DISQUALIFIANTS : ${client.disqualify_criteria || 'Aucun'}

QUESTIONS DE QUALIFICATION (une par message, naturellement) :
${questions}

RÈGLES :
1. Objectif unique : qualifier le prospect. Réponses courtes (2-3 phrases max).
2. Pose les questions une à la fois, naturellement.
3. Quand tu as au moins 3 réponses, termine avec :
   [QUALIFY: nom|email|société|rôle|taille|défi|budget|score]
   score = 0-100 selon correspondance ICP
4. Si score >= 70, propose un RDV : ${client.rdv_link || 'lien non configuré'}
5. Ne révèle pas que tu es une IA sauf si demandé.`;
}

function parseQualifyPayload(text: string): { name: string; email: string; company: string; role: string; team_size: string; challenge: string; budget: string; score: number } | null {
  const match = text.match(QUALIFY_REGEX);
  if (!match) return null;
  const parts = match[1].split('|').map((p) => p.trim());
  if (parts.length < 8) return null;
  const score = parseInt(parts[7], 10);
  if (Number.isNaN(score)) return null;
  return {
    name: parts[0] || '',
    email: parts[1] || '',
    company: parts[2] || '',
    role: parts[3] || '',
    team_size: parts[4] || '',
    challenge: parts[5] || '',
    budget: parts[6] || '',
    score: Math.min(100, Math.max(0, score)),
  };
}

function statusFromScore(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, messages, conversationId: existingConvId } = body as {
      clientId?: string;
      messages?: ChatMessage[];
      conversationId?: string | null;
    };

    if (!clientId || !messages?.length) {
      return NextResponse.json(
        { error: 'clientId et messages requis' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const supabase = createServiceRoleClient();
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('is_active', true)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client introuvable ou inactif' },
        { status: 404, headers: corsHeaders() }
      );
    }

    const systemPrompt = buildSystemPrompt(client as Client);
    const anthropic = getAnthropicClient();

    const apiMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const content = textBlock && 'text' in textBlock ? textBlock.text : '';

    // Détection du token [QUALIFY: ...]
    const qualifyData = parseQualifyPayload(content);
    let lead: Lead | undefined;
    let conversationId = existingConvId;

    if (qualifyData) {
      const newMessages = [
        ...messages,
        { role: 'assistant' as const, content },
      ];

      if (existingConvId) {
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', existingConvId)
          .single();

        if (existingConv) {
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('conversation_id', existingConvId)
            .single();

          if (existingLead) {
            await supabase
              .from('leads')
              .update({
                name: qualifyData.name || null,
                email: qualifyData.email || null,
                company: qualifyData.company || null,
                role: qualifyData.role || null,
                team_size: qualifyData.team_size || null,
                main_challenge: qualifyData.challenge || null,
                budget: qualifyData.budget || null,
                score: qualifyData.score,
                status: statusFromScore(qualifyData.score),
                summary: `${qualifyData.name} - ${qualifyData.company} - Score ${qualifyData.score}`,
                rdv_proposed: qualifyData.score >= 70,
              })
              .eq('id', existingLead.id);
            const { data: updated } = await supabase
              .from('leads')
              .select('*')
              .eq('id', existingLead.id)
              .single();
            lead = updated as Lead;
          }
          await supabase
            .from('conversations')
            .update({
              messages: newMessages,
              is_qualified: true,
              lead_id: lead?.id ?? undefined,
            })
            .eq('id', existingConvId);
        }
      }

      if (!lead) {
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            client_id: clientId,
            name: qualifyData.name || null,
            email: qualifyData.email || null,
            company: qualifyData.company || null,
            role: qualifyData.role || null,
            team_size: qualifyData.team_size || null,
            main_challenge: qualifyData.challenge || null,
            budget: qualifyData.budget || null,
            score: qualifyData.score,
            status: statusFromScore(qualifyData.score),
            summary: `${qualifyData.name} - ${qualifyData.company} - Score ${qualifyData.score}`,
            rdv_proposed: qualifyData.score >= 70,
          })
          .select('*')
          .single();

        if (!leadError && newLead) {
          lead = newLead as Lead;
          const newMessagesConv = [...messages, { role: 'assistant' as const, content }];
          if (existingConvId) {
            await supabase
              .from('conversations')
              .update({
                lead_id: newLead.id,
                messages: newMessagesConv,
                is_qualified: true,
              })
              .eq('id', existingConvId);
            await supabase.from('leads').update({ conversation_id: existingConvId }).eq('id', newLead.id);
            conversationId = existingConvId;
          } else {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                client_id: clientId,
                lead_id: newLead.id,
                messages: newMessagesConv,
                is_qualified: true,
              })
              .select('id')
              .single();
            if (newConv) {
              conversationId = newConv.id;
              await supabase.from('leads').update({ conversation_id: newConv.id }).eq('id', newLead.id);
            }
          }
        }
      }
    } else {
      // Pas de qualification : sauvegarder la conversation quand même
      const newMessages = [...messages, { role: 'assistant' as const, content }];
      if (existingConvId) {
        await supabase
          .from('conversations')
          .update({ messages: newMessages })
          .eq('id', existingConvId);
        conversationId = existingConvId;
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            client_id: clientId,
            messages: newMessages,
          })
          .select('id')
          .single();
        if (newConv) conversationId = newConv.id;
      }
    }

    return NextResponse.json(
      {
        content,
        qualified: Boolean(qualifyData),
        lead: lead ?? undefined,
        conversationId: conversationId ?? undefined,
      },
      { headers: corsHeaders() }
    );
  } catch (err) {
    console.error('[api/chat]', err);
    return NextResponse.json(
      { error: 'Erreur lors de l\'appel à l\'assistant' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
