import { Locator, Page } from "@playwright/test";
import { AuthCardPage } from "./auth-card.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Create account — pages/create-account.html (single state).
 * Family name · Email · Password (+ .strength meter) · Terms checkbox
 * (required, gates the primary) · Friday preview checkbox · [Create account].
 */
export class CreateAccountPage extends AuthCardPage {
  readonly slug: PageSlug = "create-account";

  constructor(page: Page) {
    super(page);
  }

  familyNameInput(): Locator {
    return this.field("Family name");
  }

  emailInput(): Locator {
    return this.field("Email");
  }

  passwordInput(): Locator {
    return this.field("Password");
  }

  termsCheckbox(): Locator {
    return this.card().getByRole("checkbox", { name: /I agree to the Terms/ });
  }

  fridayPreviewCheckbox(): Locator {
    return this.card().getByRole("checkbox", { name: /Friday preview/ });
  }

  createButton(): Locator {
    return this.card().getByRole("button", { name: "Create account", exact: true });
  }

  signInLink(): Locator {
    return this.altLink("Sign in");
  }

  termsLink(): Locator {
    return this.card().locator(".check").getByRole("link", { name: "Terms", exact: true });
  }

  privacyLink(): Locator {
    return this.card().locator(".check").getByRole("link", { name: "Privacy Policy", exact: true });
  }

  async fill(input: { familyName: string; email: string; password: string }): Promise<void> {
    await this.familyNameInput().fill(input.familyName);
    await this.emailInput().fill(input.email);
    await this.passwordInput().fill(input.password);
  }
}
