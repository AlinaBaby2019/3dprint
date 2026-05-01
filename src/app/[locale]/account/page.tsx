import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AccountPanel } from "@/components/account-panel";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AccountPage({ params }: PageProps) {
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
            <Link href={`/${locale}/account` as Route} aria-current="page">
              {t.nav.account}
            </Link>
          </nav>
        </header>

        <AccountPanel copy={t.account} />
      </div>
    </main>
  );
}
