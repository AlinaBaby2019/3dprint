import { describe, it, expect } from "vitest";
import {
  submissionConfirmEmailHtml,
  quoteEmailHtml,
  orderStatusEmailHtml,
  orderConfirmationEmailHtml
} from "../email";

const baseSubmission = {
  projectTitle: "Test Bracket",
  projectRef: "abc12345",
  accountUrl: "https://example.com/en/account"
};

const baseQuote = {
  projectTitle: "Test Bracket",
  amountDkk: 150,
  customerNotes: null,
  expiresAt: null,
  expectedAt: null,
  acceptUrl: "https://example.com/en/account"
};

describe("submissionConfirmEmailHtml", () => {
  it("returns a non-empty HTML string for all locales", () => {
    for (const locale of ["en", "da", "zh"]) {
      const html = submissionConfirmEmailHtml({ ...baseSubmission, locale });
      expect(typeof html).toBe("string");
      expect(html.length).toBeGreaterThan(100);
      expect(html).toContain("<!DOCTYPE html>");
    }
  });

  it("includes project title in the output", () => {
    const html = submissionConfirmEmailHtml({ ...baseSubmission, locale: "en" });
    expect(html).toContain("Test Bracket");
  });

  it("includes Danish text for da locale", () => {
    const html = submissionConfirmEmailHtml({ ...baseSubmission, locale: "da" });
    expect(html).toContain("modtaget");
  });

  it("includes Chinese text for zh locale", () => {
    const html = submissionConfirmEmailHtml({ ...baseSubmission, locale: "zh" });
    expect(html).toContain("已收到");
  });
});

describe("quoteEmailHtml", () => {
  it("returns HTML for all locales without throwing", () => {
    for (const locale of ["en", "da", "zh"]) {
      expect(() => quoteEmailHtml({ ...baseQuote, locale })).not.toThrow();
    }
  });

  it("includes the amount in the output", () => {
    const html = quoteEmailHtml({ ...baseQuote, locale: "en" });
    expect(html).toContain("150");
  });
});

describe("orderStatusEmailHtml", () => {
  it("handles in_production status for all locales", () => {
    for (const locale of ["en", "da", "zh"]) {
      const html = orderStatusEmailHtml({
        orderId: "order-123",
        newStatus: "in_production",
        locale,
        accountUrl: "https://example.com/en/account"
      });
      expect(typeof html).toBe("string");
      expect(html.length).toBeGreaterThan(50);
    }
  });

  it("handles ready and fulfilled statuses", () => {
    for (const newStatus of ["ready", "fulfilled"] as const) {
      const html = orderStatusEmailHtml({
        orderId: "order-123",
        newStatus,
        locale: "en",
        accountUrl: "https://example.com/en/account"
      });
      expect(html.length).toBeGreaterThan(50);
    }
  });
});

describe("orderConfirmationEmailHtml", () => {
  it("returns HTML with order details for all locales", () => {
    for (const locale of ["en", "da", "zh"]) {
      const html = orderConfirmationEmailHtml({
        orderId: "order-abc123",
        totalDkk: 299,
        locale,
        accountUrl: "https://example.com/en/account"
      });
      expect(typeof html).toBe("string");
      expect(html).toContain("299");
    }
  });
});
