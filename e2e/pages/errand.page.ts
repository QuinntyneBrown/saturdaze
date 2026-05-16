import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Shopping errand — pages/errand.html.
 *
 * Contract:
 *   - top-bar "Add an errand" with back link
 *   - heading "Slot in a shopping run" + lede
 *   - two sd-text-input (What's needed, Roughly how long)
 *   - "Best day" tag group (Sunday morning primary, three others)
 *   - sunken sd-card "Suggested slot" with sparkle icon
 *   - footer actions: "Pick a different slot" (secondary) + "Add to weekend"
 *   - sd-bottom-nav active=home
 */
export class ErrandPage extends BasePage {
  headingTitle(): Locator {
    return this.page.locator("h2").filter({ hasText: "Slot in a shopping run" });
  }

  whatsNeededInput(): Locator {
    return this.page.locator('sd-text-input[label="What\'s needed"]');
  }

  howLongInput(): Locator {
    return this.page.locator('sd-text-input[label="Roughly how long"]');
  }

  bestDayChips(): Locator {
    // The tag-group inside the form. Use the parent label "Best day" to scope.
    return this.page
      .locator("sd-tag-group")
      .last()
      .locator("sd-chip");
  }

  bestDayChip(text: string): Locator {
    return this.bestDayChips().filter({ hasText: text });
  }

  suggestedSlotCard(): Locator {
    return this.page.locator('sd-card[variant="sunk"]');
  }

  pickDifferentSlotButton(): Locator {
    return this.page
      .locator("sd-button")
      .filter({ hasText: "Pick a different slot" });
  }

  addToWeekendButton(): Locator {
    return this.page.locator("sd-button").filter({ hasText: "Add to weekend" });
  }
}
