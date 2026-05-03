import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
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
    .select("id, total_dkk, currency, order_items(id, title, quantity, unit_price_dkk)")
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    currency: "dkk",
    line_items: order.order_items.map((item) => ({
      price_data: {
        currency: "dkk",
        product_data: { name: item.title },
        unit_amount: item.unit_price_dkk * 100
      },
      quantity: item.quantity
    })),
    metadata: { order_id: orderId },
    success_url: `${siteUrl}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/${locale}#products`
  });

  if (!session.url) {
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
