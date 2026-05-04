import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCatalog } from "@/components/product-catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
      <SiteHeader locale={locale} current="products" />

      {/* Hero — canvas */}
      <section className="tile">
        <div className="tile-inner">
          <div className="tile-head tile-head--center">
            <h1 className="t-hero-display">{t.products.title}</h1>
            <p className="t-lead-airy">{t.products.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Catalog — parchment */}
      <section className="tile tile--parchment">
        <div className="tile-inner tile-inner--wide">
          <ProductCatalog copy={t.products} locale={locale} />
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
