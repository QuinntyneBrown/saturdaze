import { Locator } from "@playwright/test";
import { AuthShellPage } from "./auth-shell.page.js";

/**
 * Sign-in — pages/login.html.
 *
 * Locators added in slice C2 (visual) and extended in C4–C6 (behaviour).
 * Inputs target the underlying `<input>` rendered by `sd-text-input` so
 * Playwright's `.fill()` / `.click()` behave like a real user.
 */
export class LoginPage extends AuthShellPage {
  emailInput(): Locator {
    return this.authCard.locator('sd-text-input[label="Email"] input');
  }

  passwordInput(): Locator {
    return this.authCard.locator('sd-text-input[label="Password"] input');
  }

  rememberToggle(): Locator {
    return this.authCard.locator('sd-toggle[label="Remember me"]');
  }

  forgotPasswordLink(): Locator {
    return this.authCard.getByRole('link', { name: 'Forgot password?' });
  }

  submitButton(): Locator {
    return this.authCard.locator('sd-button:has-text("Sign in")');
  }

  signupLink(): Locator {
    return this.authCard.getByRole('link', { name: 'Create an account' });
  }

  errorMessage(): Locator {
    return this.authCard.locator('[role="alert"]');
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
  }

  async submit(): Promise<void> {
    // sd-button renders a real <button> inside; click it directly so the
    // <form> (ngSubmit) actually fires.
    await this.submitButton().locator('button').click();
  }
}
