import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";

/**
 * Activity log (A7) — pages/admin.activity.html.
 *
 *   .page-header  "Activity log"
 *   .toolbar      Place select · Administrator select
 *   .audit-list   under 720px: the feed, li.audit-row  .audit-row__time · .audit-row__who · .audit-row__place · .chip · .audit-row__change
 *   .table-wrap   from 720px: table.audit-table, th[scope=col] Time · Who · Place · Action · Change, tr.audit-row with the same element classes
 *   .pager        "1 to 5 of 5" · Previous · Next
 */
export class AdminActivityPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".audit-list, .empty__title");
  }

  /** The records in whichever form the width shows: feed rows or table rows. */
  rows(): Locator {
    return this.main.locator(".audit-row").filter({ visible: true });
  }

  /** The stacked activity feed shown under 720px. */
  feed(): Locator {
    return this.main.locator(".audit-list");
  }

  /** The log as a table, shown from 720px. */
  logTable(): Locator {
    return this.main.getByRole("table");
  }

  columnHeaders(): Locator {
    return this.logTable().getByRole("columnheader");
  }

  /** The cell of the given body row that sits under the column header with this text. */
  async cellUnder(column: string, rowIndex: number): Promise<Locator> {
    const headers = (await this.columnHeaders().allTextContents()).map((t) => t.trim());
    const index = headers.indexOf(column);
    if (index < 0) throw new Error(`No "${column}" column header; headers are ${headers.join(", ")}`);
    return this.logTable().locator("tbody").getByRole("row").nth(rowIndex).getByRole("cell").nth(index);
  }

  rowTime(row: Locator): Locator {
    return row.locator(".audit-row__time");
  }

  rowWho(row: Locator): Locator {
    return row.locator(".audit-row__who");
  }

  rowPlace(row: Locator): Locator {
    return row.locator(".audit-row__place");
  }

  rowAction(row: Locator): Locator {
    return row.locator(".chip");
  }

  rowChange(row: Locator): Locator {
    return row.locator(".audit-row__change");
  }

  placeSelect(): Locator {
    return this.main.getByLabel("Place", { exact: true });
  }

  adminSelect(): Locator {
    return this.main.getByLabel("Administrator", { exact: true });
  }

  pagerText(): Locator {
    return this.main.locator(".pager__text");
  }
}
