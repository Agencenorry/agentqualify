"use server";

import { createServiceRoleClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createClientAction(formData: { name: string; website_url?: string; contact_email?: string }) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: formData.name,
      website_url: formData.website_url || null,
      contact_email: formData.contact_email || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  return { id: data.id };
}
