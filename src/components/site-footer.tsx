import Link from "next/link";
import type { Route } from "next";
import { getDictionary, type Locale } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const year = new Date().getFullYear();

  const sections = [
    {
      heading: t.nav.products,
      links: [
        { href: `/${locale}/print` as Route, label: t.nav.print },
        { href: `/${locale}/products` as Route, label: t.nav.products },
        { href: `/${locale}/faq` as Route, label: t.nav.faq }
      ]
    },
    {
      heading: t.nav.account,
      links: [{ href: `/${locale}/account` as Route, label: t.nav.account }]
    },
    {
      heading: t.nav.terms,
      links: [
        { href: `/${locale}/terms` as Route, label: t.nav.terms },
        { href: `/${locale}/privacy` as Route, label: t.nav.privacy },
        { href: `/${locale}/cookies` as Route, label: t.nav.cookies },
        { href: `/${locale}/upload-policy` as Route, label: t.nav.uploadPolicy },
        { href: `/${locale}/returns` as Route, label: t.nav.returns }
      ]
    }
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__columns">
          {sections.map((section) => (
            <div className="site-footer__column" key={section.heading}>
              <h4>{section.heading}</h4>
              <ul>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="site-footer__legal">
          <span>© {year} Aarhus 3D Print</span>
          <span>{t.footer}</span>
        </div>
      </div>
    </footer>
  );
}
