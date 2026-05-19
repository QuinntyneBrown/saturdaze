import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Admin event moderation queue — pages/admin.events.html / /admin/events.
 */
export class AdminEventsPage extends BasePage {
  headingTitle(): Locator {
    return this.page.locator("h2").filter({ hasText: "Pending submissions" });
  }

  submissionRow(title: string): Locator {
    return this.page.locator("article.submission", {
      has: this.page.locator("h3", { hasText: title }),
    });
  }

  allSubmissionRows(): Locator {
    return this.page.locator("article.submission");
  }

  approveButton(title: string): Locator {
    return this.submissionRow(title).getByRole("button", { name: /Approve/i });
  }

  rejectButton(title: string): Locator {
    return this.submissionRow(title).getByRole("button", { name: /Reject/i });
  }
}
