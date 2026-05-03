import { test, expect } from "@playwright/test";

test("account page shows sign-in form when not authenticated", async ({ page }) => {
  await page.goto("/en/account");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Sign-in and create account tabs should be visible when not authenticated
  await expect(page.getByRole("tab", { name: /sign in/i }).or(page.getByText(/sign in/i)).first()).toBeVisible();
});

test("account page /da shows Danish sign-in text", async ({ page }) => {
  await page.goto("/da/account");
  await expect(page.getByText(/log ind/i)).toBeVisible();
});

test("account page /zh shows Chinese text", async ({ page }) => {
  await page.goto("/zh/account");
  await expect(page.getByText(/登录|邮箱/)).toBeVisible();
});

test("account page has back link to homepage", async ({ page }) => {
  await page.goto("/en/account");
  await expect(page.getByRole("link", { name: /aarhus 3d print/i })).toBeVisible();
});
