import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PackageCheck, Search, Upload } from "lucide-react";
import { AccountNav } from "@/components/account-nav";
import { PrintUpload } from "@/components/print-upload";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { materials, products } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ locale: string }>;
};

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
            <a href="#print">{t.nav.print}</a>
            <a href="#products">{t.nav.products}</a>
            <a href="#materials">{t.nav.materials}</a>
            <a href="#orders">{t.nav.orders}</a>
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
              <span>24-48h quote</span>
              <span>Aarhus pickup</span>
              <span>PLA · PETG · TPU</span>
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
            <PrintUpload copy={t.upload} />

            <aside className="panel process-panel">
              <div className="process-step">
                <span>01</span>
                <strong>Upload</strong>
                <p>STL, 3MF, OBJ, STEP, images, or ZIP files.</p>
              </div>
              <div className="process-step">
                <span>02</span>
                <strong>Review</strong>
                <p>Printability and final price are confirmed manually.</p>
              </div>
              <div className="process-step">
                <span>03</span>
                <strong>Print locally</strong>
                <p>Pickup, local delivery, or parcel shipping from Aarhus.</p>
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
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.name}>
                <div className="product-art">
                  <Image
                    alt={product.name}
                    height={560}
                    src={product.image}
                    width={760}
                  />
                </div>
                <div className="card-body">
                  <h3>{product.name}</h3>
                  <div className="meta">
                    {product.category} · {product.leadTime}
                  </div>
                  <div className="price">{product.price}</div>
                </div>
              </article>
            ))}
          </div>
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
          <form className="status-box">
            <input placeholder={t.orders.placeholder} type="text" />
            <button className="button primary" type="button">
              <Search size={18} />
              {t.orders.action}
            </button>
          </form>
        </section>

        <footer className="footer">
          Aarhus 3D Print · CVR pending · Local pickup, delivery, and shipping.
        </footer>
      </div>
    </main>
  );
}
