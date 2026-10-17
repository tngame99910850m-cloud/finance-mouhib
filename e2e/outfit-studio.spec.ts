import { test, expect } from "@playwright/test";

// Deterministic smoke test against the real (but synthetic/local) demo
// catalog — every item here is `isDemo: true` and self-contained, so this
// never depends on the real avatar/garment assets the app owner hasn't
// supplied yet. The missing-avatar case is covered by the app's own
// dev-placeholder UI, which this test also asserts is shown.

test("open studio, build an outfit, save it, and reopen it after reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Studio" }).first()).toBeVisible();

  await page.goto("/studio");

  // No real avatar.glb is present in this environment, so the dev
  // placeholder banner must be visible instead of a silent failure.
  await expect(page.getByText(/placeholder/i).first()).toBeVisible();

  // Select a top.
  await page.getByRole("tab", { name: "Tops" }).click();
  await page.getByRole("button", { name: "Select Silk Blouse" }).click();
  await expect(page.getByRole("button", { name: "Select Silk Blouse" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Silk Blouse").first()).toBeVisible();

  // Change its color where supported.
  await page.getByRole("button", { name: "Blush" }).click();
  await expect(page.getByRole("button", { name: "Blush" })).toHaveAttribute("aria-pressed", "true");

  // Remove the item.
  await page.getByRole("button", { name: "Remove Silk Blouse" }).click();
  await expect(page.getByText("Nothing selected yet")).toBeVisible();

  // Rebuild a small outfit to save.
  await page.getByRole("button", { name: "Select Silk Blouse" }).click();
  await page.getByRole("tab", { name: "Bottoms" }).click();
  await page.getByRole("button", { name: "Select Denim Jeans" }).click();

  // Save it.
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByPlaceholder("e.g. Friday Dinner").fill("E2E Smoke Outfit");
  await page.getByRole("button", { name: "Save outfit" }).click();

  await expect(page).toHaveURL(/\/studio\?edit=/);

  // Reload the page — the outfit must restore from persistence, not
  // from any transient in-memory UI state.
  await page.reload();
  await expect(page.getByText("Silk Blouse").first()).toBeVisible();
  await expect(page.getByText("Denim Jeans").first()).toBeVisible();

  // Reopen it from the Saved list too.
  await page.goto("/saved");
  await expect(page.getByText("E2E Smoke Outfit").first()).toBeVisible();
  await page.getByRole("link", { name: "Open in Studio" }).first().click();
  await expect(page).toHaveURL(/\/studio\?edit=/);
  await expect(page.getByText("Silk Blouse").first()).toBeVisible();
});
