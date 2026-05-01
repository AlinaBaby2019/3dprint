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
      materials: "Materialer",
      account: "Konto"
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
    },
    account: {
      title: "Konto",
      subtitle: "Log ind for at sende filer til vurdering og følge dine projekter.",
      email: "Email",
      password: "Adgangskode",
      confirmPassword: "Gentag adgangskode",
      signIn: "Log ind",
      signUp: "Opret konto",
      signOut: "Log ud",
      modeSignIn: "Log ind",
      modeSignUp: "Opret konto",
      signUpHelp: "Udfyld email og adgangskode, og tryk Opret konto.",
      signInHelp: "Har du allerede en konto, kan du logge ind her.",
      passwordMismatch: "Adgangskoderne er ikke ens."
    }
  },
  en: {
    nav: {
      print: "3D print",
      products: "Products",
      orders: "Orders",
      materials: "Materials",
      account: "Account"
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
    },
    account: {
      title: "Account",
      subtitle: "Sign in to send files for review and track your projects.",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      signIn: "Sign in",
      signUp: "Create account",
      signOut: "Sign out",
      modeSignIn: "Sign in",
      modeSignUp: "Create account",
      signUpHelp: "Enter an email and password, then press Create account.",
      signInHelp: "Already have an account? Sign in here.",
      passwordMismatch: "Passwords do not match."
    }
  },
  zh: {
    nav: {
      print: "3D 打印",
      products: "商品",
      orders: "订单",
      materials: "材料",
      account: "账户"
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
    },
    account: {
      title: "账户",
      subtitle: "登录后可以提交文件审核并查看项目进度。",
      email: "邮箱",
      password: "密码",
      confirmPassword: "确认密码",
      signIn: "登录",
      signUp: "注册",
      signOut: "退出",
      modeSignIn: "登录",
      modeSignUp: "注册",
      signUpHelp: "填写邮箱和密码，然后点击注册。",
      signInHelp: "已有账户可以在这里登录。",
      passwordMismatch: "两次输入的密码不一致。"
    }
  }
} as const;

export function getDictionary(locale: Locale) {
  return dictionary[locale];
}
