import { Locator, Page } from "@playwright/test";
import { BasePage, control } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

export type IdeasSegment = "Activities" | "Food" | "Events";

/**
 * Ideas — pages/ideas.html · ideas.food.html · ideas.events.html.
 *
 * One parent screen (header + .segments) with three children:
 *   Activities  filters (All · Outdoor · Indoor · Under 30 min · Ages 5+ ·
 *               Weather-safe), three sections of .card with a "Map" link.
 *   Food        filters (Saturday | Sunday ‖ Lunch | Dinner ‖ Wife-approved ·
 *               Under 15 min), Lunch + Dinner sections of .card with a
 *               .vote-row, "See menu" link and "Lock it in" (→ D12). The top
 *               pick spans (.card--span); a locked pick is .card--locked and
 *               its siblings .card--dimmed with votes disabled.
 *   Events      [Suggest an event] (→ D10), filters (This weekend | Next
 *               weekend ‖ categories), sections Your suggestion
 *               (.card--muted, "Pending review") · Saturday · Sunday ·
 *               Coming soon; .date-tile + optional "Details" link.
 */
export class IdeasPage extends BasePage {
  readonly slug: PageSlug = "ideas";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator('.segments__tab[aria-current="page"]');
  }

  /* ---------- Segments ---------- */

  get segments(): Locator {
    return this.main.locator('.segments[aria-label="Idea type"]');
  }

  segmentTab(name: IdeasSegment): Locator {
    return this.segments.locator(".segments__tab", { hasText: name });
  }

  activeSegment(): Locator {
    return this.segments.locator('.segments__tab[aria-current="page"]');
  }

  /* ---------- Cards ---------- */

  cards(section?: Locator): Locator {
    return (section ?? this.main).locator(".grid-cards .card");
  }

  card(title: string, section?: Locator): Locator {
    return this.cards(section).filter({ has: this.page.locator(".card__title", { hasText: title }) });
  }

  cardTitle(card: Locator): Locator {
    return card.locator(".card__title");
  }

  cardMeta(card: Locator): Locator {
    return card.locator(".card__meta");
  }

  cardChips(card: Locator): Locator {
    return card.locator(".card__chips .chip");
  }

  cardFooter(card: Locator): Locator {
    return card.locator(".card__footer");
  }

  /** Activities: external map link. */
  mapLink(card: Locator): Locator {
    return card.getByRole("link", { name: "Map", exact: true });
  }

  /** Events: external details link. */
  detailsLink(card: Locator): Locator {
    return card.getByRole("link", { name: "Details", exact: true });
  }

  /* ---------- Food ---------- */

  lunchSection(): Locator {
    return this.section("Lunch");
  }

  dinnerSection(): Locator {
    return this.section("Dinner");
  }

  topPickCard(section?: Locator): Locator {
    return (section ?? this.main).locator(".card.card--span");
  }

  /** Plain food cards: not the spanning top pick, not locked, not dimmed. */
  regularCards(section?: Locator): Locator {
    return (section ?? this.main).locator(".grid-cards .card:not(.card--span):not(.card--locked):not(.card--dimmed)");
  }

  /** Event cards that carry an external "Details" link. */
  cardsWithDetails(section?: Locator): Locator {
    return this.cards(section).filter({ has: this.page.getByRole("link", { name: "Details", exact: true }) });
  }

  /** Event cards without a URL (no footer at all). */
  cardsWithoutDetails(section?: Locator): Locator {
    return this.cards(section).filter({ hasNot: this.page.getByRole("link", { name: "Details", exact: true }) });
  }

  lockedCard(section?: Locator): Locator {
    return (section ?? this.main).locator(".card.card--locked");
  }

  dimmedCards(section?: Locator): Locator {
    return (section ?? this.main).locator(".card.card--dimmed");
  }

  voteRow(card: Locator): Locator {
    return card.locator('.vote-row[role="group"]');
  }

  /** `<name> votes yes|no` — `aria-pressed` reflects the current vote. */
  voteButton(card: Locator, member: string, choice: "yes" | "no"): Locator {
    return card.locator(`.vote-row__btn[aria-label="${member} votes ${choice}"]`);
  }

  seeMenuLink(card: Locator): Locator {
    return card.getByRole("link", { name: "See menu", exact: true });
  }

  lockItInButton(card: Locator): Locator {
    return control(card.locator(".card__footer"), "Lock it in");
  }

  /* ---------- Events ---------- */

  suggestEventButton(): Locator {
    return this.headerAction("Suggest an event");
  }

  yourSuggestionSection(): Locator {
    return this.section("Your suggestion");
  }

  pendingCards(): Locator {
    return this.main.locator(".card.card--muted");
  }

  dateTile(card: Locator): Locator {
    return card.locator(".date-tile");
  }
}
