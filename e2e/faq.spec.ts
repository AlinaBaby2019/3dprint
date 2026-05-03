import { test, expect } from "@playwright/test";

const locales = ["da", "en", "zh"] as const;

for (const locale of locales) {
  test(`/faq page loads at /${locale}/faq`, async ({ page }) => {
    await page.goto(`/${locale}/faq`);
    await expect(page.locator("h1")).toBeVisible();
  });

  test(`/${locale}/faq has FAQ items`, async ({ page }) => {
    await page.goto(`/${locale}/faq`);
    // Should have multiple FAQ article cards
    const items = page.locator(".faq-item");
    await expect(items.first()).toBeVisible();
    expect(await items.count()).toBeGreaterThan(3);
  });
}

test("/en/faq has CTA links to print and products", async ({ page }) => {
  await page.goto("/en/faq");
  await expect(page.getByRole("link", { name: /3D print/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /products/i })).toBeVisible();
});

test("/faq nav link is active when on FAQ page", async ({ page }) => {
  await page.goto("/en/faq");
  const faqNavLink = page.getByRole("navigation").getByRole("link", { name: "FAQ" });
  await expect(faqNavLink).toHaveAttribute("aria-current", "page");
});
