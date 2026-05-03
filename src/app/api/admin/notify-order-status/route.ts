import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { sendEmail, orderStatusEmailHtml } from "@/lib/email";

const NOTIFY_STATUSES = new Set(["in_production", "ready", "fulfilled"]);

export async function POST(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { orderId: string; newStatus: string };
  const { orderId, newStatus } = body;

  if (!orderId || !NOTIFY_STATUSES.has(newStatus)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!adminProfile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_email, user_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.customer_email) {
    return NextResponse.json({ error: "Order or customer email not found" }, { status: 404 });
  }

  const { data: profile } = order.user_id
    ? await supabase
        .from("profiles")
        .select("preferred_locale")
        .eq("id", order.user_id)
        .maybeSingle()
    : { data: null };

  const locale = profile?.preferred_locale ?? "en";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const subjects: Record<string, Record<string, string>> = {
    in_production: {
      da: "Din ordre er nu i produktion – Aarhus 3D Print",
      en: "Your order is in production – Aarhus 3D Print",
      zh: "您的订单正在生产中 – Aarhus 3D Print"
    },
    ready: {
      da: "Din ordre er klar – Aarhus 3D Print",
      en: "Your order is ready – Aarhus 3D Print",
      zh: "您的订单已就绪 – Aarhus 3D Print"
    },
    fulfilled: {
      da: "Din ordre er afsendt – Aarhus 3D Print",
      en: "Your order has been fulfilled – Aarhus 3D Print",
      zh: "您的订单已完成 – Aarhus 3D Print"
    }
  };

  const subject = subjects[newStatus]?.[locale] ?? subjects[newStatus]?.["en"] ?? "";

  await sendEmail({
    to: order.customer_email,
    subject,
    html: orderStatusEmailHtml({
      orderId: order.id,
      newStatus: newStatus as "in_production" | "ready" | "fulfilled",
      locale,
      accountUrl: `${siteUrl}/${locale}/account`
    })
  });

  return NextResponse.json({ ok: true });
}
