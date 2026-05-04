import type { ReactNode } from "react";
import { isLocale } from "@/lib/i18n";
import { LocaleLangSync } from "@/components/locale-lang-sync";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "da";
  return (
    <>
      <LocaleLangSync locale={locale} />
      {children}
    </>
  );
}
