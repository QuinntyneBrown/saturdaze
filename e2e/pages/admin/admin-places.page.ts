import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";

/**
 * Places (A3) — pages/admin.places.html.
 *
 *   .page-header  "Places"
 *   .toolbar      Search field · Sort select
 *   .filters      kind chips ‖ flag chips ‖ source chips · Upcoming events only
 *   .toolbar__count  "8 of 43 places"
 *   .place-list   .place-row  .place-thumb (sd-media 4:3) · .list__title · .list__sub
 *                 · .place-row__flags .chip · chevron; the link is a.list__item (the row
 *                 itself in the mock, inside sd-place-row in the app)
 *   .pager        "1 to 8 of 8" · Previous · Next
 */
export class AdminPlacesPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".place-list, .empty__title");
  }

  get placeList(): Locator {
    return this.main.locator(".place-list");
  }

  rows(): Locator {
    return this.placeList.locator(".place-row");
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

  rowThumb(row: Locator): Locator {
    return row.locator(".place-thumb");
  }

  /** The row's link to the place's photos: the row in the mock, its `a.list__item` in the app. */
  rowLink(row: Locator): Locator {
    return row.locator(
      'xpath=descendant-or-self::a[contains(concat(" ", normalize-space(@class), " "), " list__item ")]',
    );
  }

  rowFlags(row: Locator): Locator {
    return row.locator(".place-row__flags .chip");
  }

  searchInput(): Locator {
    return this.main.getByLabel("Search", { exact: true });
  }

  sortSelect(): Locator {
    return this.main.getByLabel("Sort", { exact: true });
  }

  count(): Locator {
    return this.main.locator(".toolbar__count");
  }

  pager(): Locator {
    return this.main.locator(".pager");
  }

  pagerButton(name: "Previous" | "Next"): Locator {
    return this.pager().getByRole("button", { name, exact: true });
  }
}
