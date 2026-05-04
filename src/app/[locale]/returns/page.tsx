import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isLocale, locales, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  const titles: Record<string, string> = { da: "Refusion og afbestilling – Aarhus 3D Print", en: "Returns and cancellations – Aarhus 3D Print", zh: "退款与取消政策 – Aarhus 3D Print" };
  return { title: titles[rawLocale], robots: { index: false, follow: false } };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const content: Record<Locale, { title: string; sections: { heading: string; body: string }[] }> = {
  da: {
    title: "Returnering og refusion",
    sections: [
      {
        heading: "1. Reklamationsret",
        body: "Du har 14 dages reklamationsret på alle vores produkter. Reklamationer skal sendes til os inden for 14 dage efter modtagelse, vedlagt fotodokumentation af fejlen."
      },
      {
        heading: "2. Produktionsfejl",
        body: "Hvis din ordre er fejlbehæftet på grund af en fejl fra vores side, tilbyder vi enten genudskrivning eller fuld refusion. Vi dækker eventuelle returfragt-omkostninger ved godkendte reklamationer."
      },
      {
        heading: "3. Modelrelaterede fejl",
        body: "Fejl der skyldes mangler i den originale model – som f.eks. ikke-manifold geometri, forkerte dimensioner eller utilsigtede designfejl – anses ikke som produktionsfejl og er ikke dækket af vores reklamationspolitik."
      },
      {
        heading: "4. Fortrydelsesret",
        body: "For standardprodukter fra vores katalog gælder 14 dages fortrydelsesret i henhold til dansk forbrugerlovgivning. For special- og customordrer, herunder alle uploadede modeller, gælder fortrydelsesretten ikke, da produktionen sker på baggrund af kundens specifikationer."
      },
      {
        heading: "5. Refusionsproces",
        body: "Godkendte refusioner behandles inden for 10 hverdage og udbetales til den betalingsmetode, der blev brugt ved købet."
      },
      {
        heading: "6. Kontakt",
        body: "Reklamationer og returneringer håndteres via vores hjemmeside. Kontakt os med dit ordrenummer og en beskrivelse af problemet."
      }
    ]
  },
  en: {
    title: "Returns and Refunds",
    sections: [
      {
        heading: "1. Right to complain",
        body: "You have a 14-day right to complain on all our products. Complaints must be submitted within 14 days of receipt, with photo documentation of the defect."
      },
      {
        heading: "2. Production defects",
        body: "If your order is defective due to an error on our part, we offer either reprint or full refund. We cover any return shipping costs for approved complaints."
      },
      {
        heading: "3. Model-related issues",
        body: "Defects caused by issues in the original model — such as non-manifold geometry, incorrect dimensions, or unintended design errors — are not considered production defects and are not covered by our complaint policy."
      },
      {
        heading: "4. Right of withdrawal",
        body: "Standard catalog products have a 14-day right of withdrawal under Danish consumer law. For custom and made-to-order products, including all uploaded models, the right of withdrawal does not apply, as production is based on customer specifications."
      },
      {
        heading: "5. Refund process",
        body: "Approved refunds are processed within 10 business days and returned to the payment method used at purchase."
      },
      {
        heading: "6. Contact",
        body: "Complaints and returns are handled via our website. Contact us with your order number and a description of the issue."
      }
    ]
  },
  zh: {
    title: "退货与退款",
    sections: [
      {
        heading: "1. 投诉权利",
        body: "我们所有产品均享有14天投诉权。投诉必须在收货后14天内提交，并附上缺陷的照片证明。"
      },
      {
        heading: "2. 生产缺陷",
        body: "如果您的订单因我方原因存在缺陷，我们提供重新打印或全额退款。经核实的投诉，我们将承担退货运费。"
      },
      {
        heading: "3. 模型相关问题",
        body: "由原始模型问题引起的缺陷——如非流形几何体、错误尺寸或意外设计错误——不被视为生产缺陷，不在我们的投诉政策范围内。"
      },
      {
        heading: "4. 撤销权",
        body: "标准目录产品依据丹麦消费者法享有14天撤销权。对于定制和按需生产的产品（包括所有上传模型），由于生产基于客户规格，撤销权不适用。"
      },
      {
        heading: "5. 退款流程",
        body: "经批准的退款将在10个工作日内处理，退还至购买时使用的支付方式。"
      },
      {
        heading: "6. 联系",
        body: "投诉和退货通过我们的网站处理。请提供您的订单号和问题描述与我们联系。"
      }
    ]
  }
};

export default async function ReturnsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const page = content[locale];

  return (
    <main className="page">
      <SiteHeader locale={locale} />

      <article className="legal-page">
        <h1>{page.title}</h1>
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </article>

      <SiteFooter locale={locale} />
    </main>
  );
}
