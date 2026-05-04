import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintUpload } from "@/components/print-upload";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
      <SiteHeader locale={locale} current="print" />

      {/* Hero — canvas */}
      <section className="tile">
        <div className="tile-inner">
          <div className="tile-head tile-head--center">
            <h1 className="t-hero-display">{t.upload.title}</h1>
            <p className="t-lead-airy">{t.upload.description}</p>
          </div>
        </div>
      </section>

      {/* Configurator — parchment */}
      <section className="tile tile--parchment">
        <div className="tile-inner tile-inner--wide">
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

      <SiteFooter locale={locale} />
    </main>
  );
}
