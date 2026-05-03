type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Aarhus 3D Print <noreply@aarhus3dprint.dk>";

  if (!key) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, ...payload })
  });

  return response.ok;
}

export function submissionConfirmEmailHtml(opts: {
  projectTitle: string;
  projectRef: string;
  locale: string;
  accountUrl: string;
}) {
  const isZh = opts.locale === "zh";
  const isDa = opts.locale === "da";

  const heading = isDa
    ? "Vi har modtaget dit projekt"
    : isZh
      ? "我们已收到您的项目"
      : "We have received your project";

  const intro = isDa
    ? `Tak for din indsendelse af <strong>${opts.projectTitle}</strong>. Vi gennemgår filen og sender dig et tilbud inden for 24-48 timer.`
    : isZh
      ? `感谢您提交 <strong>${opts.projectTitle}</strong>。我们将在24-48小时内审核文件并发送报价。`
      : `Thank you for submitting <strong>${opts.projectTitle}</strong>. We will review the file and send you a quote within 24-48 hours.`;

  const refLabel = isDa ? "Referencenummer" : isZh ? "参考编号" : "Reference";
  const ctaLabel = isDa ? "Se dit projekt" : isZh ? "查看您的项目" : "View your project";
  const footer = isDa
    ? "Aarhus 3D Print · Lokal 3D print i Aarhus"
    : isZh
      ? "Aarhus 3D Print · 奥胡斯本地 3D 打印"
      : "Aarhus 3D Print · Local 3D printing in Aarhus";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f7f6f1;margin:0;padding:40px 16px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;border:1px solid #d9ded8">
    <p style="font-size:0.85rem;color:#66736f;margin:0 0 24px">Aarhus 3D Print</p>
    <h1 style="font-size:1.4rem;font-weight:600;color:#17211f;margin:0 0 16px">✓ ${heading}</h1>
    <p style="color:#66736f;line-height:1.6;margin:0 0 24px">${intro}</p>
    <p style="color:#66736f;font-size:0.9rem;margin:0 0 24px"><strong>${refLabel}:</strong> #${opts.projectRef.slice(0, 8)}</p>
    <a href="${opts.accountUrl}" style="display:inline-block;background:#2f6f62;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;margin-bottom:32px">${ctaLabel}</a>
    <p style="color:#66736f;font-size:0.8rem;margin:0;border-top:1px solid #d9ded8;padding-top:20px">${footer}</p>
  </div>
</body>
</html>`;
}

export function quoteEmailHtml(opts: {
  projectTitle: string;
  amountDkk: number;
  customerNotes: string | null;
  expiresAt: string | null;
  expectedAt: string | null;
  acceptUrl: string;
  locale: string;
}) {
  const isZh = opts.locale === "zh";
  const isDa = opts.locale === "da";

  const heading = isDa
    ? "Dit tilbud er klar"
    : isZh
      ? "您的报价已就绪"
      : "Your quote is ready";

  const intro = isDa
    ? `Vi har gennemgået dit projekt <strong>${opts.projectTitle}</strong> og oprettet et tilbud.`
    : isZh
      ? `我们已审核您的项目 <strong>${opts.projectTitle}</strong> 并准备了报价。`
      : `We have reviewed your project <strong>${opts.projectTitle}</strong> and prepared a quote.`;

  const priceLabel = isDa ? "Tilbudsbeløb" : isZh ? "报价金额" : "Quote amount";
  const expiresLabel = isDa ? "Udløber" : isZh ? "有效期至" : "Expires";
  const expectedLabel = isDa ? "Forventet færdig" : isZh ? "预计完成" : "Expected completion";
  const notesLabel = isDa ? "Bemærkninger" : isZh ? "备注" : "Notes";
  const ctaLabel = isDa ? "Se og accepter tilbud" : isZh ? "查看并接受报价" : "View and accept quote";
  const footer = isDa
    ? "Aarhus 3D Print · Lokal 3D print i Aarhus"
    : isZh
      ? "Aarhus 3D Print · 奥胡斯本地 3D 打印"
      : "Aarhus 3D Print · Local 3D printing in Aarhus";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f7f6f1;margin:0;padding:40px 16px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;border:1px solid #d9ded8">
    <p style="font-size:0.85rem;color:#66736f;margin:0 0 24px">Aarhus 3D Print</p>
    <h1 style="font-size:1.4rem;font-weight:600;color:#17211f;margin:0 0 16px">${heading}</h1>
    <p style="color:#66736f;line-height:1.6;margin:0 0 24px">${intro}</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #d9ded8;color:#66736f;font-size:0.9rem">${priceLabel}</td>
        <td style="padding:10px 0;border-bottom:1px solid #d9ded8;font-weight:600;text-align:right">${opts.amountDkk} DKK</td>
      </tr>
      ${opts.expiresAt ? `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #d9ded8;color:#66736f;font-size:0.9rem">${expiresLabel}</td>
        <td style="padding:10px 0;border-bottom:1px solid #d9ded8;text-align:right">${new Date(opts.expiresAt).toLocaleDateString(opts.locale)}</td>
      </tr>` : ""}
      ${opts.expectedAt ? `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #d9ded8;color:#66736f;font-size:0.9rem">${expectedLabel}</td>
        <td style="padding:10px 0;border-bottom:1px solid #d9ded8;text-align:right">${new Date(opts.expectedAt).toLocaleDateString(opts.locale)}</td>
      </tr>` : ""}
    </table>

    ${opts.customerNotes ? `<p style="color:#66736f;font-size:0.9rem;margin:0 0 24px"><strong>${notesLabel}:</strong> ${opts.customerNotes}</p>` : ""}

    <a href="${opts.acceptUrl}" style="display:inline-block;background:#2f6f62;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;margin-bottom:32px">${ctaLabel}</a>

    <p style="color:#66736f;font-size:0.8rem;margin:0;border-top:1px solid #d9ded8;padding-top:20px">${footer}</p>
  </div>
</body>
</html>`;
}

