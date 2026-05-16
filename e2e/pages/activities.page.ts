import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Activity suggestions — pages/activities.html.
 *
 * Contract:
 *   - top-bar "Discover" with back link + sparkle "Try something new" button
 *   - lede heading "Picked for the Browns" + subtitle
 *   - sd-tag-group filter row with 7 chips
 *   - three sd-section blocks each containing sd-activity-card items:
 *       "This weekend's weather-fit"  → 3 cards
 *       "If weather turns"            → 3 cards
 *       "Try something new"           → 2 cards
 *   - sd-bottom-nav active=activities
 */
export class ActivitiesPage extends BasePage {
  trySomethingNewButton(): Locator {
    return this.topBar.locator('sd-icon-button[icon="sparkle"]');
  }

  headingTitle(): Locator {
    return this.page.locator("h2").filter({ hasText: "Picked for the Browns" });
  }

  filterChips(): Locator {
    // The first sd-tag-group on the page is the filter row.
    return this.page.locator("sd-tag-group").first().locator("sd-chip");
  }

  filterChip(label: string): Locator {
    return this.filterChips().filter({ hasText: label });
  }

  weatherFitSection(): Locator {
    return this.sectionByTitle("This weekend's weather-fit");
  }

  ifWeatherTurnsSection(): Locator {
    return this.sectionByTitle("If weather turns");
  }

  trySomethingNewSection(): Locator {
    return this.sectionByTitle("Try something new");
  }

  activityCard(title: string): Locator {
    return this.page.locator(`sd-activity-card[title="${title}"]`);
  }

  allActivityCards(): Locator {
    return this.page.locator("sd-activity-card");
  }

  private sectionByTitle(title: string): Locator {
    return this.page.locator(`sd-section[title="${title}"]`);
  }
}
