import { expect, test } from "@playwright/test";

test("login actions form one vertical group without the diagonal artifact", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/login");

  const email = page.getByLabel("Email");
  const password = page.getByLabel("Password", { exact: true });
  const submit = page.getByRole("button", { name: "Sign in", exact: true });
  const demo = page.getByRole("link", { name: "Explore the public demo" });

  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await expect(submit).toBeVisible();
  await expect(demo).toBeVisible();

  const boxes = await Promise.all([
    email.boundingBox(),
    password.boundingBox(),
    submit.boundingBox(),
    demo.boundingBox(),
  ]);
  const [emailBox, passwordBox, submitBox, demoBox] = boxes;
  expect(emailBox && passwordBox && submitBox && demoBox).toBeTruthy();
  expect(emailBox!.y).toBeLessThan(passwordBox!.y);
  expect(passwordBox!.y).toBeLessThan(submitBox!.y);
  expect(submitBox!.y).toBeLessThan(demoBox!.y);
  expect(Math.abs(submitBox!.width - passwordBox!.width)).toBeLessThanOrEqual(1);

  const visualPanel = page.locator("main > div").first();
  await expect(visualPanel.locator("svg line")).toHaveCount(0);

  const fonts = await page.getByRole("heading", { name: "Login" }).evaluate((heading) => ({
    heading: getComputedStyle(heading).fontFamily,
    body: getComputedStyle(document.body).fontFamily,
  }));
  expect(fonts.heading).toBe(fonts.body);

  await email.focus();
  const focusedInput = await email.evaluate((input) => {
    const style = getComputedStyle(input);
    return {
      backgroundColor: style.backgroundColor,
      outlineStyle: style.outlineStyle,
    };
  });
  expect(focusedInput.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(focusedInput.outlineStyle).toBe("none");

  const animatedLabel = submit.locator("span").first();
  expect(await animatedLabel.evaluate((label) => getComputedStyle(label).transitionDuration)).not.toBe("0s");

  await submit.hover();
  await page.waitForTimeout(350);
  const [submitAfterHover, floodAfterHover] = await Promise.all([
    submit.boundingBox(),
    submit.locator(":scope > span").first().boundingBox(),
  ]);
  expect(submitAfterHover && floodAfterHover).toBeTruthy();
  // The two-pixel difference is the button's one-pixel border on each side.
  expect(Math.abs(floodAfterHover!.width - submitAfterHover!.width)).toBeLessThanOrEqual(2);

  const modeToggle = page.getByRole("button", { name: "Create an account" });
  await modeToggle.hover();
  await page.waitForTimeout(350);
  expect(await modeToggle.evaluate((element) => Number.parseFloat(getComputedStyle(element, "::after").scale)))
    .toBe(1);

  await demo.hover();
  await page.waitForTimeout(350);
  expect(await demo.evaluate((element) => Number.parseFloat(getComputedStyle(element, "::after").scale)))
    .toBe(1);
  expect(browserErrors).toEqual([]);
});

test("mobile login retains the same compact action hierarchy", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/login");

  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore the public demo" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
