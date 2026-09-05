import { Locator, Page } from "@playwright/test";
import { BasePage, DayName } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Shared weekend — `/sample-weekend?share=<token>` (app only; no mock).
 *
 * Site shell (`.sitebar` with Sign in / Create your account, no `.topbar` /
 * `.bottom-nav`), an info banner, then the same `.day` / `.block` markup as
 * the Weekend screen with NO action buttons (read-only). An unknown or
 * missing token renders `.empty`; no token at all redirects to `/`.
 */
export class SharedWeekendPage extends BasePage {
  readonly slug: PageSlug = "shared-weekend";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".day__header, .empty__title");
  }

  infoBanner(): Locator {
    return this.banner("info");
  }

  sitebarSignInLink(): Locator {
    return this.sitebar.getByRole("link", { name: "Sign in", exact: true });
  }

  sitebarCreateAccountLink(): Locator {
    return this.sitebar.getByRole("link", { name: "Create your account", exact: true });
  }

  days(): Locator {
    return this.main.locator(".day");
  }

  day(name: DayName): Locator {
    return this.days().filter({ has: this.page.locator(".day__title", { hasText: name }) });
  }

  blocks(name?: DayName): Locator {
    return (name ? this.day(name) : this.main).locator(".block");
  }

  /** Any per-block or per-day control — must be absent on the read-only view. */
  actionControls(): Locator {
    return this.main.locator(".block__actions, .block__chev, .day__actions, .ghost-row");
  }
}
