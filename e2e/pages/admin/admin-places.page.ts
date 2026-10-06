import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";

/**
 * Places (A3) — pages/admin.places.html.
 *
 *   .page-header  "Places"
 *   .place-list   .list__item.place-row  .place-thumb (sd-media 4:3) · .list__title · .list__sub · chevron
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
}
