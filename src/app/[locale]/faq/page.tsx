import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
      <SiteHeader locale={locale} current="faq" />

      {/* Hero — canvas */}
      <section className="tile">
        <div className="tile-inner">
          <div className="tile-head tile-head--center">
            <h1 className="t-hero-display">{t.faq.title}</h1>
            <p className="t-lead-airy">{t.faq.subtitle}</p>
          </div>
        </div>
      </section>

      {/* FAQ list — parchment */}
      <section className="tile tile--parchment">
        <div className="tile-inner">
          <div className="faq-list">
            {t.faq.items.map((item, i) => (
              <article className="faq-item" key={i}>
                <h2 className="faq-question">{item.q}</h2>
                <p className="faq-answer">{item.a}</p>
              </article>
            ))}
          </div>

          <div className="actions" style={{ marginTop: "var(--space-xxl)" }}>
            <Link className="btn btn--primary" href={`/${locale}/print` as Route}>
              {t.nav.print}
            </Link>
            <Link className="btn btn--secondary" href={`/${locale}/products` as Route}>
              {t.nav.products}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
