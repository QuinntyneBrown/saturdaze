// Traces to: L2-153, L2-154
import { test, expect } from "../../fixtures/sd-test.js";

const SITE = "https://www.saturdaze.ca";
const CSP =
  "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'";

test("Given the marketing page, then it carries its description, canonical, Open Graph and Twitter tags", async ({ page, goto, pages }) => {
  await goto("marketing");
  await pages.marketing.waitForReady();
  const marketing = pages.marketing;
  await expect(page).toHaveTitle("Saturdaze — Two days. Already planned.");
  expect(await marketing.meta("description")).toMatch(/weekend/i);
  expect(await marketing.meta("theme-color")).toBeTruthy();
  expect(await marketing.canonical()).toBe(`${SITE}/`);
  expect(await marketing.icon()).toBe("image/svg+xml");
  expect(await marketing.meta("og:type")).toBe("website");
  expect(await marketing.meta("og:url")).toBe(`${SITE}/`);
  expect(await marketing.meta("og:title")).toBe("Saturdaze — Two days. Already planned.");
  expect(await marketing.meta("og:description")).toBeTruthy();
  expect(await marketing.meta("og:image")).toBe(`${SITE}/assets/social-card.png`);
  expect(await marketing.meta("og:image:width")).toBe("1200");
  expect(await marketing.meta("og:image:height")).toBe("630");
  expect(await marketing.meta("og:image:alt")).toBeTruthy();
  expect(await marketing.meta("twitter:card")).toBe("summary_large_image");
  expect(await marketing.meta("twitter:image:alt")).toBeTruthy();
  expect((await marketing.file("/assets/social-card.png")).ok).toBe(true);
});

test("Given robots.txt and sitemap.xml, then search engines are let in and pointed at the page", async ({ pages }) => {
  const robots = await pages.marketing.file("/robots.txt");
  expect(robots.text).toContain("Allow: /");
  expect(robots.text).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  expect((await pages.marketing.file("/sitemap.xml")).text).toContain(`<loc>${SITE}/</loc>`);
});

test("Given any response from the site, then it carries the security headers", async ({ pages }) => {
  for (const path of ["/", "/assets/saturdaze.css", "/no-such-page"]) {
    const { headers } = await pages.marketing.file(path);
    expect(headers["content-security-policy"]).toBe(CSP);
    expect(headers["strict-transport-security"]).toMatch(/max-age=\d+/);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toBe("camera=(), geolocation=(), microphone=()");
  }
});

test("Given the strict policy, when the page loads, then nothing is blocked and nothing leaves its origin", async ({ page, goto, pages, baseURL }) => {
  const violations: string[] = [];
  const offsite: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) violations.push(message.text());
  });
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL!) && !request.url().startsWith("data:")) offsite.push(request.url());
  });
  await goto("marketing");
  await pages.marketing.waitForReady();
  await pages.marketing.screenshotReport();
  expect(violations).toEqual([]);
  expect(offsite).toEqual([]);
});
