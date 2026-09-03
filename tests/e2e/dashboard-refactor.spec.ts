import { expect, test } from "@playwright/test";

test("demo dashboard exposes bounded overages and clear score semantics", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/demo");

  await expect(page.getByText("Daily targets", { exact: true })).toBeVisible();
  await expect(page.getByText(/Times shown in America\/Mexico_City/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Switch to .* mode/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Exit demo / sign up" })).toBeVisible();

  const overageMeters = page.locator('[role="meter"][data-over-target="true"]');
  await expect(overageMeters.first()).toBeVisible();
  expect(await overageMeters.count()).toBeGreaterThan(0);

  const segmentWidthsAreBounded = await overageMeters.evaluateAll((meters) => meters.every((meter) => {
    const trackWidth = meter.getBoundingClientRect().width;
    const segmentWidth = Array.from(meter.children).reduce(
      (total, segment) => total + segment.getBoundingClientRect().width,
      0,
    );
    return segmentWidth <= trackWidth + 1;
  }));
  expect(segmentWidthsAreBounded).toBe(true);

  const score = page.getByTitle(/alignment score based on distance/).first();
  await expect(score).toContainText(/\d+%/);
  expect(browserErrors).toEqual([]);
});

test("timezone context lives in demo settings", async ({ page }) => {
  await page.goto("/demo/settings");
  await expect(page.getByText(/Dashboard and log times are shown in/)).toBeVisible();
  await expect(page.getByText("America/Mexico_City")).toBeVisible();
});
