import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://hfqchhkbkhfchmawqefe.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_PXtV-P2F8n_P1iFqlM_MEA_SMGt8cHr"

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key missing in environment variables.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
