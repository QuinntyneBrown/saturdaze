import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";
import { control } from "../base.page.js";

export type SampleDayName = "Saturday" | "Sunday";

/**
 * Sample weekend (A10) — pages/admin.sample.html (L2-160).
 *
 *   .page-header   "{family} · sample weekend" · [Regenerate] [Edit family] [Send invite] → AD7
 *   .sample-meta   status chips ("Invited · 2", "1 locked")
 *   .sample-days   .day[aria-labelledby]  .day__title · .day__meta · .day__list .block
 *                  .block__title · .block__actions  [Swap {title}] · [Lock {title}] / [Unlock {title}]
 */
export class AdminSamplePage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".sample-days .block, .empty__title");
  }

  get grid(): Locator {
    return this.main.locator(".sample-days");
  }

  day(name: SampleDayName): Locator {
    return this.grid
      .locator(".day")
      .filter({ has: this.page.locator(".day__title", { hasText: name }) });
  }

  blocks(name?: SampleDayName): Locator {
    return (name ? this.day(name) : this.grid).locator(".block");
  }

  block(title: string, name?: SampleDayName): Locator {
    return this.blocks(name).filter({
      has: this.page.locator(".block__title", { hasText: title }),
    });
  }

  blockTitle(block: Locator): Locator {
    return block.locator(".block__title");
  }

  /** Blocks that offer Swap: unlocked activities. */
  swappableBlocks(name?: SampleDayName): Locator {
    return this.blocks(name).filter({
      has: this.page.locator('[aria-label^="Swap "]'),
    });
  }

  swapButton(block: Locator): Locator {
    return block.locator('[aria-label^="Swap "]');
  }

  /** "Lock {title}" (aria-pressed=false) / "Unlock {title}" (aria-pressed=true). */
  lockButton(block: Locator): Locator {
    return block.locator('[aria-label^="Lock "], [aria-label^="Unlock "]');
  }

  regenerateButton(): Locator {
    return control(this.pageHeader, "Regenerate");
  }

  editFamilyLink(): Locator {
    return control(this.pageHeader, "Edit family");
  }

  sendInviteButton(): Locator {
    return control(this.pageHeader, "Send invite");
  }

  metaChips(): Locator {
    return this.main.locator(".sample-meta .chip");
  }

  /** How many columns the days grid resolves to at the current viewport. */
  async dayColumns(): Promise<number> {
    return this.grid.evaluate(
      (el) =>
        getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length,
    );
  }

  /* ---------- AD7 from this screen ---------- */

  sampleWeekendSelect(): Locator {
    return this.dialog().getByLabel("Sample weekend", { exact: true });
  }

  emailsInput(): Locator {
    return this.dialog().getByLabel("Emails", { exact: true });
  }

  sendInvitesButton(): Locator {
    return this.dialog().getByRole("button", {
      name: "Send invites",
      exact: true,
    });
  }
}
