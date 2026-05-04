import Link from "next/link";
import type { Route } from "next";
import { AccountNav } from "@/components/account-nav";
import { getDictionary, locales, type Locale } from "@/lib/i18n";

type SiteHeaderProps = {
  locale: Locale;
  current?: "print" | "products" | "materials" | "orders" | "faq" | "account" | "admin";
};

export function SiteHeader({ locale, current }: SiteHeaderProps) {
  const t = getDictionary(locale);
  const links: Array<{ key: NonNullable<SiteHeaderProps["current"]>; href: Route; label: string }> = [
    { key: "print", href: `/${locale}/print` as Route, label: t.nav.print },
    { key: "products", href: `/${locale}/products` as Route, label: t.nav.products },
    { key: "faq", href: `/${locale}/faq` as Route, label: t.nav.faq }
  ];

  return (
    <header className="global-nav" aria-label="Primary">
      <div className="global-nav__inner">
        <Link className="global-nav__brand" href={`/${locale}` as Route}>
          <span className="global-nav__brand-mark">3D</span>
          <span>Aarhus 3D Print</span>
        </Link>

        <nav className="global-nav__links" aria-label="Sections">
          {links.map((link) => (
            <Link
              aria-current={current === link.key ? "page" : undefined}
              href={link.href}
              key={link.key}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="global-nav__util">
          <AccountNav label={t.nav.account} locale={locale} />
          <span className="global-nav__lang" aria-label="Language">
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
        </div>
      </div>
    </header>
  );
}
