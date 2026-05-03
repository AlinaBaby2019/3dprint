import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { ProductCatalog } from "@/components/product-catalog";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const pageMeta: Record<string, { title: string; description: string }> = {
  da: {
    title: "3D-printede produkter – Aarhus 3D Print",
    description: "Praktiske produkter printet på bestilling. Vælg farve og antal — betaling sker direkte ved checkout."
  },
  en: {
    title: "3D-printed products – Aarhus 3D Print",
    description: "Practical products printed on demand. Choose color and quantity — pay directly at checkout."
  },
  zh: {
    title: "3D打印成品 – Aarhus 3D Print",
    description: "按需打印的实用小物，可选颜色和数量，直接结账付款。"
  }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const meta = pageMeta[rawLocale];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `${siteUrl}/${rawLocale}/products` }
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ProductsPage({ params }: PageProps) {
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
          <Link className="brand" href={`/${locale}` as Route}>
            <span className="brand-mark">3D</span>
            <span>Aarhus 3D Print</span>
          </Link>
          <nav className="nav" aria-label="Primary">
            <Link href={`/${locale}/print` as Route}>{t.nav.print}</Link>
            <Link href={`/${locale}/products` as Route} aria-current="page">{t.nav.products}</Link>
            <Link href={`/${locale}/faq` as Route}>{t.nav.faq}</Link>
            <AccountNav label={t.nav.account} locale={locale} />
            <span className="language-switch" aria-label="Language">
              {locales.map((item) => (
                <Link
                  aria-current={item === locale ? "page" : undefined}
                  href={`/${item}/products` as Route}
                  key={item}
                >
                  {item.toUpperCase()}
                </Link>
              ))}
            </span>
          </nav>
        </header>

        <section className="section">
          <div className="section-head">
            <div>
              <h1>{t.products.title}</h1>
              <p>{t.products.subtitle}</p>
            </div>
          </div>
          <ProductCatalog copy={t.products} locale={locale} />
        </section>

        <footer className="footer">
          {t.footer}
          <span className="footer-links">
            <Link href={`/${locale}/terms` as Route}>{t.nav.terms}</Link>
            <Link href={`/${locale}/privacy` as Route}>{t.nav.privacy}</Link>
            <Link href={`/${locale}/faq` as Route}>{t.nav.faq}</Link>
          </span>
        </footer>
      </div>
    </main>
  );
}
