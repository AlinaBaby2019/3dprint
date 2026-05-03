import { describe, it, expect } from "vitest";
import { dictionary, getDictionary, isLocale, locales, defaultLocale } from "../i18n";

describe("isLocale", () => {
  it("accepts valid locale codes", () => {
    expect(isLocale("da")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("zh")).toBe(true);
  });

  it("rejects invalid locale codes", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale("EN")).toBe(false);
    expect(isLocale("de")).toBe(false);
  });
});

describe("getDictionary", () => {
  it("returns Danish dictionary for da", () => {
    const t = getDictionary("da");
    expect(t.nav.print).toBe("3D print");
    expect(t.hero.title).toContain("Aarhus");
  });

  it("returns English dictionary for en", () => {
    const t = getDictionary("en");
    expect(t.nav.print).toBe("3D print");
    expect(t.account.signIn).toBe("Sign in");
  });

  it("returns Chinese dictionary for zh", () => {
    const t = getDictionary("zh");
    expect(t.nav.account).toBe("账户");
    expect(t.account.signIn).toBe("登录");
  });
});

describe("dictionary completeness", () => {
  it("all locales have the same top-level keys", () => {
    const daKeys = Object.keys(dictionary.da).sort();
    const enKeys = Object.keys(dictionary.en).sort();
    const zhKeys = Object.keys(dictionary.zh).sort();
    expect(enKeys).toEqual(daKeys);
    expect(zhKeys).toEqual(daKeys);
  });

  it("all locales have the same nav keys", () => {
    const daNavKeys = Object.keys(dictionary.da.nav).sort();
    const enNavKeys = Object.keys(dictionary.en.nav).sort();
    const zhNavKeys = Object.keys(dictionary.zh.nav).sort();
    expect(enNavKeys).toEqual(daNavKeys);
    expect(zhNavKeys).toEqual(daNavKeys);
  });

  it("all locales have statuses for the same keys", () => {
    const daStatusKeys = Object.keys(dictionary.da.account.statuses).sort();
    const enStatusKeys = Object.keys(dictionary.en.account.statuses).sort();
    const zhStatusKeys = Object.keys(dictionary.zh.account.statuses).sort();
    expect(enStatusKeys).toEqual(daStatusKeys);
    expect(zhStatusKeys).toEqual(daStatusKeys);
  });

  it("all locales have faq items", () => {
    for (const locale of locales) {
      const t = getDictionary(locale);
      expect(t.faq.items.length).toBeGreaterThan(0);
      expect(t.faq.title).toBeTruthy();
    }
  });

  it("defaultLocale is in the locales list", () => {
    expect(locales).toContain(defaultLocale);
  });
});
