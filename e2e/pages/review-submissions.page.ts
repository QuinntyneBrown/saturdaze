import { Locator, Page } from "@playwright/test";
import { BasePage, control } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Review submissions (admin) — pages/review-submissions.html (+ .empty).
 *
 *   .page-header  eyebrow back link "Family" (≥720) / icon "Back to Family" (<720)
 *                 + "Review submissions" + count subtitle
 *   .queue
 *     article.card.card--pad-lg   .date-tile · .card__title · .card__meta · "Pending" chip
 *                                 dl.details (Location · Cost · Ages · Link · Notes)
 *                                 p.submitter · .review-actions [Reject] [Approve]
 *     .approved-row[role=status]  "Approved · <title>" (replaces a card after approval)
 * Empty: .empty "Queue is clear" + "Back to Family".
 */
export class ReviewSubmissionsPage extends BasePage {
  readonly slug: PageSlug = "review-submissions";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".queue .card, .empty__title");
  }

  /** Whichever back affordance the viewport shows. */
  backLink(): Locator {
    return this.pageHeader
      .locator('.page-header__eyebrow, [aria-label="Back to Family"]')
      .filter({ visible: true });
  }

  get queue(): Locator {
    return this.main.locator(".queue");
  }

  cards(): Locator {
    return this.queue.locator(".card");
  }

  card(title: string): Locator {
    return this.cards().filter({ has: this.page.locator(".card__title", { hasText: title }) });
  }

  cardTitle(card: Locator): Locator {
    return card.locator(".card__title");
  }

  cardMeta(card: Locator): Locator {
    return card.locator(".card__meta");
  }

  dateTile(card: Locator): Locator {
    return card.locator(".date-tile");
  }

  details(card: Locator): Locator {
    return card.locator(".details");
  }

  detail(card: Locator, label: "Location" | "Cost" | "Ages" | "Link" | "Notes"): Locator {
    return card.locator(".details__label", { hasText: label }).locator("xpath=following-sibling::dd[1]");
  }

  submitter(card: Locator): Locator {
    return card.locator(".submitter");
  }

  approveButton(card: Locator): Locator {
    return control(card.locator(".review-actions"), "Approve");
  }

  rejectButton(card: Locator): Locator {
    return control(card.locator(".review-actions"), "Reject");
  }

  approvedRows(): Locator {
    return this.queue.locator('.approved-row[role="status"]');
  }

  backToFamilyButton(): Locator {
    return this.emptyCta("Back to Family");
  }
}
