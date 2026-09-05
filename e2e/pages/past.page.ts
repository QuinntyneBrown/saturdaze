import { Locator, Page } from "@playwright/test";
import { BasePage, control } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Past weekends — pages/past.html (+ .empty).
 *
 *   .page-header "Past weekends" + count subtitle
 *   filters (All · Favourites · This year · 5★)
 *   p.strip "Skipping next time:" + .chip--warn per avoided item
 *   ul.grid-cards > li.card
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
    return this.page.locator(".grid-cards .card, .empty__title");
  }

  get strip(): Locator {
    return this.main.locator(".strip");
  }

  stripChips(): Locator {
    return this.strip.locator(".chip");
  }

  cards(): Locator {
    return this.main.locator(".grid-cards .card");
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

  goToWeekendButton(): Locator {
    return this.emptyCta("Go to this weekend");
  }
}
