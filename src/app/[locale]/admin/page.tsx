import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPanel } from "@/components/admin-panel";
import { AdminOrders } from "@/components/admin-orders";
import { AdminMaterials } from "@/components/admin-materials";
import { AdminProducts } from "@/components/admin-products";
import { AdminPayments } from "@/components/admin-payments";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
      <SiteHeader locale={locale} current="admin" />

      <div className="shell shell--wide admin-shell">
        <AdminPanel copy={t.admin} locale={locale} />
        <AdminOrders copy={t.admin} locale={locale} />
        <AdminMaterials copy={{ ...t.admin, saved: t.admin.messageSaved, error: t.admin.messageError }} />
        <AdminProducts copy={{ ...t.admin, saved: t.admin.messageSaved, error: t.admin.messageError }} />
        <AdminPayments copy={t.admin} />
      </div>

      <SiteFooter locale={locale} />
    </main>
  );
}
