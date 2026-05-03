import { test, expect } from "@playwright/test";

test("dedicated /print page renders upload form", async ({ page }) => {
  await page.goto("/en/print");
  await expect(page.locator("h1")).toBeVisible();
  // Upload dropzone should be present
  await expect(page.getByText(/drop|upload/i).first()).toBeVisible();
});

test("/print page has process steps panel", async ({ page }) => {
  await page.goto("/en/print");
  await expect(page.getByText("01")).toBeVisible();
  await expect(page.getByText("02")).toBeVisible();
  await expect(page.getByText("03")).toBeVisible();
});

test("/print page has material selector", async ({ page }) => {
  await page.goto("/en/print");
  await expect(page.locator("select").first()).toBeVisible();
});

test("/da/print renders in Danish", async ({ page }) => {
  await page.goto("/da/print");
  await expect(page.locator("h1")).toContainText(/upload/i);
});

test("/print nav shows active state on print link", async ({ page }) => {
  await page.goto("/en/print");
  const navLink = page.getByRole("navigation").getByRole("link", { name: "3D print" });
  await expect(navLink).toHaveAttribute("aria-current", "page");
});
