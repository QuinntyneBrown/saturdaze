import { Locator, Page } from "@playwright/test";
import { BasePage, control } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Past weekends — pages/past.html (+ .empty).
 *
 *   .page-header "Past weekends" + count subtitle
 *   filters (All · Favourites · This year · 5★)
 *   p.strip "Skipping next time:" + .chip--warn per avoided item
 *   .sd-grid-cards > sd-past-card.card.card--media
 *      .card__media: sd-media (cover + .media__credit) or the "Add a photo to …" control
 *      .card__row  .card__eyebrow (date range) · .fav-btn[aria-pressed]
 *      h3.card__title > button.card__title-btn[aria-label="Rename: …"]
 *      button.stars[aria-label="Rate this weekend, currently n of 5"]
 *      p.card__highlights
 *      .card__footer [Remix] [Repeat]
 * Empty: .empty "Nothing here yet" + "Go to this weekend".
 */
export class PastPage extends BasePage {
  readonly slug: PageSlug = "past";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".sd-grid-cards .card, .empty__title");
  }

  get strip(): Locator {
    return this.main.locator(".strip");
  }

  stripChips(): Locator {
    return this.strip.locator(".chip");
  }

  cards(): Locator {
    return this.main.locator(".sd-grid-cards .card");
  }

  card(title: string): Locator {
    return this.cards().filter({ has: this.page.locator(".card__title", { hasText: title }) });
  }

  cardEyebrow(card: Locator): Locator {
    return card.locator(".card__eyebrow");
  }

  cardTitle(card: Locator): Locator {
    return card.locator(".card__title");
  }

  favouriteButton(card: Locator): Locator {
    return card.locator('.fav-btn[aria-label="Favourite this weekend"]');
  }

  renameButton(card: Locator): Locator {
    return card.locator('.card__title-btn[aria-label^="Rename: "]');
  }

  starsButton(card: Locator): Locator {
    return card.locator('.stars[aria-label^="Rate this weekend"]');
  }

  starsLabel(card: Locator): Locator {
    return card.locator(".stars__label");
  }

  highlights(card: Locator): Locator {
    return card.locator(".card__highlights");
  }

  remixButton(card: Locator): Locator {
    return control(card.locator(".card__footer"), "Remix");
  }

  repeatButton(card: Locator): Locator {
    return control(card.locator(".card__footer"), "Repeat");
  }

  favouriteCards(): Locator {
    return this.cards().filter({ has: this.page.locator('.fav-btn[aria-pressed="true"]') });
  }

  /* ---------- Covers (L2-110) ---------- */

  cardMedia(card: Locator): Locator {
    return card.locator(".card__media");
  }

  cardCoverImage(card: Locator): Locator {
    return card.locator(".card__media img");
  }

  cardCoverCredit(card: Locator): Locator {
    return card.locator(".card__media .media__credit");
  }

  /** "Add a photo to {title}" on a weekend without a cover; opens D29. */
  addPhotoControl(card: Locator): Locator {
    return card.getByRole("button", { name: /^Add a photo to / });
  }

  async cardCoverLoaded(card: Locator): Promise<boolean> {
    return this.cardCoverImage(card).evaluate(
      (img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
    );
  }

  /** How many columns the card grid lays out, from the first row's left edges. */
  async columnCount(): Promise<number> {
    const boxes = await this.cards().evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
    const firstRow = boxes.filter((top) => Math.abs(top - boxes[0]!) < 2);
    return firstRow.length;
  }

  /** D29's "Your own photo" input, when opened from a card. */
  async chooseOwnPhoto(file: string): Promise<void> {
    await this.dialog().getByLabel("Upload your own photo", { exact: true }).setInputFiles(file);
  }

  goToWeekendButton(): Locator {
    return this.emptyCta("Go to this weekend");
  }
}
