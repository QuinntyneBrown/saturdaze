import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Home / "This Weekend" — pages/home.html.
 *
 * Structure (top → bottom):
 *   1. sd-top-bar with calendar / share icon-buttons
 *   2. sd-split-view (master+detail; detail visible on >=1024px only)
 *        master:
 *          - sd-hero (greeting, subtitle, primary CTA)
 *          - sd-section "The forecast" → sd-weather-strip with two days
 *          - sd-section "Your weekend" → two sd-day-card (Sat / Sun)
 *          - sd-section "A heads-up"   → two sd-anticipate callouts
 *          - sd-section "Quick actions" → three sd-list-item rows
 *        detail (desktop):
 *          - live preview pane with 5 sd-timeline-block
 *          - regenerate + open-saturday buttons
 *   3. sd-bottom-nav active=home
 */
export class HomePage extends BasePage {
  /* ---------- Top bar ---------- */

  topBarCalendarButton(): Locator {
    return this.topBar.locator('sd-icon-button[icon="calendar"]');
  }

  topBarShareButton(): Locator {
    return this.topBar.locator('sd-icon-button[icon="share"]');
  }

  /* ---------- Hero ---------- */

  get hero(): Locator {
    return this.page.locator("sd-hero");
  }

  heroCtaButton(): Locator {
    // The hero exposes its CTA either as an internal button or via its
    // `cta` attribute rendered as a sd-button — accept both.
    return this.hero.locator(
      'sd-button, button:has-text("Plan This Weekend")'
    );
  }

  /* ---------- Forecast ---------- */

  forecastSection(): Locator {
    return this.sectionByTitle("The forecast");
  }

  weatherStrip(): Locator {
    return this.page.locator("sd-weather-strip");
  }

  weatherDay(day: "Saturday" | "Sunday"): Locator {
    return this.page.locator(`sd-weather-day[day="${day}"]`);
  }

  /* ---------- Day cards ---------- */

  daySection(): Locator {
    return this.sectionByTitle("Your weekend");
  }

  dayCard(day: "Saturday" | "Sunday"): Locator {
    return this.page.locator(`sd-day-card[day="${day}"]`);
  }

  /* ---------- Anticipated heads-up ---------- */

  anticipateSection(): Locator {
    return this.sectionByTitle("A heads-up");
  }

  anticipateCallouts(): Locator {
    return this.anticipateSection().locator("sd-anticipate");
  }

  /* ---------- Quick actions ---------- */

  quickActionsSection(): Locator {
    return this.sectionByTitle("Quick actions");
  }

  quickAction(titleText: string): Locator {
    return this.quickActionsSection().locator(
      `sd-list-item[title="${titleText}"]`
    );
  }

  /* ---------- Desktop detail pane ---------- */

  detailPane(): Locator {
    return this.page.locator(".detail-pane");
  }

  detailTimelineBlocks(): Locator {
    return this.detailPane().locator("sd-timeline-block");
  }

  /* ---------- Helpers ---------- */

  private sectionByTitle(title: string): Locator {
    return this.page.locator(`sd-section[title="${title}"]`);
  }
}
