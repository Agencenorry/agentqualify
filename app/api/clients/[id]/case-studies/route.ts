import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import type { CaseStudy } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data as CaseStudy[]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const body = await request.json();
  const {
    sector,
    sector_keywords,
    company_name,
    result,
    description,
    logo_url,
    case_url,
    is_active,
  } = body;

  if (!sector || !company_name || !result) {
    return NextResponse.json(
      { error: "sector, company_name et result requis" },
      { status: 400 }
    );
  }

  const keywords = Array.isArray(sector_keywords)
    ? sector_keywords
    : typeof sector_keywords === "string"
      ? sector_keywords.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("case_studies")
    .insert({
      client_id: clientId,
      sector: String(sector).trim(),
      sector_keywords: keywords,
      company_name: String(company_name).trim(),
      result: String(result).trim(),
      description: description != null ? String(description).trim() || null : null,
      logo_url: logo_url != null ? String(logo_url).trim() || null : null,
      case_url: case_url != null ? String(case_url).trim() || null : null,
      is_active: is_active !== false,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data as CaseStudy);
}
