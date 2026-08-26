import { expect, test, type Page } from "@playwright/test";
import { addDays, format } from "date-fns";

const primaryEmail = process.env.E2E_EMAIL;
const primaryPassword = process.env.E2E_PASSWORD;
const demoEmail = process.env.E2E_DEMO_EMAIL;
const demoPassword = process.env.E2E_DEMO_PASSWORD;
const runId = Date.now().toString().slice(-7);
const mealTitle = `E2E chicken bowl ${runId}`;
const customFoodName = `E2E protein shake ${runId}`;
const activityMinutes = 100 + Number(runId.slice(-3));

test.setTimeout(90_000);

async function signIn(page: Page, email: string | undefined, password: string | undefined) {
  if (!email || !password) throw new Error("E2E credentials are required. See README.md.");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole("heading", { name: /Wednesday|Thursday|Friday|Saturday|Sunday|Monday|Tuesday/ })).toBeVisible();
}

test.describe.serial("core tracking loop", () => {
  test("authentication, goals, logs, grading, edit recalculation, and history", async ({ page }) => {
    await page.goto("/today");
    await expect(page).toHaveURL(/\/login$/);
    await signIn(page, primaryEmail, primaryPassword);

    await page.goto("/settings?tab=goals");
    await page.getByLabel("Calories").fill("2200");
    await page.getByLabel("Protein (g)").fill("160");
    await page.getByLabel("Carbohydrates (g)").fill("240");
    await page.getByLabel("Fat (g)").fill("70");
    await page.getByLabel("Fiber (g)").fill("30");
    await page.getByLabel("Water (ml)").fill("2800");
    await page.getByLabel("Daily steps").fill("10000");
    await page.getByLabel("Weekly workouts").fill("4");
    await page.getByRole("button", { name: "Save goals" }).click();
    await expect(page.getByText("Goals saved as a new effective period.")).toBeVisible();

    await page.goto("/log/food");
    await page.getByLabel("What did you eat?").fill(mealTitle);
    await page.getByLabel("Portion").fill("1 bowl");
    await page.getByLabel("Calories").fill("720");
    await page.getByLabel("Protein").fill("58");
    await page.getByLabel("Carbs").fill("76");
    await page.getByLabel("Fat").fill("19");
    await page.getByLabel("Fiber").fill("9");
    await page.getByRole("checkbox", { name: "Save as a reusable meal" }).check();
    await page.getByRole("button", { name: "Save meal" }).click();
    await expect(page).toHaveURL(/\/today$/);
    const mealLink = page.getByRole("link", { name: new RegExp(mealTitle) });
    await expect(mealLink).toBeVisible();
    await expect(mealLink).toContainText("Meal score");

    await page.goto("/log/food");
    await page.getByRole("button", { name: "Log again" }).first().click();
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByText(mealTitle)).toHaveCount(2);

    await page.goto("/settings?tab=foods");
    await page.getByLabel("Name").fill(customFoodName);
    await page.getByLabel("Serving").fill("1 shaker");
    await page.getByLabel("Calories").fill("390");
    await page.getByLabel("Protein (g)").fill("46");
    await page.getByLabel("Carbs (g)").fill("31");
    await page.getByLabel("Fat (g)").fill("10");
    await page.getByLabel("Fiber (g)").fill("7");
    await page.getByRole("button", { name: "Save custom food" }).click();
    await expect(page.getByText("Custom food saved.")).toBeVisible();
    await page.goto("/log/food");
    await page.getByRole("link", { name: customFoodName }).click();
    await expect(page.getByLabel("What did you eat?")).toHaveValue(customFoodName);
    await page.getByRole("button", { name: "Save meal" }).click();
    await expect(page.getByText(customFoodName)).toBeVisible();

    await page.getByRole("button", { name: "+500" }).click();
    await expect(page.getByText(/[\d,]+ml of 2,800ml/)).toBeVisible();
    await page.goto("/log/activity");
    await page.getByLabel("Duration (minutes)").fill(String(activityMinutes));
    await page.getByLabel("Steps").fill("8500");
    await page.getByRole("button", { name: "Add activity" }).click();
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole("link", { name: new RegExp(`walking ${activityMinutes} min`) })).toBeVisible();

    await page.getByRole("button", { name: /Finish day|Recalculate finished day/ }).click();
    await expect(page.getByText("Finished day", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Why this score?" })).toBeVisible();

    await page.getByRole("link", { name: new RegExp(mealTitle) }).first().click();
    await expect(page.getByRole("heading", { name: "Edit meal" })).toBeVisible();
    await page.getByLabel("Calories").fill("760");
    await page.getByRole("button", { name: "Update meal" }).click();
    await expect(page.getByText("Finished day", { exact: true })).toBeVisible();
    await expect(page.getByText("Review update in progress")).toHaveCount(0);

    await page.goto("/history");
    await expect(page.getByText(mealTitle)).toHaveCount(2);
    await expect(page.getByLabel("Choose history date")).toBeVisible();
  });
});

test.describe.serial("seeded analytics and responsive UI", () => {
  test("weekly and monthly reviews use seeded evidence", async ({ page }) => {
    await signIn(page, demoEmail, demoPassword);
    await page.goto("/settings?tab=data");
    await page.getByRole("button", { name: /Add demo data/ }).click();
    await expect(page.getByText(/Added 35 days|Demo data is already present/)).toBeVisible({ timeout: 30_000 });

    const priorWeek = format(addDays(new Date(), -7), "yyyy-MM-dd");
    await page.goto(`/weekly?date=${priorWeek}`);
    await expect(page.getByText("Weekly review").first()).toBeVisible();
    await expect(page.getByText("Your period review")).toBeVisible();
    await expect(page.getByText("Pattern insights")).toBeVisible();
    await expect(page.getByText(/Water target opportunity|Weekend pattern/).first()).toBeVisible();

    await page.goto("/monthly");
    await expect(page.getByText("Monthly review").first()).toBeVisible();
    await expect(page.getByText("Your period review")).toBeVisible();
    await expect(page.getByText("Weekly score trend")).toBeVisible();
    await expect(page.getByText("Weight trend")).toBeVisible();
  });

  test("mobile primary logging screen has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await signIn(page, demoEmail, demoPassword);
    await page.goto("/log/food");
    await expect(page.getByRole("heading", { name: "What did you eat?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save meal" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
