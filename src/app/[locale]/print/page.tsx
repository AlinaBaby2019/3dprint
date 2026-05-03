import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { PrintUpload } from "@/components/print-upload";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const pageMeta: Record<string, { title: string; description: string }> = {
  da: {
    title: "Upload 3D model – Aarhus 3D Print",
    description: "Upload din STL, 3MF eller OBJ-fil. Vi gennemgår modellen og sender et tilbud inden for 24-48 timer."
  },
  en: {
    title: "Upload 3D model – Aarhus 3D Print",
    description: "Upload your STL, 3MF, or OBJ file. We review the model and send a quote within 24-48 hours."
  },
  zh: {
    title: "上传3D模型 – Aarhus 3D Print",
    description: "上传您的STL、3MF或OBJ文件。我们将审核模型并在24-48小时内发送报价。"
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
    alternates: { canonical: `${siteUrl}/${rawLocale}/print` }
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PrintPage({ params }: PageProps) {
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
            <Link href={`/${locale}/print` as Route} aria-current="page">{t.nav.print}</Link>
            <Link href={`/${locale}/products` as Route}>{t.nav.products}</Link>
            <Link href={`/${locale}/faq` as Route}>{t.nav.faq}</Link>
            <AccountNav label={t.nav.account} locale={locale} />
            <span className="language-switch" aria-label="Language">
              {locales.map((item) => (
                <Link
                  aria-current={item === locale ? "page" : undefined}
                  href={`/${item}/print` as Route}
                  key={item}
                >
                  {item.toUpperCase()}
                </Link>
              ))}
            </span>
          </nav>
        </header>

        <section className="section print-section">
          <div className="section-head">
            <div>
              <h1>{t.upload.title}</h1>
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

        <footer className="footer">
          {t.footer}
          <span className="footer-links">
            <Link href={`/${locale}/terms` as Route}>{t.nav.terms}</Link>
            <Link href={`/${locale}/privacy` as Route}>{t.nav.privacy}</Link>
            <Link href={`/${locale}/upload-policy` as Route}>{t.nav.uploadPolicy}</Link>
            <Link href={`/${locale}/faq` as Route}>{t.nav.faq}</Link>
          </span>
        </footer>
      </div>
    </main>
  );
}
