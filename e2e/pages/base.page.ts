/**
 * Shared chrome present on every Saturdaze screen.
 *
 * The selectors mirror the custom-element tag names defined in
 * `docs/mocks/components/*.js`. The Angular implementation is expected to
 * register the same tag names (whether via Angular components or
 * registered web-components), so tests use them directly without rewriting
 * for an Angular-flavoured prefix.
 */

import { Locator, Page } from "@playwright/test";

export type NavKey = "home" | "activities" | "saved" | "profile";

export class BasePage {
  constructor(protected readonly page: Page) {}

  /* ---------- Top bar ---------- */

  get topBar(): Locator {
    return this.page.locator("sd-top-bar");
  }

  topBarTitle(): Locator {
    return this.topBar.locator("h1");
  }

  topBarBackLink(): Locator {
    return this.topBar.locator('a.back, [aria-label="Back"]');
  }

  topBarLeading(): Locator {
    return this.topBar.locator('[slot="leading"]');
  }

  topBarTrailing(): Locator {
    return this.topBar.locator('[slot="trailing"]');
  }

  /* ---------- Bottom navigation / side rail ---------- */

  get bottomNav(): Locator {
    return this.page.locator("sd-bottom-nav");
  }

  navLink(key: NavKey): Locator {
    return this.bottomNav.locator(`a[href$="${this.navHref(key)}"]`);
  }

  private navHref(key: NavKey): string {
    // Production hrefs are real Angular routes so direct open and copy-link work.
    const map: Record<NavKey, string> = {
      home: "/weekend",
      activities: "/activities",
      saved: "/saved",
      profile: "/profile",
    };
    return map[key];
  }

  activeNavKey(): Locator {
    return this.bottomNav.locator('a[data-active="true"]');
  }

  /* ---------- Page frame ---------- */

  get frame(): Locator {
    return this.page.locator(".sd-frame");
  }

  /* ---------- Convenience ---------- */

  /**
   * Wait for the page chrome to attach to the DOM. The mock world registers
   * custom elements; the Angular world stamps the same tag names via
   * standalone components. Either way the DOM-presence check is enough —
   * we used to gate on `customElements.get(...)` which hangs forever
   * against Angular (it doesn't register tags with the customElements
   * registry). See `docs/bugs/007-e2e-waitForComponentsReady-incompatible-with-angular.md`.
   */
  async waitForComponentsReady(): Promise<void> {
    await this.page.waitForSelector("sd-top-bar, sd-bottom-nav, sd-section", {
      state: "attached",
      timeout: 8_000,
    });
  }
}
