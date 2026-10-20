import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Marketing site — marketing/index.html at www.saturdaze.ca (ADR-018), and its
 * mock pages/marketing.html.
 *
 *   header.site-header   .brand · nav.desktop-nav (3 anchors) · .nav-cta "Open the app"
 *                        · button.menu-button · nav#mobile-menu
 *   main#main
 *     section.hero#top   h1.hero__title · "Create your account" · .hero__note · "See how it works"
 *     section#watch      h2 · figure.video-block > video
 *     section#how        h2 · ol.steps > li.step × 3
 *     section#screens    h2 · .feature-card × 4 (img)
 *     section#families   h2 · .bento > .card × 4
 *     section.final-cta  h2 · "Create your account" · "Sign in"
 *   footer.site-footer   Terms · Privacy · Sign in · [data-year]
 */
export class MarketingPage extends BasePage {
  readonly slug: PageSlug = "marketing";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".hero__title");
  }

  header(): Locator {
    return this.page.locator(".site-header");
  }

  heading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  get hero(): Locator {
    return this.page.locator(".hero");
  }

  heroCreateAccount(): Locator {
    return this.hero.getByRole("link", { name: "Create your account" });
  }

  heroNote(): Locator {
    return this.hero.locator(".hero__note");
  }

  seeHowItWorks(): Locator {
    return this.hero.getByRole("link", { name: "See how it works" });
  }

  headerOpenTheApp(): Locator {
    return this.page.locator(".site-header .nav-cta");
  }

  /** The level-2 headings of the page's sections, in order. */
  sectionHeadings(): Locator {
    return this.page.getByRole("main").getByRole("heading", { level: 2 });
  }

  /** The "Try it free" links under the section headings. */
  sectionTryItFree(): Locator {
    return this.page.locator(".band-heading").getByRole("link", { name: "Try it free" });
  }

  steps(): Locator {
    return this.page.locator("#how").getByRole("listitem");
  }

  stepTitles(): Locator {
    return this.steps().getByRole("heading", { level: 3 });
  }

  familyCards(): Locator {
    return this.page.locator("#families").getByRole("heading", { level: 3 });
  }

  finalLink(name: string): Locator {
    return this.page.locator(".final-cta").getByRole("link", { name, exact: true });
  }

  /** The footer as assistive technology sees it. */
  get footer(): Locator {
    return this.page.getByRole("contentinfo");
  }

  /** Any footer nested inside the main landmark (there should be none). */
  get footerInMain(): Locator {
    return this.page.getByRole("main").locator("footer");
  }

  footerLink(name: "Terms" | "Privacy" | "Sign in"): Locator {
    return this.footer.getByRole("link", { name, exact: true });
  }

  footerYear(): Locator {
    return this.footer.locator("[data-year]");
  }

  screenshots(): Locator {
    return this.page.locator("#screens img");
  }

  video(): Locator {
    return this.page.locator("#watch video");
  }

  /** How the brand video is set up, and whether its poster and file are served by the site. */
  async videoReport() {
    const setup = await this.video().evaluate((v) => {
      const media = v as HTMLVideoElement;
      return {
        controls: media.controls,
        autoplay: media.autoplay,
        poster: media.getAttribute("poster") ?? "",
        src: media.getAttribute("src") ?? "",
      };
    });
    const served = async (path: string) => {
      const response = await this.page.request.get(new URL(path, this.page.url()).href);
      return { ok: response.ok(), type: response.headers()["content-type"] ?? "" };
    };
    return { ...setup, poster: await served(setup.poster), file: await served(setup.src) };
  }

  /** Brings every screenshot into view, then reports how each one loaded and is drawn. */
  async screenshotReport() {
    const shots = this.screenshots();
    for (const shot of await shots.all()) await shot.scrollIntoViewIfNeeded();
    await this.page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLImageElement>("#screens img")].every((i) => i.complete),
    );
    return shots.evaluateAll((images) =>
      (images as HTMLImageElement[]).map((i) => ({
        alt: i.alt,
        loaded: i.naturalWidth > 0,
        distorted: Math.abs(i.naturalWidth / i.naturalHeight - i.clientWidth / i.clientHeight) > 0.01,
      })),
    );
  }

  menuButton(): Locator {
    return this.page.locator(".site-header").getByRole("button", { name: /navigation/ });
  }

  mobileMenu(): Locator {
    return this.page.locator("#mobile-menu");
  }

  mobileMenuLink(name: string): Locator {
    return this.mobileMenu().getByRole("link", { name });
  }

  isMenuInert(): Promise<boolean> {
    return this.mobileMenu().evaluate((menu) => (menu as HTMLElement).inert);
  }

  /** How far the page scrolls sideways, in pixels. */
  sidewaysScroll(): Promise<number> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  }

  /** The sections that animate in, with whether each is fully shown right now. */
  revealed(): Promise<boolean[]> {
    return this.page.locator("[data-reveal]").evaluateAll((items) =>
      items.map((item) => getComputedStyle(item).opacity === "1" && getComputedStyle(item).transform === "none"),
    );
  }

  /** The content of a <meta> tag, found by its name or property. */
  meta(key: string): Promise<string | null> {
    return this.page.locator(`meta[name="${key}"], meta[property="${key}"]`).first().getAttribute("content");
  }

  canonical(): Promise<string | null> {
    return this.page.locator('link[rel="canonical"]').getAttribute("href");
  }

  icon(): Promise<string | null> {
    return this.page.locator('link[rel="icon"]').getAttribute("type");
  }

  /** A file the site serves, with its status, text and headers. */
  async file(path: string) {
    const response = await this.page.request.get(path, { maxRedirects: 0 });
    return { status: response.status(), ok: response.ok(), text: await response.text(), headers: response.headers() };
  }
}
