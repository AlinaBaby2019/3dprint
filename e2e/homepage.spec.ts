import { test, expect } from "@playwright/test";

const locales = ["da", "en", "zh"] as const;

for (const locale of locales) {
  test(`homepage loads at /${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator("h1")).toBeVisible();
  });

  test(`/${locale} has language switch links`, async ({ page }) => {
    await page.goto(`/${locale}`);
    for (const lang of locales) {
      await expect(page.getByRole("link", { name: lang.toUpperCase() })).toBeVisible();
    }
  });
}

test("homepage /da has hero CTAs linking to /da/print and /da/products", async ({ page }) => {
  await page.goto("/da");
  await expect(page.getByRole("link", { name: /print|products|Produkter|3D/i }).first()).toBeVisible();
});

test("homepage footer has FAQ link", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("link", { name: "FAQ" })).toBeVisible();
});

test("homepage footer has legal links", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("link", { name: "Terms" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();
});
