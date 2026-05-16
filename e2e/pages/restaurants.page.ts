import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Restaurant picker — pages/restaurants.html.
 *
 * Contract:
 *   - top-bar "Food" with back link + refresh button
 *   - heading "Saturday food" + lede
 *   - filter chips: Lunch (primary), Dinner, Wife-approved only (accent),
 *                   < 15 min (sky), Patio (leaf)
 *   - section "Top pick for lunch" — single sd-restaurant-card (La Marina)
 *     with vote rows for Quinn/Sara/Eli (up) + Mae (none) and two buttons
 *   - section "Other strong picks" — 2 sd-restaurant-card
 *   - section "Sunday dinner" — 1 sd-restaurant-card (Jack Astor's)
 *   - sd-bottom-nav active=home
 */
export class RestaurantsPage extends BasePage {
  refreshButton(): Locator {
    return this.topBar.locator('sd-icon-button[icon="refresh"]');
  }

  headingTitle(): Locator {
    return this.page.locator("h2").filter({ hasText: "Saturday food" });
  }

  filterChips(): Locator {
    return this.page.locator("sd-tag-group").first().locator("sd-chip");
  }

  /* ---------- Sections ---------- */

  topPickSection(): Locator {
    return this.sectionByTitle("Top pick for lunch");
  }

  otherPicksSection(): Locator {
    return this.sectionByTitle("Other strong picks");
  }

  sundayDinnerSection(): Locator {
    return this.sectionByTitle("Sunday dinner");
  }

  /* ---------- Restaurant cards ---------- */

  restaurantCard(name: string): Locator {
    return this.page.locator(`sd-restaurant-card[name="${name}"]`);
  }

  allRestaurantCards(): Locator {
    return this.page.locator("sd-restaurant-card");
  }

  voteRow(card: Locator, name: string): Locator {
    return card.locator(`sd-vote-row[name="${name}"]`);
  }

  lockItInButton(): Locator {
    return this.topPickSection()
      .locator("sd-button")
      .filter({ hasText: "Lock it in" });
  }

  private sectionByTitle(title: string): Locator {
    return this.page.locator(`sd-section[title="${title}"]`);
  }
}
