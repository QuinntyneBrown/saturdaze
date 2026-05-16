import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Saved weekends — pages/saved.html.
 *
 * Contract:
 *   - top-bar "Saved weekends" with leading back arrow + trailing more
 *   - heading "Your weekends" + "12 weekends planned…" lede
 *   - filter chips: All, Favourites, This year, 5★ only
 *   - section "Recent" — three sd-saved-card with Remix + Repeat buttons
 *   - section "Avoid repeating" — single sd-list-item with warn chip
 *   - sd-bottom-nav active=saved
 */
export class SavedPage extends BasePage {
  headingTitle(): Locator {
    return this.page.locator("h2").filter({ hasText: "Your weekends" });
  }

  filterChips(): Locator {
    return this.page.locator("sd-tag-group").first().locator("sd-chip");
  }

  recentSection(): Locator {
    return this.sectionByTitle("Recent");
  }

  avoidSection(): Locator {
    return this.sectionByTitle("Avoid repeating");
  }

  savedCard(title: string): Locator {
    return this.page.locator(`sd-saved-card[title="${title}"]`);
  }

  allSavedCards(): Locator {
    return this.page.locator("sd-saved-card");
  }

  favouriteCards(): Locator {
    return this.page.locator("sd-saved-card[favourite]");
  }

  remixButton(card: Locator): Locator {
    return card.locator("sd-button").filter({ hasText: "Remix" });
  }

  repeatButton(card: Locator): Locator {
    return card.locator("sd-button").filter({ hasText: "Repeat" });
  }

  private sectionByTitle(title: string): Locator {
    return this.page.locator(`sd-section[title="${title}"]`);
  }
}
