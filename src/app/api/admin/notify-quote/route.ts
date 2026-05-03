import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { sendEmail, quoteEmailHtml } from "@/lib/email";

export async function POST(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { quoteId: string; locale: string };
  const { quoteId, locale } = body;

  if (!quoteId) {
    return NextResponse.json({ error: "Missing quoteId" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const supabase = createClient<Database>(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false }
  });

  // Verify caller is admin
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, amount_dkk, currency, customer_notes, expires_at, expected_completion_at, project_id")
    .eq("id", quoteId)
    .single();

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, user_id")
    .eq("id", quote.project_id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: recipientProfile } = project.user_id
    ? await supabase
        .from("profiles")
        .select("preferred_locale")
        .eq("id", project.user_id)
        .maybeSingle()
    : { data: null };

  // Get customer email from auth.users via service role is not available here,
  // so we look it up from the orders or profiles table
  // For now, we get it from the user's latest order or rely on the customer_email field
  const { data: orderWithEmail } = await supabase
    .from("orders")
    .select("customer_email")
    .eq("project_id", project.id)
    .not("customer_email", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const customerEmail = orderWithEmail?.customer_email;
  if (!customerEmail) {
    return NextResponse.json({ error: "Customer email not found" }, { status: 422 });
  }

  const emailLocale = recipientProfile?.preferred_locale ?? locale ?? "en";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const acceptUrl = `${siteUrl}/${emailLocale}/account`;

  const isDa = emailLocale === "da";
  const isZh = emailLocale === "zh";
  const subject = isDa
    ? "Dit 3D print tilbud er klar"
    : isZh
      ? "您的 3D 打印报价已就绪"
      : "Your 3D print quote is ready";

  await sendEmail({
    to: customerEmail,
    subject,
    html: quoteEmailHtml({
      projectTitle: project.title ?? "3D Print Project",
      amountDkk: quote.amount_dkk,
      customerNotes: quote.customer_notes,
      expiresAt: quote.expires_at,
      expectedAt: quote.expected_completion_at,
      acceptUrl,
      locale: emailLocale
    })
  });

  return NextResponse.json({ ok: true });
}
