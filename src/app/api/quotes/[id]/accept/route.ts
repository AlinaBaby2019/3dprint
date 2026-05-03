import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

function mapDeliveryMethod(method: string | null): { method: string; status: "not_required" } {
  if (method === "Local delivery") return { method: "local_delivery", status: "not_required" };
  if (method === "Shipping") return { method: "shipping", status: "not_required" };
  return { method: "pickup_aarhus", status: "not_required" };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quoteId } = await params;

  let addressId: string | null = null;
  try {
    const body = await request.json() as { address_id?: string };
    addressId = body.address_id ?? null;
  } catch {
    // body is optional
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

  // RLS ensures user can only read quotes on their own projects
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("id, project_id, amount_dkk, currency, expected_completion_at")
    .eq("id", quoteId)
    .eq("status", "sent")
    .single();

  if (quoteError || !quote) {
    return NextResponse.json({ error: "Quote not found or already processed" }, { status: 404 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id, title, delivery_method")
    .eq("id", quote.project_id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { error: quoteUpdateError } = await supabase
    .from("quotes")
    .update({ status: "accepted" })
    .eq("id", quoteId);

  if (quoteUpdateError) {
    return NextResponse.json({ error: quoteUpdateError.message }, { status: 500 });
  }

  await supabase
    .from("projects")
    .update({ status: "approved" })
    .eq("id", project.id);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: project.user_id,
      project_id: project.id,
      quote_id: quoteId,
      status: "pending_payment",
      total_dkk: quote.amount_dkk,
      currency: quote.currency,
      customer_email: userData.user.email
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }

  await supabase.from("order_items").insert({
    order_id: order.id,
    item_type: "quote",
    title: project.title ?? "3D Print Project",
    quantity: 1,
    unit_price_dkk: quote.amount_dkk
  });

  const delivery = mapDeliveryMethod(project.delivery_method);
  await supabase.from("deliveries").insert({
    order_id: order.id,
    method: delivery.method,
    status: delivery.status,
    address_id: addressId
  });

  return NextResponse.json({ orderId: order.id });
}
