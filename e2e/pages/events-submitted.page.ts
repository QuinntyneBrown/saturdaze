import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Post-submit confirmation — pages/events.submitted.html / /events/submitted.
 */
export class EventsSubmittedPage extends BasePage {
  headingTitle(): Locator {
    return this.page.locator("h2").filter({ hasText: "Thanks — it's in the queue" });
  }

  pendingChip(): Locator {
    return this.page.locator("sd-chip", { hasText: "Pending review" });
  }
}
