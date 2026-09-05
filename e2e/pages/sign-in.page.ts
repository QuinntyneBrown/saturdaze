import { Locator, Page } from "@playwright/test";
import { AuthCardPage } from "./auth-card.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Sign in — pages/sign-in.html. States: `default`, `error` (`?state=error`
 * in the app renders the "did not match" banner with both fields
 * aria-invalid).
 */
export class SignInPage extends AuthCardPage {
  readonly slug: PageSlug = "sign-in";

  constructor(page: Page) {
    super(page);
  }

  emailInput(state?: string): Locator {
    return this.field("Email", state);
  }

  passwordInput(state?: string): Locator {
    return this.field("Password", state);
  }

  rememberToggle(state?: string): Locator {
    return this.card(state).getByRole("switch", { name: "Remember me", exact: true });
  }

  forgotPasswordLink(state?: string): Locator {
    return this.card(state).getByRole("link", { name: "Forgot password?", exact: true });
  }

  signInButton(state?: string): Locator {
    return this.card(state).getByRole("button", { name: "Sign in", exact: true });
  }

  createAccountLink(state?: string): Locator {
    return this.altLink("Create an account", state);
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
  }

  async submit(): Promise<void> {
    await this.signInButton().click();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }
}
