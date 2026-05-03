import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { sendEmail, orderConfirmationEmailHtml } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      return new Response("OK");
    }

    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return new Response("Service unavailable", { status: 503 });
    }

    await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId);

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? session.id);

    const amountDkk = Math.round((session.amount_total ?? 0) / 100);

    await supabase.from("payments").insert({
      order_id: orderId,
      provider: "stripe",
      provider_reference: paymentIntentId,
      status: "paid",
      amount_dkk: amountDkk,
      currency: "DKK"
    });

    // Send order confirmation email
    const { data: order } = await supabase
      .from("orders")
      .select("customer_email, user_id")
      .eq("id", orderId)
      .maybeSingle();

    if (order?.customer_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_locale")
        .eq("id", order.user_id ?? "")
        .maybeSingle();

      const locale = profile?.preferred_locale ?? "en";
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const isDa = locale === "da";
      const isZh = locale === "zh";
      const subject = isDa
        ? "Betaling modtaget – Aarhus 3D Print"
        : isZh
          ? "支付成功 – Aarhus 3D Print"
          : "Payment confirmed – Aarhus 3D Print";

      await sendEmail({
        to: order.customer_email,
        subject,
        html: orderConfirmationEmailHtml({
          orderId,
          totalDkk: amountDkk,
          locale,
          accountUrl: `${siteUrl}/${locale}/account`
        })
      });
    }
  }

  return new Response("OK");
}
