import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    storageBucket: "project-files"
  });
}
