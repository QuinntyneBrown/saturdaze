// One-off: capture the three new public mock pages (splash / login /
// signup) at mobile / tablet / desktop and drop them into
// docs/mocks/screenshots/. Mirrors screenshot-mocks.mjs but:
//   - doesn't hardcode a Linux chromium path (uses Playwright's bundled find)
//   - spins up its own tiny static server so it can be run standalone

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const mocksDir = resolve(repoRoot, "docs", "mocks");
const outDir = resolve(mocksDir, "screenshots");

const PAGES = [
  "splash",
  "login",
  "signup",
  "forgot-password",
  "check-email",
  "reset-password",
  "verify-email",
];

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: 900 },
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

function startServer(root) {
  const server = createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
    if (urlPath.endsWith("/")) urlPath += "index.html";
    const filePath = join(root, urlPath);
    try {
      const s = statSync(filePath);
      if (!s.isFile()) throw new Error("not a file");
      res.writeHead(200, {
        "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream",
      });
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });
  return new Promise((resolveP) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolveP({ server, port });
    });
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const { server, port } = await startServer(mocksDir);
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();

  try {
    for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      for (const slug of PAGES) {
        await page.goto(`${base}/pages/${slug}.html`, {
          waitUntil: "networkidle",
        });
        await page.waitForTimeout(300);
        const file = resolve(outDir, `${slug}.${vpName}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`captured ${slug} @ ${vpName} -> ${file}`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
