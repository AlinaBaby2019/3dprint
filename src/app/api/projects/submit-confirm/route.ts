import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { sendEmail, submissionConfirmEmailHtml } from "@/lib/email";

export async function POST(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { projectId: string };
  const { projectId } = body;
  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
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

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_locale")
    .eq("id", user.id)
    .maybeSingle();

  const locale = profile?.preferred_locale ?? "en";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const isDa = locale === "da";
  const isZh = locale === "zh";
  const subject = isDa
    ? "Vi har modtaget dit projekt"
    : isZh
      ? "我们已收到您的项目"
      : "We have received your project";

  await sendEmail({
    to: user.email,
    subject,
    html: submissionConfirmEmailHtml({
      projectTitle: project.title ?? "3D Print Project",
      projectRef: project.id,
      locale,
      accountUrl: `${siteUrl}/${locale}/account`
    })
  });

  return NextResponse.json({ ok: true });
}
