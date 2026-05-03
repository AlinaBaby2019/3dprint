import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const t = getDictionary(rawLocale as Locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    title: `${t.faq.title} – Aarhus 3D Print`,
    description: t.faq.subtitle,
    alternates: { canonical: `${siteUrl}/${rawLocale}/faq` }
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function FaqPage({ params }: PageProps) {
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
            <Link href={`/${locale}/products` as Route}>{t.nav.products}</Link>
            <Link href={`/${locale}/faq` as Route} aria-current="page">{t.nav.faq}</Link>
            <AccountNav label={t.nav.account} locale={locale} />
            <span className="language-switch" aria-label="Language">
              {locales.map((item) => (
                <Link
                  aria-current={item === locale ? "page" : undefined}
                  href={`/${item}/faq` as Route}
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
              <h1>{t.faq.title}</h1>
              <p>{t.faq.subtitle}</p>
            </div>
          </div>

          <div className="faq-list">
            {t.faq.items.map((item, i) => (
              <article className="faq-item panel" key={i}>
                <h2 className="faq-question">{item.q}</h2>
                <p className="faq-answer">{item.a}</p>
              </article>
            ))}
          </div>

          <div style={{ marginTop: "48px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Link className="button primary" href={`/${locale}/print` as Route}>
              {t.nav.print}
            </Link>
            <Link className="button secondary" href={`/${locale}/products` as Route}>
              {t.nav.products}
            </Link>
          </div>
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
