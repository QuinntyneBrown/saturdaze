import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";

/**
 * Email template editor (A9) — pages/admin.email.html.
 *
 *   .page-header       eyebrow "Email templates" · title (name) · "key · Category · version n · updated …"
 *                      .template-status .chip (status, System, Unsaved changes)
 *                      [Save changes] [History] [Duplicate] [Activate | Archive | Restore as draft] [Delete]
 *   .template-note     the system-template note
 *   .email-editor      .email-editor__form (Name, Description, Subject, Preheader, HTML body,
 *                      Plain-text body, Sample data fields) · .email-preview (sd-email-preview)
 */
export class AdminEmailTemplatePage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".email-editor, .empty__title");
  }

  statusChips(): Locator {
    return this.main.locator(".template-status .chip");
  }

  /** The header line "account.password-reset · Account · version 4 · updated …". */
  meta(): Locator {
    return this.pageSubtitle();
  }

  action(name: string): Locator {
    return this.headerAction(name);
  }
}
