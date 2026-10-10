import { expect, Locator, Page } from "@playwright/test";
import { BasePage, control, DayName } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Weekend — pages/weekend.html (+ .empty / .generating).
 *
 * Structure (ready state):
 *   .page-header  "This weekend" + subtitle + [More] + [Add to calendar] [Share]
 *   .planner__toolbar  [role=tablist] Saturday | Sunday   (one day at a time, L2-105)
 *   .planner#<day>-panel[role=tabpanel]
 *     .day (selected day)
 *       .day__header  weather disc · .day__title · .day__meta · .day__actions
 *                     ("Regenerate Saturday", "Lock Saturday"/"Unlock Saturday")
 *       ol.day__list > li.block (+ --commitment --locked --drive --errand --done)
 *          .block__time (.block__clock .block__dur) · .block__rail · .block__body
 *          (.block__title .block__sub .block__chips) · .block__actions
 *          ("Why this: …" | "About …", "Swap …", "Lock …"/"Unlock …", "Mark … done")
 *          · a.block__chev ("Details for …", <720)
 *       li.leg between blocks at different places: "N min · N km" (+ Directions > 10 min)
 *       .block__disc--num for numbered stops
 *       .ghost-row "Add an errand"
 *     aside.planner__map[aria-label="<Day> map"]  pins: home + button "Stop n: <title>"
 *       (stacked above the timeline < 1024px, sticky beside it ≥ 1024px; "Open map" < 1024px)
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
    await expect(this.days()).toHaveCount(1, { timeout: 30_000 });
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
    return this.main.locator(".planner");
  }

  days(): Locator {
    return this.grid.locator(".day");
  }

  day(name: DayName): Locator {
    return this.days().filter({
      has: this.page.locator(".day__title", { hasText: name }),
    });
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
    return this.day(name).getByRole("button", {
      name: new RegExp(`^(Lock|Unlock) ${name}$`),
    });
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
    return this.blocks(name).filter({
      has: this.page.locator(".block__title", { hasText: title }),
    });
  }

  /** The block titled `title` on `name` that starts at `clock` ("9:00"). */
  blockAt(title: string, name: DayName, clock: string): Locator {
    return this.block(title, name).filter({
      has: this.page.locator(".block__clock", { hasText: clock }),
    });
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
    return this.block(title, name).locator(
      `[aria-label="Why this: ${title}"], [aria-label="About ${title}"]`,
    );
  }

  swapButton(title: string, name?: DayName): Locator {
    return this.block(title, name).locator(`[aria-label="Swap ${title}"]`);
  }

  /** "Lock <title>" (aria-pressed=false) / "Unlock <title>" (aria-pressed=true). */
  lockButton(title: string, name?: DayName): Locator {
    return this.block(title, name).locator(
      `[aria-label="Lock ${title}"], [aria-label="Unlock ${title}"]`,
    );
  }

  doneButton(title: string, name?: DayName): Locator {
    return this.block(title, name).locator(`[aria-label="Mark ${title} done"]`);
  }

  commitmentBlocks(name?: DayName): Locator {
    return (name ? this.day(name) : this.grid).locator(
      ".block.block--commitment",
    );
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
    return (name ? this.day(name) : this.grid).locator(
      ".block:not(.block--drive):not(.block--commitment)",
    );
  }

  /* ---------- Header: the cover in the ready state, the page header otherwise ---------- */

  override pageTitle(): Locator {
    return this.main.locator(".page-header__title, .cover__title");
  }

  override pageSubtitle(): Locator {
    return this.main.locator(".page-header__subtitle, .cover__sub");
  }

  override headerAction(name: string): Locator {
    return control(this.pageActions(), name).or(
      control(this.coverActions(), name),
    );
  }

  override moreButton(): Locator {
    return this.pageHeader
      .locator(".page-header__more")
      .or(control(this.coverActions(), "More options"));
  }

  /* ---------- Cover (L2-108) ---------- */

  cover(): Locator {
    return this.main.locator(".cover");
  }

  coverImage(): Locator {
    return this.cover().locator("img.cover__img");
  }

  coverFallback(): Locator {
    return this.cover().locator(".cover__fallback");
  }

  coverTitle(): Locator {
    return this.cover().getByRole("heading", { level: 1 });
  }

  coverEyebrow(): Locator {
    return this.cover().locator(".cover__eyebrow");
  }

  coverSubtitle(): Locator {
    return this.cover().locator(".cover__sub");
  }

  coverCredit(): Locator {
    return this.cover().locator(".media__credit");
  }

  changePhotoButton(): Locator {
    return control(this.cover(), "Change photo");
  }

  /** Add to calendar / Share / More, in the row under the cover. */
  coverActions(): Locator {
    return this.main.locator(".cover-actions");
  }

  /** D29: one radio per stop photo, named by the stop. */
  coverPhotoOption(name: string): Locator {
    return this.dialog().getByRole("radio", { name, exact: true });
  }

  coverPhotoOptions(): Locator {
    return this.dialog().getByRole("radio");
  }

  /** D29: the "Your own photo" tile's file input (L2-109). */
  ownPhotoInput(): Locator {
    return this.dialog().getByLabel("Upload your own photo", { exact: true });
  }

  /** D29: the dashed "Your own photo" tile around the file input. */
  ownPhotoTile(): Locator {
    return this.dialog().locator(".photo-pick__upload");
  }

  /** Choose a family photo from disk, or an in-memory file, in D29. */
  async chooseOwnPhoto(
    file: string | { name: string; mimeType: string; buffer: Buffer },
  ): Promise<void> {
    await this.ownPhotoInput().setInputFiles(file);
  }

  /** D29's error banner: a client-side check or the server's refusal. */
  coverPhotoError(): Locator {
    return this.dialog().getByRole("alert");
  }

  /** True once the cover photo has been fetched and decoded. */
  async coverImageLoaded(): Promise<boolean> {
    return this.coverImage().evaluate(
      (img) =>
        (img as HTMLImageElement).complete &&
        (img as HTMLImageElement).naturalWidth > 0,
    );
  }

  /* ---------- Day tabs (L2-104, L2-105) ---------- */

  dayTab(name: DayName): Locator {
    return this.main.getByRole("tab", { name, exact: true });
  }

  async selectDay(name: DayName): Promise<void> {
    await this.dayTab(name).click();
    await expect(this.dayTitle(name)).toBeVisible();
  }

  /** Columns of the planner grid (timeline + map), from its computed template. */
  async plannerColumnCount(): Promise<number> {
    return this.grid
      .filter({ visible: true })
      .evaluate(
        (el) =>
          getComputedStyle(el).gridTemplateColumns.split(" ").filter(Boolean)
            .length,
      );
  }

  /** The visible day's timeline list. */
  timeline(): Locator {
    return this.grid.filter({ visible: true }).locator(".day");
  }

  /* ---------- Stops and legs (L2-102, L2-103) ---------- */

  /** Numbered stop discs in the visible day, in order. */
  stopDiscs(): Locator {
    return this.timeline().locator(".block__disc--num");
  }

  /** The block whose disc reads `n`. */
  stopBlock(n: number): Locator {
    return this.timeline()
      .locator(".block")
      .filter({
        has: this.page.locator(".block__disc--num", {
          hasText: new RegExp(`^${n}$`),
        }),
      });
  }

  legs(): Locator {
    return this.timeline().locator(".leg");
  }

  legText(leg: Locator): Locator {
    return leg.locator(".leg__text");
  }

  directionsLink(leg: Locator): Locator {
    return leg.getByRole("link", { name: "Directions" });
  }

  /** Minutes of each leg in the visible day, read from "N min · N km". */
  async legMinutes(): Promise<number[]> {
    const texts = await this.legs().locator(".leg__text").allTextContents();
    return texts.map((t) => Number(/(\d+) min/.exec(t)?.[1] ?? NaN));
  }

  /* ---------- Day map (L2-103, L2-104) ---------- */

  dayMap(name: DayName): Locator {
    return this.main.getByRole("complementary", { name: `${name} map` });
  }

  mapPins(name: DayName): Locator {
    return this.dayMap(name).getByRole("button", { name: /^Stop \d+: / });
  }

  mapPin(name: DayName, n: number): Locator {
    return this.dayMap(name).getByRole("button", {
      name: new RegExp(`^Stop ${n}: `),
    });
  }

  homePin(name: DayName): Locator {
    return this.dayMap(name).locator(".map__pin--home");
  }

  mapAttribution(name: DayName): Locator {
    return this.dayMap(name).locator(".map__attr");
  }

  homeDayMessage(name: DayName): Locator {
    return this.dayMap(name).getByText("A home day: nothing to map.");
  }

  openMapButton(): Locator {
    return control(this.grid.filter({ visible: true }), "Open map");
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
