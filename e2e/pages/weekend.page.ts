import { expect, Locator, Page } from "@playwright/test";
import { BasePage, control, DayName } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Weekend — pages/weekend.html (+ .empty / .generating).
 *
 * Structure (ready state):
 *   .page-header  "This weekend" + subtitle + [More] + [Add to calendar] [Share]
 *   .grid-days
 *     .day (Saturday)
 *       .day__header  weather disc · .day__title · .day__meta · .day__actions
 *                     ("Regenerate Saturday", "Lock Saturday"/"Unlock Saturday")
 *       ol.day__list > li.block (+ --commitment --locked --drive --errand --done)
 *          .block__time (.block__clock .block__dur) · .block__rail · .block__body
 *          (.block__title .block__sub .block__chips) · .block__actions
 *          ("Why this: …" | "About …", "Swap …", "Lock …"/"Unlock …", "Mark … done")
 *          · a.block__chev ("Details for …", <720)
 *       .ghost-row "Add an errand"
 *     .day (Sunday) …
 *
 * Empty: .empty.empty--warm "Saturday and Sunday, drafted around the Browns"
 *        + "Planned around" list (.list--card → Family).
 * Generating: main[aria-busy] + .status-row[role=status] + .skeleton-row × 6 per day.
 */
export class WeekendPage extends BasePage {
  readonly slug: PageSlug = "weekend";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".day__header, .empty__title");
  }

  /** Behaviour specs: wait until the planner has produced real blocks. */
  async waitForPlan(): Promise<void> {
    await this.waitForReady();
    await expect(this.skeletonRows()).toHaveCount(0, { timeout: 30_000 });
    await expect(this.days()).toHaveCount(2, { timeout: 30_000 });
  }

  /* ---------- Header actions ---------- */

  shareButton(): Locator {
    return this.headerAction("Share");
  }

  addToCalendarButton(): Locator {
    return this.headerAction("Add to calendar");
  }

  /* ---------- Days ---------- */

  get grid(): Locator {
    return this.main.locator(".grid-days");
  }

  days(): Locator {
    return this.grid.locator(".day");
  }

  day(name: DayName): Locator {
    return this.days().filter({ has: this.page.locator(".day__title", { hasText: name }) });
  }

  dayHeader(name: DayName): Locator {
    return this.day(name).locator(".day__header");
  }

  dayTitle(name: DayName): Locator {
    return this.day(name).locator(".day__title");
  }

  dayMeta(name: DayName): Locator {
    return this.day(name).locator(".day__meta");
  }

  dayWeatherDisc(name: DayName): Locator {
    return this.dayHeader(name).locator(".weather-disc");
  }

  regenerateDayButton(name: DayName): Locator {
    return control(this.day(name), `Regenerate ${name}`);
  }

  /** "Lock Saturday" (aria-pressed=false) / "Unlock Saturday" (aria-pressed=true). */
  lockDayButton(name: DayName): Locator {
    return this.day(name).getByRole("button", { name: new RegExp(`^(Lock|Unlock) ${name}$`) });
  }

  ghostRow(name: DayName): Locator {
    return this.day(name).locator(".ghost-row");
  }

  addErrandRow(name: DayName): Locator {
    return control(this.day(name), "Add an errand");
  }

  /* ---------- Blocks ---------- */

  blocks(name?: DayName): Locator {
    return (name ? this.day(name) : this.grid).locator(".block");
  }

  block(title: string, name?: DayName): Locator {
    return this.blocks(name).filter({ has: this.page.locator(".block__title", { hasText: title }) });
  }

  blockTitle(block: Locator): Locator {
    return block.locator(".block__title");
  }

  blockSubtitle(block: Locator): Locator {
    return block.locator(".block__sub");
  }

  blockChips(block: Locator): Locator {
    return block.locator(".block__chips .chip");
  }

  blockClock(block: Locator): Locator {
    return block.locator(".block__clock");
  }

  blockDuration(block: Locator): Locator {
    return block.locator(".block__dur");
  }

  /** The `<720` chevron → block details dialog. */
  blockChevron(block: Locator): Locator {
    return block.locator(".block__chev");
  }

  /** "Why this: <title>" (planner blocks) or "About <title>" (commitments). */
  whyButton(title: string, name?: DayName): Locator {
    return this.block(title, name).locator(`[aria-label="Why this: ${title}"], [aria-label="About ${title}"]`);
  }

  swapButton(title: string, name?: DayName): Locator {
    return this.block(title, name).locator(`[aria-label="Swap ${title}"]`);
  }

  /** "Lock <title>" (aria-pressed=false) / "Unlock <title>" (aria-pressed=true). */
  lockButton(title: string, name?: DayName): Locator {
    return this.block(title, name).locator(`[aria-label="Lock ${title}"], [aria-label="Unlock ${title}"]`);
  }

  doneButton(title: string, name?: DayName): Locator {
    return this.block(title, name).locator(`[aria-label="Mark ${title} done"]`);
  }

  commitmentBlocks(name?: DayName): Locator {
    return (name ? this.day(name) : this.grid).locator(".block.block--commitment");
  }

  lockedBlocks(name?: DayName): Locator {
    return (name ? this.day(name) : this.grid).locator(".block.block--locked");
  }

  errandBlocks(name?: DayName): Locator {
    return (name ? this.day(name) : this.grid).locator(".block.block--errand");
  }

  driveBlocks(name?: DayName): Locator {
    return (name ? this.day(name) : this.grid).locator(".block.block--drive");
  }

  /** Planner blocks the user can act on (everything but drives). */
  actionableBlocks(name?: DayName): Locator {
    return (name ? this.day(name) : this.grid).locator(".block:not(.block--drive):not(.block--commitment)");
  }

  /* ---------- Empty state ---------- */

  planButton(): Locator {
    return this.emptyCta("Plan this weekend");
  }

  plannedAroundSection(): Locator {
    return this.section("Planned around");
  }

  plannedAroundRows(): Locator {
    return this.plannedAroundSection().locator(".list__item");
  }
}
