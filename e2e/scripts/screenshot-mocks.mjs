import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const outDir = resolve(repoRoot, "docs", "mocks", "screenshots");

const PAGES = [
  "home",
  "itinerary",
  "activities",
  "restaurants",
  "saved",
  "events",
  "errand",
  "profile",
  "dialogs",
  "components",
];

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: 900 },
};

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox"],
  });

  try {
    for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      for (const slug of PAGES) {
        const url = `http://localhost:5173/pages/${slug}.html`;
        await page.goto(url, { waitUntil: "networkidle" });
        // Give custom-elements a tick to upgrade.
        await page.waitForTimeout(300);
        const file = resolve(outDir, `${slug}.${vpName}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`captured ${slug} @ ${vpName} -> ${file}`);
      }

      await context.close();
    }

    // Also capture the launcher index
    {
      const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
      const page = await context.newPage();
      await page.goto("http://localhost:5173/index.html", {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(200);
      const file = resolve(outDir, `index.desktop.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`captured index @ desktop -> ${file}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
