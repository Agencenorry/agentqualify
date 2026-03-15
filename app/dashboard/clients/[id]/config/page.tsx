import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase";
import { ConfigClient } from "./config-client";
import type { Client } from "@/lib/types";

async function getClient(id: string): Promise<Client | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as Client;
}

export default async function ClientConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return <ConfigClient client={client} />;
}
