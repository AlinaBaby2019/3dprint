import Link from "next/link";
import type { Metadata } from "next";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const titles: Record<string, string> = { da: "Cookiepolitik – Aarhus 3D Print", en: "Cookie policy – Aarhus 3D Print", zh: "Cookie政策 – Aarhus 3D Print" };
  return { title: titles[rawLocale], robots: { index: false, follow: false } };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const content: Record<Locale, { title: string; sections: { heading: string; body: string }[] }> = {
  da: {
    title: "Cookiepolitik",
    sections: [
      {
        heading: "1. Hvad er cookies?",
        body: "Cookies er små tekstfiler, som gemmes i din browser, når du besøger et websted. De bruges til at huske dine indstillinger og forbedre din oplevelse."
      },
      {
        heading: "2. Hvilke cookies bruger vi?",
        body: "Vi bruger teknisk nødvendige cookies for at holde dig logget ind og huske dine sessionsoplysninger. Vi bruger ikke tredjeparts tracking-cookies eller annoncerettet cookies."
      },
      {
        heading: "3. Supabase Auth",
        body: "Vores autentifikationsystem via Supabase gemmer en session-token i din browser via localStorage og en sikker cookie. Denne token bruges udelukkende til at bekræfte din identitet under dit besøg."
      },
      {
        heading: "4. Lokal lagring",
        body: "Din indkøbskurv gemmes midlertidigt i browserens localStorage. Disse data forlader ikke din browser og sendes ikke til vores servere, medmindre du gennemfører et køb."
      },
      {
        heading: "5. Samtykke",
        body: "Ved at benytte vores hjemmeside accepterer du vores brug af teknisk nødvendige cookies. Du kan til enhver tid slette cookies i dine browserindstillinger."
      },
      {
        heading: "6. Kontakt",
        body: "Har du spørgsmål om vores brug af cookies, er du velkommen til at kontakte os via hjemmesiden."
      }
    ]
  },
  en: {
    title: "Cookie Policy",
    sections: [
      {
        heading: "1. What are cookies?",
        body: "Cookies are small text files stored in your browser when you visit a website. They are used to remember your preferences and improve your experience."
      },
      {
        heading: "2. What cookies do we use?",
        body: "We use technically necessary cookies to keep you logged in and remember your session information. We do not use third-party tracking cookies or advertising cookies."
      },
      {
        heading: "3. Supabase Auth",
        body: "Our authentication system via Supabase stores a session token in your browser using localStorage and a secure cookie. This token is used solely to verify your identity during your visit."
      },
      {
        heading: "4. Local storage",
        body: "Your shopping cart is temporarily stored in the browser's localStorage. This data does not leave your browser and is not sent to our servers unless you complete a purchase."
      },
      {
        heading: "5. Consent",
        body: "By using our website, you accept our use of technically necessary cookies. You can delete cookies at any time in your browser settings."
      },
      {
        heading: "6. Contact",
        body: "If you have questions about our use of cookies, please contact us via the website."
      }
    ]
  },
  zh: {
    title: "Cookie政策",
    sections: [
      {
        heading: "1. 什么是Cookie？",
        body: "Cookie是您访问网站时存储在浏览器中的小型文本文件，用于记住您的设置并改善您的体验。"
      },
      {
        heading: "2. 我们使用哪些Cookie？",
        body: "我们使用技术上必要的Cookie来保持您的登录状态并记住会话信息。我们不使用第三方跟踪Cookie或广告Cookie。"
      },
      {
        heading: "3. Supabase认证",
        body: "我们通过Supabase的认证系统在您的浏览器中通过localStorage和安全Cookie存储会话令牌，该令牌仅用于在您访问期间验证您的身份。"
      },
      {
        heading: "4. 本地存储",
        body: "您的购物车暂时存储在浏览器的localStorage中，这些数据不会离开您的浏览器，除非您完成购买，否则不会发送到我们的服务器。"
      },
      {
        heading: "5. 同意",
        body: "通过使用我们的网站，您接受我们使用技术上必要的Cookie。您可以随时在浏览器设置中删除Cookie。"
      },
      {
        heading: "6. 联系",
        body: "如您对我们使用Cookie有任何疑问，请通过网站与我们联系。"
      }
    ]
  }
};

export default async function CookiesPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const t = getDictionary(locale);
  const page = content[locale];

  return (
    <main className="page">
      <div className="shell">
        <nav className="top-nav">
          <AccountNav locale={locale} />
        </nav>
        <article className="legal-page">
          <h1>{page.title}</h1>
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <footer className="footer">
            {t.footer}
            <span className="footer-links">
              <Link href={`/${locale}/terms` as Route}>{t.nav.terms}</Link>
              <Link href={`/${locale}/privacy` as Route}>{t.nav.privacy}</Link>
              <Link href={`/${locale}/cookies` as Route}>{t.nav.cookies}</Link>
              <Link href={`/${locale}/upload-policy` as Route}>{t.nav.uploadPolicy}</Link>
              <Link href={`/${locale}/returns` as Route}>{t.nav.returns}</Link>
            </span>
          </footer>
        </article>
      </div>
    </main>
  );
}
