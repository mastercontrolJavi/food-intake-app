// Audit capture: screenshots the running Intake app (public /demo routes + login).
// Run from the app root so playwright resolves from the app's node_modules:
//   node video/scripts/capture-app.mjs http://localhost:3000 video/audit/screens
import { chromium } from "playwright";
import path from "node:path";

const base = process.argv[2] || "http://localhost:3000";
const out = process.argv[3] || "video/audit/screens";

const routes = [
  ["login", "/login"],
  ["demo-today", "/demo"],
  ["demo-history", "/demo/history"],
  ["demo-weekly", "/demo/weekly"],
  ["demo-monthly", "/demo/monthly"],
  ["demo-settings", "/demo/settings"],
];

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  for (const [scheme] of [["light"], ["dark"]]) {
    for (const [vpName, viewport, scale] of [["desktop", { width: 1440, height: 900 }, 2], ["mobile", { width: 390, height: 844 }, 3]]) {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, colorScheme: scheme });
      const page = await ctx.newPage();
      for (const [name, route] of routes) {
        if (name === "login" && scheme === "dark") continue; // login is always dark
        await page.goto(base + route, { waitUntil: "networkidle" });
        await page.waitForTimeout(600);
        const file = path.join(out, `${name}-${vpName}-${scheme}.png`) // converted to .jpg afterwards;
        await page.screenshot({ path: file, fullPage: true });
        console.log(file);
      }
      if (vpName === "desktop") {
        await page.goto(base + "/demo", { waitUntil: "networkidle" });
        await page.getByRole("button", { name: /Why this score/ }).click();
        await page.waitForTimeout(500);
        const file = path.join(out, `demo-score-dialog-${vpName}-${scheme}.png`);
        await page.screenshot({ path: file });
        console.log(file);
      }
      await ctx.close();
    }
  }
  await browser.close();
})();
