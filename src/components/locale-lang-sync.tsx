"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n";

export function LocaleLangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);
  return null;
}
