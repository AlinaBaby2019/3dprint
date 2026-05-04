import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, PackageCheck, Upload } from "lucide-react";
import { OrderStatusLookup } from "@/components/order-status-lookup";
import { PrintUpload } from "@/components/print-upload";
import { ProductCatalog } from "@/components/product-catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { materials } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const pageMeta: Record<string, { title: string; description: string }> = {
  da: {
    title: "Aarhus 3D Print – Lokal 3D printservice i Aarhus",
    description:
      "Upload din model, vælg materiale og få et hurtigt tilbud. Lokal 3D print fra Aarhus – afhentning, lokal levering og forsendelse."
  },
  en: {
    title: "Aarhus 3D Print – Local 3D printing service in Aarhus",
    description:
      "Upload a model, choose material, and get a quick quote. Local 3D printing from Aarhus — pickup, local delivery, and shipping."
  },
  zh: {
    title: "奥胡斯 3D 打印 – 奥胡斯本地打印服务",
    description:
      "上传模型，选择材料，快速获得报价。奥胡斯本地 3D 打印，支持自取、同城配送和快递。"
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
    alternates: {
      canonical: `${siteUrl}/${rawLocale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}`]))
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${siteUrl}/${rawLocale}`,
      siteName: "Aarhus 3D Print",
      locale: rawLocale === "da" ? "da_DK" : rawLocale === "zh" ? "zh_CN" : "en_GB",
      type: "website"
    }
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleHome({ params }: PageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const t = getDictionary(locale);

  return (
    <main className="page">
      <SiteHeader locale={locale} />

      {/* Hero — canvas, full-bleed */}
      <section className="tile">
        <div className="tile-inner tile-inner--wide">
          <div className="hero-grid">
            <div>
              <p className="hero-eyebrow">{t.hero.eyebrow}</p>
              <h1 className="t-hero-display">{t.hero.title}</h1>
              <p className="t-lead-airy hero-subtitle">{t.hero.subtitle}</p>
              <div className="actions">
                <Link className="btn btn--primary" href={`/${locale}/print` as Route}>
                  <Upload size={18} />
                  {t.hero.primary}
                </Link>
                <Link className="btn btn--secondary" href={`/${locale}/products` as Route}>
                  <PackageCheck size={18} />
                  {t.hero.secondary}
                </Link>
              </div>
            </div>

            <figure className="hero-figure">
              <Image
                alt="3D printer producing a practical part"
                height={850}
                priority
                src="/images/hero-3d-print.png"
                width={1200}
              />
              <figcaption className="hero-facts" aria-label="Service highlights">
                <span>{t.hero.factQuote}</span>
                <span>{t.hero.factPickup}</span>
                <span>{t.hero.factMaterials}</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Print upload — parchment */}
      <section className="tile tile--parchment" id="print">
        <div className="tile-inner tile-inner--wide">
          <div className="tile-head">
            <h2 className="t-display-md">{t.upload.title}</h2>
            <p className="t-lead-airy">{t.upload.description}</p>
          </div>

          <div className="print-layout">
            <PrintUpload copy={t.upload} locale={locale} />

            <aside className="process-panel">
              <div className="process-step">
                <span>01</span>
                <strong>{t.upload.step1}</strong>
                <p>{t.upload.step1Body}</p>
              </div>
              <div className="process-step">
                <span>02</span>
                <strong>{t.upload.step2}</strong>
                <p>{t.upload.step2Body}</p>
              </div>
              <div className="process-step">
                <span>03</span>
                <strong>{t.upload.step3}</strong>
                <p>{t.upload.step3Body}</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Products — canvas */}
      <section className="tile" id="products">
        <div className="tile-inner tile-inner--wide">
          <div className="tile-head">
            <h2 className="t-display-md">{t.products.title}</h2>
            <p className="t-lead-airy">{t.products.subtitle}</p>
          </div>
          <ProductCatalog copy={t.products} locale={locale} />
        </div>
      </section>

      {/* Materials — parchment */}
      <section className="tile tile--parchment" id="materials">
        <div className="tile-inner">
          <div className="tile-head">
            <h2 className="t-display-md">{t.materials.title}</h2>
            <p className="t-lead-airy">{t.materials.subtitle}</p>
          </div>

          <div className="material-grid--apple">
            {materials.map((material) => (
              <article className="utility-card" key={material.name}>
                <h3>{material.name}</h3>
                <p>{material.use}</p>
                <p className="stock">{material.stock}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Local production — dark */}
      <section className="tile tile--dark">
        <div className="tile-inner banner-dark">
          <h2 className="t-display-lg">{t.upload.step3}</h2>
          <p className="t-lead-airy">{t.upload.step3Body}</p>
          <div className="actions">
            <Link className="btn btn--primary" href={`/${locale}/print` as Route}>
              {t.hero.primary}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Order status lookup — canvas */}
      <section className="tile" id="orders">
        <div className="tile-inner">
          <div className="tile-head">
            <h2 className="t-display-md">{t.orders.title}</h2>
          </div>
          <OrderStatusLookup copy={t.orders} locale={locale} />
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
