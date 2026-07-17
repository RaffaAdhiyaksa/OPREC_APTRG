/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabaseClient] VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diisi di .env.local. " +
    "Login Supabase tidak akan berfungsi sampai env variable dikonfigurasi."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);