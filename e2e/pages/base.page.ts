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
    // Mirrors sd-bottom-nav.js ITEMS — these are the hrefs the rail renders.
    const map: Record<NavKey, string> = {
      home: "home.html",
      activities: "activities.html",
      saved: "saved.html",
      profile: "profile.html",
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

  /** Wait for custom-element upgrade so visual checks aren't racy. */
  async waitForComponentsReady(): Promise<void> {
    await this.page.waitForFunction(() => {
      const tags = [
        "sd-top-bar",
        "sd-bottom-nav",
        "sd-button",
        "sd-icon",
        "sd-section",
      ];
      return tags.every((t) => !!customElements.get(t));
    });
  }
}
