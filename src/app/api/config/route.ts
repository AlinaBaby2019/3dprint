import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabaseClient();
  let databaseReachable = false;

  if (supabase) {
    const { error } = await supabase.from("material_options").select("id").limit(1);
    databaseReachable = !error;
  }

  return NextResponse.json({
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    databaseReachable,
    storageBucket: "project-files"
  });
}