export function orderStatusEmailHtml(opts: {
  orderId: string;
  newStatus: "in_production" | "ready" | "fulfilled";
  locale: string;
  accountUrl: string;
}) {
  const isZh = opts.locale === "zh";
  const isDa = opts.locale === "da";

  const headings = {
    in_production: isDa
      ? "Din ordre er i produktion"
      : isZh
        ? "您的订单正在生产中"
        : "Your order is in production",
    ready: isDa
      ? "Din ordre er klar"
      : isZh
        ? "您的订单已就绪"
        : "Your order is ready",
    fulfilled: isDa
      ? "Din ordre er afsendt"
      : isZh
        ? "您的订单已完成"
        : "Your order has been fulfilled"
  };

  const bodies = {
    in_production: isDa
      ? "Vi er gået i gang med at printe din ordre. Vi giver dig besked, når den er klar."
      : isZh
        ? "我们已开始打印您的订单，完成后会通知您。"
        : "We have started printing your order. We will notify you when it is ready.",
    ready: isDa
      ? "Din ordre er færdig og klar til afhentning eller afsendelse."
      : isZh
        ? "您的订单已完成，可以取货或等待发货。"
        : "Your order is complete and ready for pickup or shipment.",
    fulfilled: isDa
      ? "Din ordre er afsendt eller afhentet. Tak for din ordre."
      : isZh
        ? "您的订单已发货或已自取，感谢您的订单。"
        : "Your order has been shipped or collected. Thank you for your order."
  };

  const heading = headings[opts.newStatus];
  const body = bodies[opts.newStatus];
  const refLabel = isDa ? "Ordrenummer" : isZh ? "订单号" : "Order reference";
  const ctaLabel = isDa ? "Se ordrestatus" : isZh ? "查看订单状态" : "View order status";
  const footer = isDa
    ? "Aarhus 3D Print · Lokal 3D print i Aarhus"
    : isZh
      ? "Aarhus 3D Print · 奥胡斯本地 3D 打印"
      : "Aarhus 3D Print · Local 3D printing in Aarhus";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f7f6f1;margin:0;padding:40px 16px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;border:1px solid #d9ded8">
    <p style="font-size:0.85rem;color:#66736f;margin:0 0 24px">Aarhus 3D Print</p>
    <h1 style="font-size:1.4rem;font-weight:600;color:#17211f;margin:0 0 16px">${heading}</h1>
    <p style="color:#66736f;line-height:1.6;margin:0 0 24px">${body}</p>
    <p style="color:#66736f;font-size:0.9rem;margin:0 0 24px"><strong>${refLabel}:</strong> #${opts.orderId.slice(0, 8)}</p>
    <a href="${opts.accountUrl}" style="display:inline-block;background:#2f6f62;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;margin-bottom:32px">${ctaLabel}</a>
    <p style="color:#66736f;font-size:0.8rem;margin:0;border-top:1px solid #d9ded8;padding-top:20px">${footer}</p>
  </div>
</body>
</html>`;
}

export function orderConfirmationEmailHtml(opts: {
  orderId: string;
  totalDkk: number;
  locale: string;
  accountUrl: string;
}) {
  const isZh = opts.locale === "zh";
  const isDa = opts.locale === "da";

  const heading = isDa ? "Betaling modtaget" : isZh ? "支付成功" : "Payment received";
  const body = isDa
    ? `Vi har modtaget din betaling på <strong>${opts.totalDkk} DKK</strong>. Ordren er nu sendt til produktion.`
    : isZh
      ? `我们已收到您 <strong>${opts.totalDkk} DKK</strong> 的付款。订单已进入生产流程。`
      : `We have received your payment of <strong>${opts.totalDkk} DKK</strong>. Your order has been sent to production.`;
  const refLabel = isDa ? "Ordrenummer" : isZh ? "订单号" : "Order reference";
  const ctaLabel = isDa ? "Se ordrestatus" : isZh ? "查看订单状态" : "View order status";
  const footer = isDa
    ? "Aarhus 3D Print · Lokal 3D print i Aarhus"
    : isZh
      ? "Aarhus 3D Print · 奥胡斯本地 3D 打印"
      : "Aarhus 3D Print · Local 3D printing in Aarhus";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f7f6f1;margin:0;padding:40px 16px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:40px;border:1px solid #d9ded8">
    <p style="font-size:0.85rem;color:#66736f;margin:0 0 24px">Aarhus 3D Print</p>
    <h1 style="font-size:1.4rem;font-weight:600;color:#17211f;margin:0 0 16px">✓ ${heading}</h1>
    <p style="color:#66736f;line-height:1.6;margin:0 0 24px">${body}</p>
    <p style="color:#66736f;font-size:0.9rem;margin:0 0 24px"><strong>${refLabel}:</strong> #${opts.orderId.slice(0, 8)}</p>
    <a href="${opts.accountUrl}" style="display:inline-block;background:#2f6f62;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;margin-bottom:32px">${ctaLabel}</a>
    <p style="color:#66736f;font-size:0.8rem;margin:0;border-top:1px solid #d9ded8;padding-top:20px">${footer}</p>
  </div>
</body>
</html>`;
}
