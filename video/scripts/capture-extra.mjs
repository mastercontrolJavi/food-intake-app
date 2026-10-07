// Extra audit captures: fully graded prior periods (current week/month are partial).
import { chromium } from "playwright";
import path from "node:path";
const base = process.argv[2] || "http://localhost:3000";
const out = process.argv[3] || "video/audit/screens";
const routes = [
  ["demo-weekly-fullweek", "/demo/weekly?date=2026-09-28"],
  ["demo-monthly-september", "/demo/monthly?date=2026-09-15"],
  ["demo-history-lowday", "/demo/history?date=2026-10-02"],
];
(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  for (const scheme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: scheme });
    const page = await ctx.newPage();
    for (const [name, route] of routes) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const file = path.join(out, `${name}-desktop-${scheme}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(file);
    }
    await ctx.close();
  }
  await browser.close();
})();
