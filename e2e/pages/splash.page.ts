import { Locator, Page } from "@playwright/test";

/**
 * Marketing splash — pages/splash.html. Signed-out visitors land here at /.
 *
 * Intentionally not an `AuthShellPage`: the splash carries marketing chrome
 * (full-width hero, `.nav` top-bar with brand + sign-in link) rather than
 * the centered auth-card chrome. It also skips `sd-top-bar` / `sd-bottom-nav`
 * — public visitors don't get app chrome.
 *
 * The Angular implementation (slice B1) will render `sd-splash-page`; the
 * mock renders a plain `.marketing` div. Locators accept either.
 */
export class SplashPage {
  constructor(protected readonly page: Page) {}

  get root(): Locator {
    return this.page.locator("sd-splash-page, .marketing");
  }

  get nav(): Locator {
    return this.page.locator(".nav");
  }

  get hero(): Locator {
    return this.page.locator(".hero");
  }

  get signInLink(): Locator {
    return this.nav.locator('a[href$="login"], a[href$="login.html"]');
  }

  get signupCta(): Locator {
    return this.hero.locator(
      'a[href$="signup"], a[href$="signup.html"], sd-button:has-text("Get started")',
    );
  }

  async waitForReady(): Promise<void> {
    await this.page.waitForSelector("sd-splash-page, .marketing, .hero", {
      state: "attached",
      timeout: 8_000,
    });
  }
}
