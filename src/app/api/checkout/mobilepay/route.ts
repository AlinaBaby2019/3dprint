import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createMobilePayPayment, isMobilePayConfigured } from "@/lib/mobilepay";

export async function POST(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMobilePayConfigured()) {
    return NextResponse.json({ error: "MobilePay not configured" }, { status: 503 });
  }

  const body = await request.json() as { orderId: string; locale: string };
  const { orderId, locale } = body;
  if (!orderId || !locale) {
    return NextResponse.json({ error: "Missing orderId or locale" }, { status: 400 });
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

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, total_dkk")
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const amountOere = Math.round(order.total_dkk * 100);

  const payment = await createMobilePayPayment({
    orderId: order.id,
    amountOere,
    description: "Aarhus 3D Print",
    callbackPrefix: `${siteUrl}/api/webhooks/mobilepay`,
    fallbackUrl: `${siteUrl}/${locale}/checkout/success?order_id=${order.id}`
  });

  // Store MobilePay reference in payments table
  await supabase.from("payments").insert({
    order_id: order.id,
    provider: "mobilepay",
    provider_reference: payment.orderId,
    amount_dkk: order.total_dkk,
    currency: "DKK",
    status: "pending"
  });

  return NextResponse.json({ url: payment.url });
}
