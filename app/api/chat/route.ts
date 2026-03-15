/**
 * Route POST sécurisée : proxy vers Claude + qualification + persistance
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic';
import type { Client, Lead, ChatMessage, CaseStudy, Insight, ContextCard } from '@/lib/types';

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
const SHOW_CASE_REGEX = /\[SHOW_CASE:\s*([^\]]+)\]/;
const SHOW_INSIGHT_REGEX = /\[SHOW_INSIGHT:\s*([^\]]+)\]/;

function buildSystemPrompt(client: Client, caseStudies: CaseStudy[], insights: Insight[]): string {
  const name = client.agent_name || 'Alex';
  const greeting = client.agent_greeting ? `Message d'accueil : ${client.agent_greeting}\n\n` : '';
  const questions = Array.isArray(client.qualification_questions)
    ? client.qualification_questions.join('\n')
    : (client.qualification_questions as unknown as string[])?.join?.('\n') ?? '';

  const caseStudiesBlock =
    caseStudies.length > 0
      ? `RÉALISATIONS DISPONIBLES (à mentionner naturellement quand le secteur correspond) :\n${caseStudies.map((cs) => `- Secteur "${cs.sector}" (mots-clés: ${(cs.sector_keywords || []).join(', ')}) : ${cs.company_name} → ${cs.result}`).join('\n')}`
      : '';
  const insightsBlock =
    insights.length > 0
      ? `INSIGHTS DISPONIBLES (à mentionner quand le défi correspond) :\n${insights.map((i) => `- Défi keywords: ${(i.challenge_keywords || []).join(', ')} → Stat: "${i.stat}" (${i.context})`).join('\n')}`
      : '';

  const injectionRules =
    caseStudies.length > 0 || insights.length > 0
      ? `
RÈGLES D'INJECTION CONTEXTUELLE :
1. Quand le prospect mentionne son secteur et qu'une réalisation correspond, intègre naturellement dans ta réponse suivante : "D'ailleurs, on a récemment accompagné [company_name] — [result]. Ça pourrait vous parler." Puis termine ta réponse par le marqueur : [SHOW_CASE: id_de_la_realisation]
2. Quand le prospect mentionne un défi et qu'un insight correspond, intègre dans ta réponse : "[context] — [stat]." Puis termine par le marqueur : [SHOW_INSIGHT: id_de_l_insight]
3. Maximum 1 réalisation et 1 insight par conversation.
4. L'injection doit sembler naturelle, pas forcée.
5. Ne montre jamais les deux dans le même message.
`
      : '';

  return `Tu es ${name}, un agent IA de qualification de prospects pour ${client.name}.

${greeting}ACTIVITÉ : ${client.business_description || 'Non précisé'}
OFFRES : ${client.business_offers || 'Non précisé'}
PROFIL CLIENT IDÉAL : ${client.icp || 'Non précisé'}
DISQUALIFIANTS : ${client.disqualify_criteria || 'Aucun'}

QUESTIONS DE QUALIFICATION (une par message, naturellement) :
${questions}

RÈGLE ABSOLUE : La toute première question doit TOUJOURS être "Quel est votre prénom ?" avant toute autre question de qualification.
Utilise ensuite ce prénom dans toutes tes réponses suivantes.

Quand tu génères le token [QUALIFY:...], le format est :
[QUALIFY: prénom|email|société|rôle|taille équipe|défi principal|budget|score]
Assure-toi de collecter l'email naturellement pendant la conversation en disant par exemple "Pour vous envoyer les informations, quel est votre email ?"
score = 0-100 selon correspondance ICP.

${caseStudiesBlock}
${insightsBlock}
${injectionRules}

RÈGLES :
1. Objectif unique : qualifier le prospect. Réponses courtes (2-3 phrases max).
2. Pose les questions une à la fois, naturellement.
3. Si score >= 70, propose un RDV : ${client.cta_url || client.rdv_link || 'lien non configuré'}
4. Ne révèle pas que tu es une IA sauf si demandé.`;
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

function parseContextCard(content: string, caseStudies: CaseStudy[], insights: Insight[]): { cleanedContent: string; contextCard?: ContextCard } {
  const caseMatch = content.match(SHOW_CASE_REGEX);
  const insightMatch = content.match(SHOW_INSIGHT_REGEX);
  const caseIndex = caseMatch ? content.indexOf(caseMatch[0]) : -1;
  const insightIndex = insightMatch ? content.indexOf(insightMatch[0]) : -1;

  let cleanedContent = content;
  let contextCard: ContextCard | undefined;

  if (caseIndex >= 0 && (insightIndex < 0 || caseIndex <= insightIndex)) {
    const id = caseMatch![1].trim();
    const cs = caseStudies.find((c) => c.id === id);
    if (cs) {
      contextCard = {
        type: 'case_study',
        companyName: cs.company_name,
        result: cs.result,
        description: cs.description ?? undefined,
        logoUrl: cs.logo_url ?? undefined,
        caseUrl: cs.case_url ?? undefined,
      };
      cleanedContent = content.replace(SHOW_CASE_REGEX, '').replace(/\s*\n\s*\n/g, '\n\n').trim();
    }
  } else if (insightIndex >= 0) {
    const id = insightMatch![1].trim();
    const ins = insights.find((i) => i.id === id);
    if (ins) {
      contextCard = {
        type: 'insight',
        stat: ins.stat,
        context: ins.context,
        source: ins.source ?? undefined,
      };
      cleanedContent = content.replace(SHOW_INSIGHT_REGEX, '').replace(/\s*\n\s*\n/g, '\n\n').trim();
    }
  }

  return { cleanedContent, contextCard };
}

type EnrichedLead = { summary: string; recommendations: string[] };

async function generateEnrichedSummary(
  qualifyData: { name: string; email: string; company: string; role: string; team_size: string; challenge: string; budget: string; score: number },
  anthropic: ReturnType<typeof getAnthropicClient>
): Promise<EnrichedLead | null> {
  const prompt = `À partir de ces informations prospect :
Prénom: ${qualifyData.name}
Société: ${qualifyData.company}
Rôle: ${qualifyData.role}
Taille équipe: ${qualifyData.team_size}
Défi principal: ${qualifyData.challenge}
Budget: ${qualifyData.budget}
Score: ${qualifyData.score}/100

Génère un objet JSON avec :
{
  "summary": "Résumé contextualisé en 2-3 phrases qui explique le profil, le contexte métier et pourquoi ce prospect est intéressant",
  "recommendations": [
    "Conseil 1 pour préparer le RDV (ex: angle d'approche)",
    "Conseil 2 (ex: objection probable à anticiper)",
    "Conseil 3 (ex: offre à mettre en avant)"
  ]
}
Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    const raw = textBlock && 'text' in textBlock ? textBlock.text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as { summary?: string; recommendations?: string[] };
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, messages, conversationId: existingConvId, caseStudies: bodyCaseStudies, insights: bodyInsights } = body as {
      clientId?: string;
      messages?: ChatMessage[];
      conversationId?: string | null;
      caseStudies?: CaseStudy[];
      insights?: Insight[];
    };
    const caseStudies = Array.isArray(bodyCaseStudies) ? bodyCaseStudies : [];
    const insights = Array.isArray(bodyInsights) ? bodyInsights : [];

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

    const systemPrompt = buildSystemPrompt(client as Client, caseStudies, insights);
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
    const rawContent = textBlock && 'text' in textBlock ? textBlock.text : '';
    const { cleanedContent: content, contextCard } = parseContextCard(rawContent, caseStudies, insights);

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
            const fallbackSummary = `${qualifyData.name} - ${qualifyData.company} - Score ${qualifyData.score}`;
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
                summary: fallbackSummary,
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

      // Résumé enrichi + recommandations (second appel Claude)
      if (lead) {
        const enriched = await generateEnrichedSummary(qualifyData, anthropic);
        if (enriched) {
          await supabase
            .from('leads')
            .update({
              summary: enriched.summary,
              recommendations: enriched.recommendations,
            })
            .eq('id', lead.id);
          lead = { ...lead, summary: enriched.summary, recommendations: enriched.recommendations };
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
        ...(contextCard && { contextCard }),
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
