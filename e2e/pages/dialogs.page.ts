import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Dialog & sheet gallery — pages/dialogs.html.
 *
 * The dialogs page renders every sd-dialog statically (open + static) so
 * all variants can be reviewed on one page. The POM exposes named handles
 * for each one.
 */
export class DialogsPage extends BasePage {
  galleryHeading(): Locator {
    return this.page.locator("h1").filter({ hasText: "Dialogs & sheets" });
  }

  allDialogs(): Locator {
    return this.page.locator("sd-dialog[static]");
  }

  dialog(title: string): Locator {
    return this.page.locator(`sd-dialog[title="${title}"]`);
  }

  /** Named handles matching demo-labels on the gallery page. */
  blockDetailDialog(): Locator {
    return this.dialog("Terre Bleu Lavender Farm");
  }

  regenerateDialog(): Locator {
    return this.dialog("Regenerate the weekend?");
  }

  swapDialog(): Locator {
    return this.dialog("Swap out Lavender Farm?");
  }

  voteDialog(): Locator {
    return this.dialog("Who's in for La Marina?");
  }

  addCommitmentDialog(): Locator {
    return this.dialog("Add a commitment");
  }

  errandDialog(): Locator {
    return this.dialog("Slot in an errand");
  }

  fridayPreviewDialog(): Locator {
    return this.dialog("Your weekend is ready 🌤");
  }

  shareDialog(): Locator {
    return this.dialog("Send Sara the plan?");
  }
}
