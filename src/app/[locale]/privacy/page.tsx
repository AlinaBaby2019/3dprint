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
  const titles: Record<string, string> = { da: "Privatlivspolitik – Aarhus 3D Print", en: "Privacy policy – Aarhus 3D Print", zh: "隐私政策 – Aarhus 3D Print" };
  return { title: titles[rawLocale], robots: { index: false, follow: false } };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const content: Record<Locale, { title: string; sections: { heading: string; body: string }[] }> = {
  da: {
    title: "Privatlivspolitik",
    sections: [
      {
        heading: "1. Dataansvarlig",
        body: "Aarhus 3D Print er dataansvarlig for de personoplysninger, vi indsamler. Kontakt os på den email, der er angivet på hjemmesiden, hvis du har spørgsmål til behandlingen af dine personoplysninger."
      },
      {
        heading: "2. Hvilke oplysninger indsamler vi",
        body: "Vi indsamler de oplysninger, du selv giver os: navn, email, leveringsadresse, telefonnummer samt de filer du uploader som led i din ordre. Vi registrerer desuden ordrehistorik og betalingsstatus til brug for ordrebehandling."
      },
      {
        heading: "3. Formål med behandlingen",
        body: "Dine oplysninger bruges til: at behandle og levere din ordre, at sende kvitteringer og statusopdateringer, at give dig adgang til din ordrehistorik og dine projekter, samt at overholde vores juridiske forpligtelser."
      },
      {
        heading: "4. Retsgrundlag",
        body: "Vi behandler dine personoplysninger på grundlag af opfyldelse af kontrakt (GDPR artikel 6, stk. 1, litra b), når behandlingen er nødvendig for at levere den service, du har bestilt. I øvrige tilfælde behandler vi på grundlag af legitim interesse eller lovkrav."
      },
      {
        heading: "5. Opbevaring og sletning",
        body: "Uploadede modelfiler opbevares, så længe ordren er aktiv. Du kan anmode om sletning af dine data ved at kontakte os. Bogføringsrelevante oplysninger som ordredata og betalingsoplysninger opbevares i 5 år i henhold til bogføringsloven."
      },
      {
        heading: "6. Deling med tredjepart",
        body: "Vi deler ikke dine personoplysninger med tredjepart til markedsføringsformål. Vi anvender følgende databehandlere: Supabase (database og fillagring), Stripe (betalingsbehandling) og den e-mailudbyder, vi anvender til transaktionelle beskeder. Alle behandlere er underlagt databehandleraftaler."
      },
      {
        heading: "7. Dine rettigheder",
        body: "Du har ret til indsigt i, berigtigelse af og sletning af dine personoplysninger, ret til at begrænse behandlingen, ret til dataportabilitet samt ret til at gøre indsigelse mod behandlingen. Kontakt os for at udøve disse rettigheder. Du kan klage til Datatilsynet (www.datatilsynet.dk)."
      },
      {
        heading: "8. Cookies",
        body: "Vi bruger udelukkende nødvendige cookies til autentificering og sessionshåndtering. Vi anvender ikke tredjeparts trackingcookies eller analysecookies."
      }
    ]
  },
  en: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "1. Data Controller",
        body: "Aarhus 3D Print is the data controller for the personal data we collect. Contact us at the email address listed on the website if you have questions about how we process your personal data."
      },
      {
        heading: "2. What Data We Collect",
        body: "We collect information you provide to us: name, email, delivery address, phone number, and the files you upload as part of your order. We also record order history and payment status for order processing."
      },
      {
        heading: "3. Purpose of Processing",
        body: "Your data is used to: process and deliver your order, send receipts and status updates, give you access to your order history and projects, and comply with our legal obligations."
      },
      {
        heading: "4. Legal Basis",
        body: "We process your personal data on the basis of contract performance (GDPR Article 6(1)(b)) when processing is necessary to deliver the service you have ordered. In other cases we process on the basis of legitimate interest or legal requirement."
      },
      {
        heading: "5. Retention and Deletion",
        body: "Uploaded model files are retained while your order is active. You can request deletion of your data by contacting us. Accounting-relevant data such as order data and payment details are retained for 5 years in accordance with bookkeeping regulations."
      },
      {
        heading: "6. Sharing with Third Parties",
        body: "We do not share your personal data with third parties for marketing purposes. We use the following data processors: Supabase (database and file storage), Stripe (payment processing), and the email provider we use for transactional messages. All processors are subject to data processing agreements."
      },
      {
        heading: "7. Your Rights",
        body: "You have the right to access, rectify, and delete your personal data, the right to restrict processing, the right to data portability, and the right to object to processing. Contact us to exercise these rights. You may lodge a complaint with the Danish Data Protection Agency (www.datatilsynet.dk)."
      },
      {
        heading: "8. Cookies",
        body: "We use only necessary cookies for authentication and session management. We do not use third-party tracking or analytics cookies."
      }
    ]
  },
  zh: {
    title: "隐私政策",
    sections: [
      {
        heading: "1. 数据控制者",
        body: "Aarhus 3D Print 是我们收集的个人数据的数据控制者。如您对我们处理个人数据有疑问，请通过网站上列出的电子邮件地址联系我们。"
      },
      {
        heading: "2. 我们收集的数据",
        body: "我们收集您提供的信息：姓名、电子邮件、送货地址、电话号码，以及您作为订单一部分上传的文件。我们还记录订单历史和支付状态用于订单处理。"
      },
      {
        heading: "3. 处理目的",
        body: "您的数据用于：处理和交付您的订单、发送收据和状态更新、让您访问订单历史和项目，以及遵守我们的法律义务。"
      },
      {
        heading: "4. 法律依据",
        body: "我们依据合同履行（GDPR 第 6 条第 1 款 b 项）处理您的个人数据，即当处理是交付您所订购服务所必需时。在其他情况下，我们依据合法利益或法律要求进行处理。"
      },
      {
        heading: "5. 保留与删除",
        body: "上传的模型文件在您的订单有效期间保留。您可以通过联系我们请求删除您的数据。与会计相关的数据（如订单数据和支付详情）根据记账法规保留 5 年。"
      },
      {
        heading: "6. 与第三方共享",
        body: "我们不会将您的个人数据与第三方共享用于营销目的。我们使用以下数据处理商：Supabase（数据库和文件存储）、Stripe（支付处理）以及用于事务性消息的电子邮件提供商。所有处理商均受数据处理协议约束。"
      },
      {
        heading: "7. 您的权利",
        body: "您有权访问、更正和删除您的个人数据，有权限制处理，有权获得数据可携性，以及有权反对处理。请联系我们以行使这些权利。您可以向丹麦数据保护局（www.datatilsynet.dk）投诉。"
      },
      {
        heading: "8. Cookie",
        body: "我们仅使用用于身份验证和会话管理的必要 Cookie。我们不使用第三方跟踪或分析 Cookie。"
      }
    ]
  }
};

export default async function PrivacyPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

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
