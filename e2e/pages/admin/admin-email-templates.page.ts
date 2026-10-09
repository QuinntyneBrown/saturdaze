import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";

/**
 * Email templates (A8) — pages/admin.emails.html.
 *
 *   .page-header     "Email templates" · [New template]
 *   .toolbar         Search field · Category select · Status select
 *   .toolbar__count  "6 templates"
 *   .template-list   .template-row  .list__title · .template-row__key
 *                    · .template-row__chips .chip (category, status, System)
 *                    · .template-row__updated "Updated … UTC by …"
 *   .empty           "No templates match"
 */
const exactly = (text: string): RegExp => new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

export class AdminEmailTemplatesPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".template-list, .empty__title");
  }

  rows(): Locator {
    return this.main.locator(".template-row");
  }

  /** The row whose name is exactly `name` ("Copy of …" duplicates are other rows). */
  row(name: string): Locator {
    return this.rows().filter({ has: this.page.locator(".list__title", { hasText: exactly(name) }) });
  }

  rowByKey(key: string): Locator {
    return this.rows().filter({ has: this.page.locator(".template-row__key", { hasText: exactly(key) }) });
  }

  rowKey(row: Locator): Locator {
    return row.locator(".template-row__key");
  }

  rowChips(row: Locator): Locator {
    return row.locator(".template-row__chips .chip");
  }

  /** Each row's category chip text, top to bottom. */
  rowCategories(): Promise<string[]> {
    return this.rows().locator(".template-row__chips .chip:first-child").allTextContents();
  }

  rowUpdated(row: Locator): Locator {
    return row.locator(".template-row__updated");
  }

  /** The row's link to the editor: the row in the mock, its `a.list__item` in the app. */
  rowLink(row: Locator): Locator {
    return row.locator(
      'xpath=descendant-or-self::a[contains(concat(" ", normalize-space(@class), " "), " list__item ")]',
    );
  }

  searchInput(): Locator {
    return this.main.getByLabel("Search", { exact: true });
  }

  categorySelect(): Locator {
    return this.main.getByLabel("Category", { exact: true });
  }

  statusSelect(): Locator {
    return this.main.getByLabel("Status", { exact: true });
  }

  count(): Locator {
    return this.main.locator(".toolbar__count");
  }

  newTemplateButton(): Locator {
    return this.headerAction("New template");
  }
}
