import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Itinerary detail — pages/itinerary.html.
 *
 * Contract:
 *   - top-bar shows "Saturday" with back link, refresh + more icon buttons
 *   - master pane: day header (eyebrow / title / sub + sun icon),
 *     sd-tag-group with four chips (locked / driving / outdoor / hi)
 *   - section "The day at a glance" → day-switcher with Sat (active) + Sun
 *   - section "Weekend totals" → four stat tiles
 *   - footer action row: Regenerate + Lock day buttons
 *   - detail pane (desktop): full Saturday timeline (10 blocks)
 *   - mobile: timeline duplicated under #mobile-timeline
 */
export class ItineraryPage extends BasePage {
  /* ---------- Header ---------- */

  eyebrow(): Locator {
    return this.page.locator(".it-eyebrow");
  }

  title(): Locator {
    return this.page.locator(".it-title");
  }

  subtitle(): Locator {
    return this.page.locator(".it-sub");
  }

  sunIcon(): Locator {
    return this.page.locator(".it-sun-icon");
  }

  /* ---------- Header chips ---------- */

  headerTagGroup(): Locator {
    return this.page.locator(".it-head sd-tag-group").first();
  }

  headerChips(): Locator {
    return this.headerTagGroup().locator("sd-chip");
  }

  /* ---------- Day switcher ---------- */

  daySwitcher(): Locator {
    return this.page.locator(".day-switcher");
  }

  dayOption(day: "Saturday" | "Sunday"): Locator {
    return this.daySwitcher()
      .locator(".opt")
      .filter({ hasText: day });
  }

  activeDayOption(): Locator {
    return this.daySwitcher().locator('.opt[data-active="true"]');
  }

  /* ---------- Weekend totals ---------- */

  weekendStats(): Locator {
    return this.page.locator(".weekend-stats");
  }

  stat(label: string): Locator {
    return this.weekendStats()
      .locator(".stat")
      .filter({ hasText: label });
  }

  /* ---------- Footer actions ---------- */

  regenerateButton(): Locator {
    return this.page
      .locator(".it-actions sd-button")
      .filter({ hasText: "Regenerate" });
  }

  lockDayButton(): Locator {
    return this.page
      .locator(".it-actions sd-button")
      .filter({ hasText: "Lock day" });
  }

  /* ---------- Timeline ---------- */

  /** Master + mobile + detail blocks. Use viewport-aware variants below
   *  when you only want the visible ones. */
  allTimelineBlocks(): Locator {
    return this.page.locator("sd-timeline-block");
  }

  desktopTimelineBlocks(): Locator {
    return this.page.locator('[slot="detail"] sd-timeline-block');
  }

  mobileTimelineBlocks(): Locator {
    return this.page.locator("#mobile-timeline sd-timeline-block");
  }

  timelineBlockByTitle(title: string): Locator {
    return this.allTimelineBlocks().filter({
      has: this.page.locator(`[title="${title}"], :scope[title="${title}"]`),
    });
  }

  lockedTimelineBlocks(): Locator {
    return this.page.locator("sd-timeline-block[locked]");
  }
}
