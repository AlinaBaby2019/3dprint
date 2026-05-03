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
  const titles: Record<string, string> = { da: "Vilkår og betingelser – Aarhus 3D Print", en: "Terms and conditions – Aarhus 3D Print", zh: "服务条款 – Aarhus 3D Print" };
  return { title: titles[rawLocale], robots: { index: false, follow: false } };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const content: Record<Locale, { title: string; sections: { heading: string; body: string }[] }> = {
  da: {
    title: "Vilkår og betingelser",
    sections: [
      {
        heading: "1. Generelt",
        body: "Disse vilkår gælder for alle ordrer og projekter hos Aarhus 3D Print. Ved at benytte vores service accepterer du disse vilkår. Aarhus 3D Print er et enkeltmandsfirma registreret i Aarhus, Danmark. CVR-nummer oplyses snarest."
      },
      {
        heading: "2. Priser og tilbud",
        body: "Alle priser er vejledende estimater, medmindre andet er bekræftet skriftligt. For uploadede 3D-modeller gælder at den endelige pris altid bekræftes manuelt af os, inden betaling finder sted. Vi forbeholder os retten til at justere prisen baseret på faktisk materiale- og tidsforbrug."
      },
      {
        heading: "3. Uploadede filer",
        body: "Du bekræfter, at du har de nødvendige rettigheder til at uploade og printe de modeller, du sender til os. Vi forbeholder os retten til at afvise ordrer, der involverer ophavsretligt beskyttet materiale uden tilladelse, stødende indhold eller konstruktioner, der vurderes uprintbare. Uploadede filer bruges udelukkende til at producere din ordre og deles ikke med tredjepart."
      },
      {
        heading: "4. Levering og afhentning",
        body: "Leveringstider er vejledende og kan påvirkes af produktionskø, materialeforsyning og tekniske faktorer. Vi tilbyder afhentning i Aarhus, lokal levering og pakkepost. Leveringsomkostninger fremgår af din ordre."
      },
      {
        heading: "5. Reklamation og refusion",
        body: "Klager over produktionsfejl skal fremsendes inden for 14 dage efter modtagelse med fotodokumentation. Vi tilbyder enten genudskrivning eller fuld refusion for defekte produkter. Fejl forårsaget af mangler i den originale model betragtes ikke som produktionsfejl. Refusioner behandles inden for 10 hverdage."
      },
      {
        heading: "6. Ansvarsbegrænsning",
        body: "3D-printede dele er fremstillet til almindelig brug og er ikke certificerede til sikkerhedskritiske anvendelser som medicinskt udstyr, bygningskonstruktioner eller lignende. Vi påtager os ikke ansvar for skader forårsaget af brug ud over det tilsigtede formål."
      },
      {
        heading: "7. Ændringer af vilkår",
        body: "Vi forbeholder os retten til at opdatere disse vilkår. Ændringer træder i kraft ved offentliggørelse på hjemmesiden. Ordrer afgivet før en ændring er underlagt de vilkår, der var gældende på ordretidspunktet."
      }
    ]
  },
  en: {
    title: "Terms and Conditions",
    sections: [
      {
        heading: "1. General",
        body: "These terms apply to all orders and projects with Aarhus 3D Print. By using our service you accept these terms. Aarhus 3D Print is a sole trader registered in Aarhus, Denmark. CVR number will be added shortly."
      },
      {
        heading: "2. Prices and Quotes",
        body: "All prices are indicative estimates unless otherwise confirmed in writing. For uploaded 3D models, the final price is always confirmed manually by us before payment is collected. We reserve the right to adjust the price based on actual material and time usage."
      },
      {
        heading: "3. Uploaded Files",
        body: "You confirm that you hold the necessary rights to upload and print the models you send to us. We reserve the right to refuse orders involving copyrighted material without permission, offensive content, or designs deemed unprintable. Uploaded files are used solely to produce your order and are not shared with third parties."
      },
      {
        heading: "4. Delivery and Pickup",
        body: "Delivery times are indicative and may be affected by production queue, material supply, and technical factors. We offer pickup in Aarhus, local delivery, and parcel shipping. Delivery costs are shown on your order."
      },
      {
        heading: "5. Complaints and Refunds",
        body: "Complaints about production defects must be submitted within 14 days of receipt with photographic documentation. We offer either reprint or full refund for defective products. Defects caused by issues in the original model are not considered production defects. Refunds are processed within 10 business days."
      },
      {
        heading: "6. Liability Limitation",
        body: "3D printed parts are manufactured for general use and are not certified for safety-critical applications such as medical devices, structural components, or similar. We accept no liability for damage caused by use beyond the intended purpose."
      },
      {
        heading: "7. Changes to Terms",
        body: "We reserve the right to update these terms. Changes take effect upon publication on the website. Orders placed before a change are subject to the terms in effect at the time of the order."
      }
    ]
  },
  zh: {
    title: "条款与条件",
    sections: [
      {
        heading: "1. 总则",
        body: "本条款适用于 Aarhus 3D Print 的所有订单和项目。使用本服务即表示您接受本条款。Aarhus 3D Print 是一家注册于丹麦奥胡斯的个体经营企业。CVR 编号将尽快补充。"
      },
      {
        heading: "2. 价格与报价",
        body: "所有价格均为参考估价，除非以书面形式另行确认。对于上传的 3D 模型，最终价格始终由我们手动确认后才会收款。我们保留根据实际材料和时间消耗调整价格的权利。"
      },
      {
        heading: "3. 上传文件",
        body: "您确认对您上传的模型拥有必要的权利。我们保留拒绝以下订单的权利：涉及未经授权的受版权保护内容、冒犯性内容或被认为无法打印的设计。上传文件仅用于生产您的订单，不会与第三方共享。"
      },
      {
        heading: "4. 配送与自取",
        body: "交货时间仅供参考，可能受生产队列、材料供应和技术因素影响。我们提供奥胡斯自取、同城配送和快递服务。配送费用将在您的订单中显示。"
      },
      {
        heading: "5. 投诉与退款",
        body: "关于生产缺陷的投诉须在收货后 14 天内提交并附照片证明。对于有缺陷的产品，我们提供重新打印或全额退款。由原始模型问题导致的缺陷不视为生产缺陷。退款将在 10 个工作日内处理。"
      },
      {
        heading: "6. 责任限制",
        body: "3D 打印零件仅供一般用途，未经认证用于安全关键应用，如医疗器械、结构构件等。对于超出预期用途使用而造成的损害，我们不承担责任。"
      },
      {
        heading: "7. 条款变更",
        body: "我们保留更新本条款的权利。更改在网站上发布后即时生效。在更改之前下的订单适用订单时有效的条款。"
      }
    ]
  }
};

export default async function TermsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const t = getDictionary(locale);
  const page = content[locale];

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <Link className="brand" href={`/${locale}`}>
            <span className="brand-mark">3D</span>
            <span>Aarhus 3D Print</span>
          </Link>
          <nav className="nav" aria-label="Primary">
            <Link href={`/${locale}`}>{t.nav.print}</Link>
            <AccountNav label={t.nav.account} locale={locale} />
          </nav>
        </header>

        <article className="legal-page">
          <h1>{page.title}</h1>
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </article>

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
      </div>
    </main>
  );
}
