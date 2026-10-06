import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";

/**
 * Activity log (A7) — pages/admin.activity.html.
 *
 *   .page-header  "Activity log"
 *   .toolbar      Place select · Administrator select
 *   .audit-list   .audit-row  .audit-row__time · .audit-row__who · .audit-row__place · .chip · .audit-row__change
 *   .pager        "1 to 5 of 5" · Previous · Next
 */
export class AdminActivityPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".audit-list, .empty__title");
  }

  rows(): Locator {
    return this.main.locator(".audit-row");
  }

  /** Rows whose change text mentions the given text. */
  rowsMentioning(text: string): Locator {
    return this.rows().filter({ has: this.page.locator(".audit-row__change", { hasText: text }) });
  }

  rowTime(row: Locator): Locator {
    return row.locator(".audit-row__time");
  }

  rowWho(row: Locator): Locator {
    return row.locator(".audit-row__who");
  }

  rowPlace(row: Locator): Locator {
    return row.locator(".audit-row__place");
  }

  rowAction(row: Locator): Locator {
    return row.locator(".chip");
  }

  rowChange(row: Locator): Locator {
    return row.locator(".audit-row__change");
  }

  placeSelect(): Locator {
    return this.main.getByLabel("Place", { exact: true });
  }

  adminSelect(): Locator {
    return this.main.getByLabel("Administrator", { exact: true });
  }

  pagerText(): Locator {
    return this.main.locator(".pager__text");
  }
}
