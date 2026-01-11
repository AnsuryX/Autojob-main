import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || 'https://mkwuyxigbnyrkcwvfgjq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || 'sb_publishable_VDrYtNeRIrz1NMp87QAWXA_2LzlC2o-';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase credentials missing from environment.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
