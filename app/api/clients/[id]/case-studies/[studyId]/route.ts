import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import type { CaseStudy } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; studyId: string }> }
) {
  const { id: clientId, studyId } = await params;
  const body = await request.json();
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("case_studies")
    .select("id")
    .eq("id", studyId)
    .eq("client_id", clientId)
    .single();
  if (!existing) return NextResponse.json({ error: "Réalisation introuvable" }, { status: 404 });

  const sector_keywords = body.sector_keywords != null
    ? (Array.isArray(body.sector_keywords)
        ? body.sector_keywords
        : String(body.sector_keywords).split(",").map((s: string) => s.trim()).filter(Boolean))
    : undefined;

  const update: Record<string, unknown> = {};
  if (body.sector != null) update.sector = String(body.sector).trim();
  if (sector_keywords != null) update.sector_keywords = sector_keywords;
  if (body.company_name != null) update.company_name = String(body.company_name).trim();
  if (body.result != null) update.result = String(body.result).trim();
  if (body.description !== undefined) update.description = body.description ? String(body.description).trim() : null;
  if (body.logo_url !== undefined) update.logo_url = body.logo_url ? String(body.logo_url).trim() : null;
  if (body.case_url !== undefined) update.case_url = body.case_url ? String(body.case_url).trim() : null;
  if (body.is_active !== undefined) update.is_active = Boolean(body.is_active);

  const { data, error } = await supabase
    .from("case_studies")
    .update(update)
    .eq("id", studyId)
    .eq("client_id", clientId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data as CaseStudy);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; studyId: string }> }
) {
  const { id: clientId, studyId } = await params;
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("case_studies")
    .delete()
    .eq("id", studyId)
    .eq("client_id", clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
