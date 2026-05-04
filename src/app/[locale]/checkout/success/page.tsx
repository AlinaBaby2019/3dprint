import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export const metadata: Metadata = {
  title: "Order confirmed – Aarhus 3D Print",
  robots: { index: false, follow: false }
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function CheckoutSuccessPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const t = getDictionary(locale);

  return (
    <main className="page">
      <SiteHeader locale={locale} />

      <section className="tile">
        <div className="tile-inner">
          <div className="tile-head tile-head--center">
            <CheckCircle2 className="checkout-success-icon" size={56} />
            <h1 className="t-display-lg">{t.checkout.successTitle}</h1>
            <p className="t-lead-airy">{t.checkout.successBody}</p>
          </div>
          <div className="actions" style={{ justifyContent: "center" }}>
            <Link className="btn btn--primary" href={`/${locale}#orders` as Route}>
              {t.checkout.viewOrders}
            </Link>
            <Link className="btn btn--secondary" href={`/${locale}` as Route}>
              {t.checkout.backHome}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
