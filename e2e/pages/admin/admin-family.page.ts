import { expect, Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";
import { control, DayName } from "../base.page.js";

/**
 * Family weekend (A9) — pages/admin.family.html (L2-159 → L2-161).
 *
 *   .page-header   eyebrow "Families" · the family's name · "home · N members · M accounts · Weekend of …"
 *                  [Regenerate weekend]
 *   .planner__toolbar  [role=tablist] Saturday | Sunday
 *   .planner#<day>-panel[role=tabpanel] > .day  (the family app's day: .day__header, .day__actions
 *                  "Regenerate <Day>" / "Lock day: <Day>", ol.day__list > li.block with .block__actions
 *                  "Why this: …", "Swap …", "Lock …"/"Unlock …")
 *   .empty         "Nothing is drafted for {family} yet" + "Plan this weekend"
 *   .changes       .audit-list .audit-row  .audit-row__time · .audit-row__who · .chip · .audit-row__change
 *   .past-weekends .list--card .list__item  .list__title · .list__sub
 */
export class AdminFamilyPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".day__header, .empty__title");
  }

  /** Behaviour specs: wait until the timeline shows real blocks. */
  async waitForPlan(): Promise<void> {
    await this.waitForScreen("family");
    await expect(this.skeletonRows()).toHaveCount(0, { timeout: 30_000 });
    await expect(this.days()).toHaveCount(1, { timeout: 30_000 });
  }

  backLink(): Locator {
    return this.pageHeader.locator('.page-header__eyebrow, [aria-label="Back to Families"]').filter({ visible: true });
  }

  regenerateWeekendButton(): Locator {
    return this.headerAction("Regenerate weekend");
  }

  planButton(): Locator {
    return this.emptyCta("Plan this weekend");
  }

  /* ---------- Days ---------- */

  dayTab(name: DayName): Locator {
    return this.main.getByRole("tab", { name, exact: true });
  }

  days(): Locator {
    return this.main.locator(".planner .day");
  }

  day(name: DayName): Locator {
    return this.days().filter({ has: this.page.locator(".day__title", { hasText: name }) });
  }

  dayMeta(name: DayName): Locator {
    return this.day(name).locator(".day__meta");
  }

  regenerateDayButton(name: DayName): Locator {
    return control(this.day(name), `Regenerate ${name}`);
  }

  /** "Lock day: <Day>" (aria-pressed=false) / "Unlock day: <Day>" (aria-pressed=true). */
  lockDayButton(name: DayName): Locator {
    return this.day(name).locator(".day__header .day__actions button[aria-pressed]");
  }

  /* ---------- Blocks ---------- */

  blocks(name?: DayName): Locator {
    return (name ? this.day(name) : this.main.locator(".planner")).locator(".block");
  }

  block(title: string, name?: DayName): Locator {
    return this.blocks(name).filter({ has: this.page.locator(".block__title", { hasText: title }) });
  }

  blockTitle(block: Locator): Locator {
    return block.locator(".block__title");
  }

  blockChips(block: Locator): Locator {
    return block.locator(".block__chips .chip");
  }

  /** Planner blocks an administrator can act on (everything but drives and commitments). */
  actionableBlocks(name?: DayName): Locator {
    return (name ? this.day(name) : this.main.locator(".planner")).locator(
      ".block:not(.block--drive):not(.block--commitment)",
    );
  }

  whyButton(block: Locator): Locator {
    return block.locator('[aria-label^="Why this: "], [aria-label^="About "]');
  }

  swapButton(block: Locator): Locator {
    return block.locator('[aria-label^="Swap "]');
  }

  /** "Lock <title>" (aria-pressed=false) / "Unlock <title>" (aria-pressed=true). */
  lockButton(block: Locator): Locator {
    return block.locator('[aria-label^="Lock "], [aria-label^="Unlock "]');
  }

  /* ---------- Changes and past weekends ---------- */

  changes(): Locator {
    return this.main.locator(".changes");
  }

  changeRows(): Locator {
    return this.changes().locator(".audit-row");
  }

  changeWho(row: Locator): Locator {
    return row.locator(".audit-row__who");
  }

  changeAction(row: Locator): Locator {
    return row.locator(".chip");
  }

  changeSummary(row: Locator): Locator {
    return row.locator(".audit-row__change");
  }

  noChanges(): Locator {
    return this.changes().locator(".status-row");
  }

  pastWeekends(): Locator {
    return this.main.locator(".past-weekends");
  }

  pastRows(): Locator {
    return this.pastWeekends().locator(".list__item");
  }

  noPastWeekends(): Locator {
    return this.pastWeekends().locator(".status-row");
  }
}
