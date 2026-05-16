import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:4200/profile");
await page.waitForSelector("sd-section", { state: "attached", timeout: 8000 });
await page.waitForTimeout(2000);
const html = await page.evaluate(() => {
  const section = document.querySelector('sd-section[title="Who\'s in"]');
  if (!section) return "NO SECTION";
  const row = section.querySelector('sd-list-item[title="Quinn"]');
  if (!row) return "NO ROW";
  return row.outerHTML.slice(0, 2000);
});
console.log(html);
await browser.close();
