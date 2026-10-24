import { Locator, Page } from "@playwright/test";
import { AuthCardPage } from "../auth-card.page.js";
import { PageSlug } from "../../fixtures/routes.js";

/**
 * Admin sign in — pages/admin.sign-in.html. The same auth card as the
 * family app with the admin title; the `gate` state lives on the same mock
 * page and, in the app, replaces every screen for a non-admin.
 */
export class AdminSignInPage extends AuthCardPage {
  readonly slug: PageSlug = "admin";

  constructor(page: Page) {
    super(page);
  }

  /** `body[data-screen="sign-in"]` plus the card. */
  async waitForScreen(screen = "sign-in"): Promise<void> {
    await this.page.waitForSelector(`body[data-page="admin"][data-screen="${screen}"]`, {
      state: "attached",
      timeout: 10_000,
    });
    await this.card().waitFor({ state: "attached", timeout: 10_000 });
  }

  emailInput(state?: string): Locator {
    return this.field("Email", state);
  }

  passwordInput(state?: string): Locator {
    return this.field("Password", state);
  }

  signInButton(state?: string): Locator {
    return this.card(state).getByRole("button", { name: "Sign in", exact: true });
  }

  /** The "or" rule between the password form and the Google button (L2-182). */
  orDivider(state?: string): Locator {
    return this.card(state).getByRole("separator", { name: "or", exact: true });
  }

  /**
   * "Continue with Google": the mock's `.btn--google` stand-in, or, in the
   * app, the button Google Identity Services (or the e2e fake) renders
   * into the `.google-btn` host.
   */
  googleButton(state?: string): Locator {
    return this.card(state).getByRole("button", { name: "Continue with Google", exact: true });
  }

  /** The `.google-btn` host element the app reserves for Google's button. */
  googleHost(state?: string): Locator {
    return this.card(state).locator(".google-btn");
  }

  rememberToggle(state?: string): Locator {
    return this.card(state).getByRole("switch", { name: "Remember me" });
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.signInButton().click();
  }
}
