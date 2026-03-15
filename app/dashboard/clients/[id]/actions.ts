"use server";

import { createServiceRoleClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function markRdvBookedAction(leadId: string) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("leads").select("client_id").eq("id", leadId).single();
  await supabase.from("leads").update({ rdv_booked: true }).eq("id", leadId);
  if (data?.client_id) revalidatePath(`/dashboard/clients/${data.client_id}`);
  revalidatePath("/dashboard");
}
