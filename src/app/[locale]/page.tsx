import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PackageCheck, Upload } from "lucide-react";
import { AccountNav } from "@/components/account-nav";
import { OrderStatusLookup } from "@/components/order-status-lookup";
import { PrintUpload } from "@/components/print-upload";
import { ProductCatalog } from "@/components/product-catalog";
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
      <div className="shell">
        <header className="topbar">
          <Link className="brand" href={`/${locale}`}>
            <span className="brand-mark">3D</span>
            <span>Aarhus 3D Print</span>
          </Link>

          <nav className="nav" aria-label="Primary">
            <Link href={`/${locale}/print` as Route}>{t.nav.print}</Link>
            <Link href={`/${locale}/products` as Route}>{t.nav.products}</Link>
            <a href="#materials">{t.nav.materials}</a>
            <a href="#orders">{t.nav.orders}</a>
            <Link href={`/${locale}/faq` as Route}>{t.nav.faq}</Link>
            <AccountNav label={t.nav.account} locale={locale} />
            <span className="language-switch" aria-label="Language">
              {locales.map((item) => (
                <Link
                  aria-current={item === locale ? "page" : undefined}
                  href={`/${item}`}
                  key={item}
                >
                  {item.toUpperCase()}
                </Link>
              ))}
            </span>
          </nav>
        </header>

        <section className="hero">
          <div>
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1>{t.hero.title}</h1>
            <p className="hero-copy">{t.hero.subtitle}</p>
            <div className="actions">
              <a className="button primary" href="#print">
                <Upload size={18} />
                {t.hero.primary}
              </a>
              <a className="button secondary" href="#products">
                <PackageCheck size={18} />
                {t.hero.secondary}
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <Image
              alt="3D printer producing a practical part"
              className="hero-image"
              height={850}
              priority
              src="/images/hero-3d-print.png"
              width={1200}
            />
            <div className="hero-facts" aria-label="Service highlights">
              <span>{t.hero.factQuote}</span>
              <span>{t.hero.factPickup}</span>
              <span>{t.hero.factMaterials}</span>
            </div>
          </div>
        </section>

        <section className="section print-section" id="print">
          <div className="section-head">
            <div>
              <h2>{t.upload.title}</h2>
              <p>{t.upload.description}</p>
            </div>
          </div>

          <div className="print-layout">
            <PrintUpload copy={t.upload} locale={locale} />

            <aside className="panel process-panel">
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
        </section>

        <section className="section" id="products">
          <div className="section-head">
            <div>
              <h2>{t.products.title}</h2>
              <p>{t.products.subtitle}</p>
            </div>
          </div>
          <ProductCatalog copy={t.products} locale={locale} />
        </section>

        <section className="section" id="materials">
          <div className="section-head">
            <div>
              <h2>{t.materials.title}</h2>
              <p>{t.materials.subtitle}</p>
            </div>
          </div>
          <div className="material-grid">
            {materials.map((material) => (
              <article className="material-card" key={material.name}>
                <div className="card-body">
                  <h3>{material.name}</h3>
                  <p>{material.use}</p>
                  <div className="meta">{material.stock}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="orders">
          <div className="section-head">
            <div>
              <h2>{t.orders.title}</h2>
            </div>
          </div>
          <OrderStatusLookup copy={t.orders} locale={locale} />
        </section>

        <footer className="footer">
          {t.footer}
          <span className="footer-links">
            <Link href={`/${locale}/faq` as Route}>{t.nav.faq}</Link>
            <Link href={`/${locale}/terms` as Route}>{t.nav.terms}</Link>
            <Link href={`/${locale}/privacy` as Route}>{t.nav.privacy}</Link>
            <Link href={`/${locale}/cookies` as Route}>{t.nav.cookies}</Link>
            <Link href={`/${locale}/upload-policy` as Route}>{t.nav.uploadPolicy}</Link>
            <Link href={`/${locale}/returns` as Route}>{t.nav.returns}</Link>
          </span>
        </footer>
      </div>
    </main>
  );
}
