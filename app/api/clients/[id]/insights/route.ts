import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import type { Insight } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("insights")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data as Insight[]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const body = await request.json();
  const { challenge_keywords, stat, context, source, is_active } = body;

  if (!stat || !context) {
    return NextResponse.json(
      { error: "stat et context requis" },
      { status: 400 }
    );
  }

  const keywords = Array.isArray(challenge_keywords)
    ? challenge_keywords
    : typeof challenge_keywords === "string"
      ? challenge_keywords.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("insights")
    .insert({
      client_id: clientId,
      challenge_keywords: keywords.length ? keywords : [],
      stat: String(stat).trim(),
      context: String(context).trim(),
      source: source != null ? String(source).trim() || null : null,
      is_active: is_active !== false,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data as Insight);
}
