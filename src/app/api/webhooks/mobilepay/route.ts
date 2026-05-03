import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { captureMobilePayPayment } from "@/lib/mobilepay";
import { sendEmail, orderConfirmationEmailHtml } from "@/lib/email";

type MobilePayCallback = {
  merchantSerialNumber: string;
  orderId: string;
  transactionInfo: {
    amount: number;
    status: string;
    timeStamp: string;
    transactionId?: string;
  };
  errorInfo?: {
    errorCode: string;
    errorMessage: string;
  };
};

export async function POST(request: Request) {
  const body = await request.json() as MobilePayCallback;

  if (!body.orderId || !body.transactionInfo) {
    return new Response("Bad request", { status: 400 });
  }

  const { orderId, transactionInfo } = body;

  // Only process RESERVE status (payment authorized but not yet captured)
  if (transactionInfo.status !== "RESERVE") {
    return new Response("OK");
  }

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    return new Response("Service unavailable", { status: 503 });
  }

  // Find order by MobilePay orderId (stored as provider_reference)
  const { data: payment } = await supabase
    .from("payments")
    .select("order_id, amount_dkk")
    .eq("provider", "mobilepay")
    .eq("provider_reference", orderId)
    .maybeSingle();

  if (!payment) {
    return new Response("Payment not found", { status: 404 });
  }

  // Capture the payment
  const amountOere = Math.round(payment.amount_dkk * 100);
  await captureMobilePayPayment(orderId, amountOere);

  // Update order and payment status
  await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", payment.order_id);

  await supabase
    .from("payments")
    .update({
      status: "paid",
      provider_reference: transactionInfo.transactionId ?? orderId
    })
    .eq("provider", "mobilepay")
    .eq("order_id", payment.order_id);

  // Send confirmation email
  const { data: order } = await supabase
    .from("orders")
    .select("customer_email, user_id, total_dkk")
    .eq("id", payment.order_id)
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
        orderId: payment.order_id,
        totalDkk: order.total_dkk,
        locale,
        accountUrl: `${siteUrl}/${locale}/account`
      })
    });
  }

  return new Response("OK");
}
