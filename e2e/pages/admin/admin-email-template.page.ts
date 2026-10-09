import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";
import { control } from "../base.page.js";

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

  saveButton(): Locator {
    return this.action("Save changes");
  }

  /* ---------- Editor form ---------- */

  get form(): Locator {
    return this.main.locator(".email-editor__form");
  }

  /** A content field by its label; a required field's label also reads "Required". */
  field(label: "Name" | "Description" | "Subject" | "Preheader" | "HTML body" | "Plain-text body"): Locator {
    return this.form.getByRole("textbox", { name: new RegExp(`^${label}\\b`) });
  }

  /** The sample value field for one placeholder, labelled with its name. */
  sampleField(placeholder: string): Locator {
    return this.form.locator(".email-editor__samples").getByLabel(placeholder, { exact: true });
  }

  sampleFields(): Locator {
    return this.form.locator(".email-editor__samples input");
  }

  /* ---------- Preview (sd-email-preview) ---------- */

  get preview(): Locator {
    return this.main.locator(".email-preview");
  }

  previewSubject(): Locator {
    return this.preview.locator(".email-preview__subject");
  }

  previewPreheader(): Locator {
    return this.preview.locator(".email-preview__preheader");
  }

  /** The sandboxed frame holding the rendered HTML. */
  previewFrame(): Locator {
    return this.preview.locator("iframe.email-preview__frame");
  }

  /** The rendered HTML inside the frame. */
  previewBody(): Locator {
    return this.previewFrame().contentFrame().locator("body");
  }

  previewText(): Locator {
    return this.preview.locator(".email-preview__text");
  }

  previewOption(name: "Desktop" | "Phone" | "HTML" | "Plain text"): Locator {
    return this.preview.getByRole("radio", { name, exact: true });
  }

  previewPlaceholder(name: string): Locator {
    return this.preview
      .locator(".email-preview__item")
      .filter({ has: this.page.locator("code", { hasText: new RegExp(`^${name}$`) }) });
  }

  /* ---------- AD9 History ---------- */

  revisions(): Locator {
    return this.dialog().locator(".revision");
  }

  revisionMeta(revision: Locator): Locator {
    return revision.locator(".revision__meta");
  }

  revisionSubject(revision: Locator): Locator {
    return revision.locator(".revision__subject");
  }

  loadRevisionButton(version: number): Locator {
    return this.dialog().getByRole("button", { name: `Load version ${version} into the editor`, exact: true });
  }

  /** The system-template note above the editor. */
  note(): Locator {
    return this.main.locator(".template-note");
  }

  /** The refusal or failure of the last action. */
  alert(): Locator {
    return this.main.locator('.banner--warn[role="alert"]');
  }

  reloadButton(): Locator {
    return control(this.alert(), "Reload");
  }
}
