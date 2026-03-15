/**
 * Clients Supabase : navigateur (auth) et serveur (service role pour API)
 */
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Client pour le navigateur (auth utilisateur Norry) — à utiliser dans les composants client */
export function createClient(): SupabaseClient {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

/** Client service role (côté serveur uniquement, bypass RLS) — pour API routes et accès admin */
export function createServiceRoleClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant');
  return createSupabaseClient(supabaseUrl, key);
}
