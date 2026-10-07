import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";
import { control } from "../base.page.js";

/**
 * Review queue (A5) — pages/admin.reviews.html.
 *
 *   .page-header  "Review queue" · "Seven provider photos ingestion brought in, newest first. …"
 *   .review-list  .review-item[aria-label=place]
 *     .review-item__photos  two figures: candidate ("New from ingestion") · current ("Would replace" / "Would become primary")
 *     .card__head  .card__title > .review-item__link · .card__meta · .chip "Unreviewed"
 *     .review-actions  [Reject] [Keep] [Make primary]
 *   .empty        "Nothing to review" once the queue is clear
 */
export class AdminReviewsPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".review-list, .empty__title");
  }

  items(): Locator {
    return this.main.locator(".review-item");
  }

  item(placeName: string): Locator {
    return this.main.locator(`.review-item[aria-label="${placeName}"]`);
  }

  itemLink(item: Locator): Locator {
    return item.locator(".review-item__link");
  }

  itemMeta(item: Locator): Locator {
    return item.locator(".card__meta");
  }

  /** The two figure captions: "New from ingestion" then the current primary's. */
  itemCaptions(item: Locator): Locator {
    return item.locator(".review-item__cap");
  }

  itemAction(item: Locator, name: string | RegExp): Locator {
    return control(item.locator(".review-actions"), name);
  }

  /** AD6's optional reason. */
  reasonField(): Locator {
    return this.dialog().getByLabel("Reason");
  }

  emptyTitle(): Locator {
    return this.main.locator(".empty__title");
  }
}
