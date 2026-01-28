import { expect, test } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("DND Manager")).toBeVisible();
});
