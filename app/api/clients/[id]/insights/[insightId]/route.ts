import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import type { Insight } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; insightId: string }> }
) {
  const { id: clientId, insightId } = await params;
  const body = await request.json();
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("insights")
    .select("id")
    .eq("id", insightId)
    .eq("client_id", clientId)
    .single();
  if (!existing) return NextResponse.json({ error: "Insight introuvable" }, { status: 404 });

  const challenge_keywords = body.challenge_keywords != null
    ? (Array.isArray(body.challenge_keywords)
        ? body.challenge_keywords
        : String(body.challenge_keywords).split(",").map((s: string) => s.trim()).filter(Boolean))
    : undefined;

  const update: Record<string, unknown> = {};
  if (challenge_keywords != null) update.challenge_keywords = challenge_keywords;
  if (body.stat != null) update.stat = String(body.stat).trim();
  if (body.context != null) update.context = String(body.context).trim();
  if (body.source !== undefined) update.source = body.source ? String(body.source).trim() : null;
  if (body.is_active !== undefined) update.is_active = Boolean(body.is_active);

  const { data, error } = await supabase
    .from("insights")
    .update(update)
    .eq("id", insightId)
    .eq("client_id", clientId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data as Insight);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; insightId: string }> }
) {
  const { id: clientId, insightId } = await params;
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("insights")
    .delete()
    .eq("id", insightId)
    .eq("client_id", clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
