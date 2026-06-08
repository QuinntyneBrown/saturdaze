import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Submit-an-event form — pages/events.submit.html / /events/submit.
 */
export class EventsSubmitPage extends BasePage {
  headingTitle(): Locator {
    return this.page.locator("h2").filter({ hasText: "Tell me about something I missed" });
  }

  titleInput(): Locator {
    return this.page.locator('input[name="title"], input[type="text"]').first();
  }

  startsAtInput(): Locator {
    return this.page.locator('input[type="datetime-local"]').first();
  }

  submitButton(): Locator {
    return this.page.getByRole("button", { name: /Submit event/i });
  }

  cancelButton(): Locator {
    return this.page.getByRole("button", { name: /Cancel/i });
  }
}
