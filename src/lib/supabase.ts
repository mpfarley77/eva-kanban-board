import { createClient } from "@supabase/supabase-js";

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.SUPABASE_ANON_KEY;
  const key = serviceRole || anon;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set");
  }

  return createClient(url, key);
}

export type TaskRow = {
  id: string;
  title: string;
  objective: "skyworks" | "personal" | "side_hustles";
  status: "backlog" | "in_progress" | "review" | "completed";
  created_at: string;
  updated_at: string;
};
