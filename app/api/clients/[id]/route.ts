import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const supabase = createServiceRoleClient();
  const {
    name,
    website_url,
    contact_email,
    is_active,
    agent_name,
    agent_greeting,
    business_description,
    business_offers,
    icp,
    disqualify_criteria,
    qualification_questions,
    rdv_link,
    cta_text,
    cta_url,
    notification_email,
    widget_color,
    widget_position,
    triggers,
  } = body;

  const { error } = await supabase
    .from("clients")
    .update({
      ...(name != null && { name }),
      ...(website_url != null && { website_url }),
      ...(contact_email != null && { contact_email }),
      ...(is_active != null && { is_active }),
      ...(agent_name != null && { agent_name }),
      ...(agent_greeting != null && { agent_greeting }),
      ...(business_description != null && { business_description }),
      ...(business_offers != null && { business_offers }),
      ...(icp != null && { icp }),
      ...(disqualify_criteria != null && { disqualify_criteria }),
      ...(qualification_questions != null && { qualification_questions }),
      ...(rdv_link != null && { rdv_link }),
      ...(cta_text != null && { cta_text }),
      ...(cta_url != null && { cta_url }),
      ...(notification_email != null && { notification_email }),
      ...(widget_color != null && { widget_color }),
      ...(widget_position != null && { widget_position }),
      ...(triggers != null && { triggers }),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
