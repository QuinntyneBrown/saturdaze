import { Locator } from "@playwright/test";
import { AuthShellPage } from "./auth-shell.page.js";

export class CheckEmailPage extends AuthShellPage {
  resendButton(): Locator {
    return this.authCard.locator('sd-button[data-action="resend"]');
  }

  resentNotice(): Locator {
    return this.authCard.locator('[role="status"]');
  }

  useDifferentLink(): Locator {
    return this.authCard.getByRole('link', { name: /different one/i });
  }
}
