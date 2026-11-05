import { Locator, Page } from "@playwright/test";
import { BasePage, control } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * A couple's date — pages/weekend.date.html (L2-225).
 *
 * Structure:
 *   .page-header  eyebrow "This weekend" · "{Meal} date" · "{Day} · {time} · {names}"
 *                 actions: Move · Regenerate · Cancel date
 *   .banner--warn[role=note]  "Kids need care …"
 *   .section "The plan" > ol.day__list > li.block (drives, the meal, the activity)
 *     li.block.date-step--meal ("Swap restaurant"), li.block.date-step--activity ("Change activity");
 *     below 720px each row's chevron opens the same dialog
 *   .status-row[role=status] while a change is planned; .banner--warn[role=alert] on a 409
 */
export class DatePage extends BasePage {
  readonly slug: PageSlug = "date";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".date-plan .block, .date-missing");
  }

  steps(): Locator {
    return this.main.locator(".date-plan .block");
  }

  stepTitles(): Locator {
    return this.steps().locator(".block__title");
  }

  /** The meal row ("Dinner at Snug Harbour"). */
  mealTitle(): Locator {
    return this.main.locator(".date-plan .date-step--meal .block__title");
  }

  /** The activity row, when the date has one. */
  activityStep(): Locator {
    return this.main.locator(".date-plan .date-step--activity");
  }

  careBanner(): Locator {
    return this.main.locator(".date-care");
  }

  errorBanner(): Locator {
    return this.main.locator('.banner--warn[role="alert"]');
  }

  /** "Swap restaurant" on the meal row; below 720px its chevron (the actions are hidden there). */
  swapRestaurantButton(): Locator {
    const meal = this.main.locator(".date-plan .date-step--meal");
    return meal
      .getByRole("button", { name: /^Swap restaurant/ })
      .or(meal.locator(".block__chev"))
      .filter({ visible: true });
  }

  /** "Change activity" on the activity row; below 720px its chevron. */
  changeActivityButton(): Locator {
    return this.activityStep()
      .getByRole("button", { name: /^Change activity/ })
      .or(this.activityStep().locator(".block__chev"))
      .filter({ visible: true });
  }

  addActivityButton(): Locator {
    return control(this.main, "Add a nearby activity");
  }

  moveButton(): Locator {
    return control(this.pageActions(), "Move");
  }

  regenerateButton(): Locator {
    return control(this.pageActions(), "Regenerate");
  }

  cancelButton(): Locator {
    return control(this.pageActions(), "Cancel date");
  }

  backLink(): Locator {
    return this.pageHeader.getByRole("link", { name: "This weekend" });
  }

  /** A seg-radio option in the open dialog (Meal, Day). */
  dialogOption(name: string): Locator {
    return this.dialog().getByRole("radio", { name, exact: true });
  }
}
