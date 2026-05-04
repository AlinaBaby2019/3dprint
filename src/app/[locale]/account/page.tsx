import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountPanel } from "@/components/account-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const pageMeta: Record<string, { title: string; description: string }> = {
  da: { title: "Min konto – Aarhus 3D Print", description: "Log ind for at se dine projekter, tilbud og adresser." },
  en: { title: "My account – Aarhus 3D Print", description: "Sign in to view your projects, quotes, and addresses." },
  zh: { title: "我的账户 – Aarhus 3D Print", description: "登录查看您的项目、报价和地址。" }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const meta = pageMeta[rawLocale];
  return { title: meta.title, description: meta.description };
}

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
      <SiteHeader locale={locale} current="account" />

      <section className="tile tile--parchment">
        <div className="tile-inner tile-inner--wide">
          <AccountPanel copy={t.account} locale={locale} />
        </div>
      </section>

      <SiteFooter locale={locale} />
    </main>
  );
}
