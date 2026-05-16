import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Local events feed — pages/events.html.
 *
 * Contract:
 *   - top-bar "Local events" with back link
 *   - heading "What's on this weekend" + lede
 *   - filter chips: This weekend (primary), Next weekend, Outdoor (leaf),
 *                   Indoor (indoor), Seasonal (sun), Theatre, Festivals
 *   - sections "Saturday" (3 cards), "Sunday" (2 cards), "Coming soon" (2 cards)
 *   - sd-bottom-nav active=activities
 */
export class EventsPage extends BasePage {
  headingTitle(): Locator {
    return this.page
      .locator("h2")
      .filter({ hasText: "What's on this weekend" });
  }

  filterChips(): Locator {
    return this.page.locator("sd-tag-group").first().locator("sd-chip");
  }

  saturdaySection(): Locator {
    return this.sectionByTitle("Saturday");
  }

  sundaySection(): Locator {
    return this.sectionByTitle("Sunday");
  }

  comingSoonSection(): Locator {
    return this.sectionByTitle("Coming soon");
  }

  eventCard(title: string): Locator {
    return this.page.locator(`sd-event-card[title="${title}"]`);
  }

  allEventCards(): Locator {
    return this.page.locator("sd-event-card");
  }

  private sectionByTitle(title: string): Locator {
    return this.page.locator(`sd-section[title="${title}"]`);
  }
}
