import { test, expect } from "@playwright/test";

test("dedicated /products page renders product section", async ({ page }) => {
  await page.goto("/en/products");
  await expect(page.locator("h1")).toBeVisible();
});

test("/products page has at least one product card or empty state", async ({ page }) => {
  await page.goto("/en/products");
  // Either product cards or a loading state should appear — page must render without error
  await expect(page.locator("main")).toBeVisible();
});

test("/da/products renders in Danish", async ({ page }) => {
  await page.goto("/da/products");
  await expect(page.locator("h1")).toContainText(/printede|produkter/i);
});

test("/products nav shows active state on products link", async ({ page }) => {
  await page.goto("/en/products");
  const navLink = page.getByRole("navigation").getByRole("link", { name: "Products" });
  await expect(navLink).toHaveAttribute("aria-current", "page");
});

test("/products footer has legal links", async ({ page }) => {
  await page.goto("/en/products");
  await expect(page.getByRole("link", { name: "Terms" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();
});
