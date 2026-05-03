import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { AdminPanel } from "@/components/admin-panel";
import { AdminOrders } from "@/components/admin-orders";
import { AdminMaterials } from "@/components/admin-materials";
import { AdminProducts } from "@/components/admin-products";
import { AdminPayments } from "@/components/admin-payments";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: "Admin – Aarhus 3D Print",
  robots: { index: false, follow: false }
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AdminPage({ params }: PageProps) {
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

        <AdminPanel copy={t.admin} locale={locale} />
        <AdminOrders copy={t.admin} locale={locale} />
        <AdminMaterials copy={{ ...t.admin, saved: t.admin.messageSaved, error: t.admin.messageError }} />
        <AdminProducts copy={{ ...t.admin, saved: t.admin.messageSaved, error: t.admin.messageError }} />
        <AdminPayments copy={t.admin} />
      </div>
    </main>
  );
}
