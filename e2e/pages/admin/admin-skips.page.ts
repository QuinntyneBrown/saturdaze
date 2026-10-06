import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";

/**
 * Ingestion photo skips (A6) — pages/admin.ingestion-skips.html.
 *
 *   .page-header  "Ingestion photo skips"
 *   .queue        .card[aria-label="Events run 6 Oct 2026, 04:12 UTC · …"]
 *                 .card__title · .card__meta · .chip (status)
 *                 .skip-list .skip  .skip__place (a, or span.skip__place--none) · .skip__reason · .skip__url
 */
export class AdminSkipsPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".queue, .empty__title");
  }

  runs(): Locator {
    return this.main.locator(".queue .card");
  }

  run(type: string): Locator {
    return this.runs().filter({ has: this.page.locator(".card__title", { hasText: type }) });
  }

  runMeta(run: Locator): Locator {
    return run.locator(".card__meta");
  }

  runStatus(run: Locator): Locator {
    return run.locator(".card__head .chip");
  }

  skips(run: Locator): Locator {
    return run.locator(".skip");
  }

  skipPlaceLink(skip: Locator): Locator {
    return skip.locator("a.skip__place");
  }

  skipPlaceName(skip: Locator): Locator {
    return skip.locator(".skip__place");
  }

  skipReason(skip: Locator): Locator {
    return skip.locator(".skip__reason");
  }

  skipUrl(skip: Locator): Locator {
    return skip.locator(".skip__url");
  }

  emptyTitle(): Locator {
    return this.main.locator(".empty__title");
  }
}
