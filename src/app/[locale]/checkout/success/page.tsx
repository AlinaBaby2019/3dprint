import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
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
      <div className="shell">
        <header className="topbar">
          <Link className="brand" href={`/${locale}`}>
            <span className="brand-mark">3D</span>
            <span>Aarhus 3D Print</span>
          </Link>
          <nav className="nav" aria-label="Primary">
            <Link href={`/${locale}`}>{t.nav.print}</Link>
            <AccountNav label={t.nav.account} locale={locale} />
          </nav>
        </header>

        <section className="section" style={{ textAlign: "center", paddingTop: "80px" }}>
          <CheckCircle2 size={52} style={{ color: "var(--accent)", marginBottom: "24px" }} />
          <h1>{t.checkout.successTitle}</h1>
          <p style={{ color: "var(--muted)", maxWidth: "480px", margin: "0 auto 32px" }}>
            {t.checkout.successBody}
          </p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <Link className="button primary" href={`/${locale}#orders` as Route}>
              {t.checkout.viewOrders}
            </Link>
            <Link className="button secondary" href={`/${locale}` as Route}>
              {t.checkout.backHome}
            </Link>
          </div>
        </section>

        <footer className="footer">{t.footer}</footer>
      </div>
    </main>
  );
}
