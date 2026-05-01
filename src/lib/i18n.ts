export const locales = ["da", "en", "zh"] as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const defaultLocale: Locale = "da";

export const dictionary = {
  da: {
    nav: {
      print: "3D print",
      products: "Produkter",
      orders: "Ordre",
      materials: "Materialer"
    },
    hero: {
      eyebrow: "Aarhus lokal service",
      title: "Lokal 3D print i Aarhus",
      subtitle:
        "Upload din model, vælg materiale og få et hurtigt prisestimat. Praktiske dele, prototyper og personlige produkter printet lokalt.",
      primary: "Start med en model",
      secondary: "Se produkter"
    },
    upload: {
      title: "Upload model",
      description: "STL, 3MF eller OBJ. Endelig pris bekræftes manuelt før print.",
      dropTitle: "Slip filen her",
      dropSubtitle: "Browser preview og filanalyse kommer i næste trin.",
      material: "Materiale",
      color: "Farve",
      quality: "Kvalitet",
      quantity: "Antal",
      delivery: "Levering",
      estimate: "Estimat",
      submit: "Send til vurdering"
    },
    products: {
      title: "Printede produkter",
      subtitle: "Praktiske produkter printet på bestilling i den farve du vælger."
    },
    materials: {
      title: "Materialer",
      subtitle: "Start med få lagerfarver og tydelige materialevalg."
    },
    orders: {
      title: "Tjek ordrestatus",
      placeholder: "Ordrenummer eller email",
      action: "Søg"
    }
  },
  en: {
    nav: {
      print: "3D print",
      products: "Products",
      orders: "Orders",
      materials: "Materials"
    },
    hero: {
      eyebrow: "Aarhus local service",
      title: "Local 3D printing in Aarhus",
      subtitle:
        "Upload a model, choose material, and get a fast estimate. Practical parts, prototypes, and custom products printed locally.",
      primary: "Start with a model",
      secondary: "Browse products"
    },
    upload: {
      title: "Upload model",
      description: "STL, 3MF, or OBJ. Final price is confirmed manually before printing.",
      dropTitle: "Drop your file here",
      dropSubtitle: "Browser preview and file analysis will be added next.",
      material: "Material",
      color: "Color",
      quality: "Quality",
      quantity: "Quantity",
      delivery: "Delivery",
      estimate: "Estimate",
      submit: "Send for review"
    },
    products: {
      title: "Printed products",
      subtitle: "Useful products printed on demand in the color you choose."
    },
    materials: {
      title: "Materials",
      subtitle: "Start with focused stock colors and clear material choices."
    },
    orders: {
      title: "Check order status",
      placeholder: "Order number or email",
      action: "Search"
    }
  },
  zh: {
    nav: {
      print: "3D 打印",
      products: "商品",
      orders: "订单",
      materials: "材料"
    },
    hero: {
      eyebrow: "奥胡斯本地服务",
      title: "奥胡斯本地 3D 打印",
      subtitle: "上传模型，选择材料，快速获得估价。本地打印实用零件、原型和个性化商品。",
      primary: "上传模型",
      secondary: "查看商品"
    },
    upload: {
      title: "上传模型",
      description: "支持 STL、3MF、OBJ。最终价格打印前人工确认。",
      dropTitle: "拖放文件到这里",
      dropSubtitle: "浏览器预览和文件分析会在下一步加入。",
      material: "材料",
      color: "颜色",
      quality: "质量",
      quantity: "数量",
      delivery: "交付",
      estimate: "估价",
      submit: "提交审核"
    },
    products: {
      title: "3D 打印成品",
      subtitle: "按单打印实用小物，可选择颜色。"
    },
    materials: {
      title: "材料",
      subtitle: "先用少量常备色和清晰材料分类启动。"
    },
    orders: {
      title: "查询订单状态",
      placeholder: "订单号或邮箱",
      action: "查询"
    }
  }
} as const;

export function getDictionary(locale: Locale) {
  return dictionary[locale];
}
