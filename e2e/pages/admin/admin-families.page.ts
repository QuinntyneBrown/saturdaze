import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";

/**
 * Families (A8) — pages/admin.families.html (L2-157).
 *
 *   .page-header   "Families"
 *   .toolbar       Search field
 *   .toolbar__count  "4 families"
 *   .family-list   .family-row  .disc (initial) · .list__title · .list__sub ("4 members · 2 accounts · home")
 *                  · .family-row__accounts (emails) · .family-row__flags .chip ("Planned · 14 blocks" | "Not planned")
 *                  the link is a.list__item (the row itself in the mock, inside sd-list-item in the app)
 *   .pager         "1 to 4 of 4" · Previous · Next
 */
export class AdminFamiliesPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".family-list, .empty__title");
  }

  get familyList(): Locator {
    return this.main.locator(".family-list");
  }

  rows(): Locator {
    return this.familyList.locator(".family-row");
  }

  row(name: string): Locator {
    return this.rows().filter({ has: this.page.locator(".list__title", { hasText: name }) });
  }

  rowTitle(row: Locator): Locator {
    return row.locator(".list__title");
  }

  rowMeta(row: Locator): Locator {
    return row.locator(".list__sub");
  }

  rowAccounts(row: Locator): Locator {
    return row.locator(".family-row__accounts");
  }

  rowFlags(row: Locator): Locator {
    return row.locator(".family-row__flags .chip");
  }

  /** The row's link to the family's weekend: the row in the mock, its `a.list__item` in the app. */
  rowLink(row: Locator): Locator {
    return row.locator(
      'xpath=descendant-or-self::a[contains(concat(" ", normalize-space(@class), " "), " list__item ")]',
    );
  }

  searchInput(): Locator {
    return this.main.getByLabel("Search", { exact: true });
  }

  count(): Locator {
    return this.main.locator(".toolbar__count");
  }

  pager(): Locator {
    return this.main.locator(".pager");
  }

  pagerText(): Locator {
    return this.pager().locator(".pager__text");
  }
}
