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
  const titles: Record<string, string> = { da: "Upload-politik – Aarhus 3D Print", en: "Upload policy – Aarhus 3D Print", zh: "上传政策 – Aarhus 3D Print" };
  return { title: titles[rawLocale], robots: { index: false, follow: false } };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const content: Record<Locale, { title: string; sections: { heading: string; body: string }[] }> = {
  da: {
    title: "Politik for uploadede filer",
    sections: [
      {
        heading: "1. Rettigheder til modeller",
        body: "Du bekræfter, at du har de nødvendige rettigheder til at uploade, fremstille og distribuere de 3D-modeller og filer, du sender til os. Dette inkluderer egne designs, modeller under åben licens og modeller, du har erhvervet lovligt."
      },
      {
        heading: "2. Forbudt indhold",
        body: "Vi accepterer ikke upload af ophavsretligt beskyttet materiale uden tilladelse, modeller til ulovlige formål, seksuelt eksplicit indhold, modeller der afbilder vold eller hadefuldt indhold, eller filer der indeholder malware eller skadelig kode."
      },
      {
        heading: "3. Gennemgang og afvisning",
        body: "Alle uploadede modeller gennemgås manuelt, inden vi afgiver et endeligt tilbud. Vi forbeholder os retten til at afvise ordrer uden begrundelse. Betaling opkræves ikke, før et tilbud er accepteret af dig."
      },
      {
        heading: "4. Opbevaring af filer",
        body: "Dine uploadede filer gemmes sikkert og bruges udelukkende til at producere din ordre. Vi deler ikke dine filer med tredjepart. Filer kan slettes på din anmodning efter ordrens afslutning."
      },
      {
        heading: "5. Ansvar",
        body: "Du er ansvarlig for lovligheden af det materiale, du uploader. Aarhus 3D Print påtager sig intet ansvar for krænkelse af tredjeparts rettigheder forårsaget af materiale leveret af kunden."
      }
    ]
  },
  en: {
    title: "Upload File Policy",
    sections: [
      {
        heading: "1. Rights to models",
        body: "You confirm that you have the necessary rights to upload, manufacture, and distribute the 3D models and files you send to us. This includes your own designs, models under open licenses, and models you have legally acquired."
      },
      {
        heading: "2. Prohibited content",
        body: "We do not accept uploads of copyrighted material without permission, models for illegal purposes, sexually explicit content, models depicting violence or hateful content, or files containing malware or harmful code."
      },
      {
        heading: "3. Review and rejection",
        body: "All uploaded models are reviewed manually before we provide a final quote. We reserve the right to reject orders without explanation. Payment is not charged until a quote has been accepted by you."
      },
      {
        heading: "4. File storage",
        body: "Your uploaded files are stored securely and used solely to produce your order. We do not share your files with third parties. Files can be deleted upon your request after the order is complete."
      },
      {
        heading: "5. Responsibility",
        body: "You are responsible for the legality of the material you upload. Aarhus 3D Print accepts no liability for infringement of third-party rights caused by material provided by the customer."
      }
    ]
  },
  zh: {
    title: "文件上传政策",
    sections: [
      {
        heading: "1. 模型版权",
        body: "您确认您拥有上传、制作和分发所提交3D模型及文件的必要权利，包括您自己的设计、开放许可证下的模型以及合法获得的模型。"
      },
      {
        heading: "2. 禁止内容",
        body: "我们不接受未经授权的受版权保护材料、用于非法目的的模型、色情内容、描绘暴力或仇恨内容的模型，以及包含恶意软件或有害代码的文件。"
      },
      {
        heading: "3. 审核与拒绝",
        body: "所有上传的模型在我们提供最终报价之前都会经过人工审核。我们保留无需说明理由拒绝订单的权利。在您接受报价之前不会收取任何费用。"
      },
      {
        heading: "4. 文件存储",
        body: "您上传的文件将被安全存储，仅用于生产您的订单。我们不会与第三方共享您的文件。订单完成后，您可以申请删除文件。"
      },
      {
        heading: "5. 责任",
        body: "您对所上传材料的合法性负责。Aarhus 3D Print对客户提供的材料所引起的第三方权利侵犯不承担任何责任。"
      }
    ]
  }
};

export default async function UploadPolicyPage({ params }: PageProps) {
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
