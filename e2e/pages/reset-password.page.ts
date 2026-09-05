import { Locator, Page } from "@playwright/test";
import { AuthCardPage } from "./auth-card.page.js";
import { PageSlug } from "../fixtures/routes.js";

export type ResetState = "request" | "sent" | "new" | "done" | "expired";

/**
 * Reset password — pages/reset-password.html, five stacked states:
 *   request  "Reset your password" · Email · [Send reset link]
 *   sent     "Check your email" · .email-chip · [Resend]
 *   new      "Choose a new password" · New password (+ .strength) · Confirm · [Save password]
 *   done     "Password updated" · [Sign in]
 *   expired  "This link has expired" · [Send a new link] · [Back to sign in]
 * App: `/reset-password` (request), `?token=` (new), `?state=` overrides.
 */
export class ResetPasswordPage extends AuthCardPage {
  readonly slug: PageSlug = "reset-password";

  constructor(page: Page) {
    super(page);
  }

  emailInput(state?: ResetState): Locator {
    return this.field("Email", state);
  }

  sendLinkButton(state?: ResetState): Locator {
    return this.card(state).getByRole("button", { name: "Send reset link", exact: true });
  }

  resendButton(state?: ResetState): Locator {
    return this.card(state).getByRole("button", { name: "Resend", exact: true });
  }

  newPasswordInput(state?: ResetState): Locator {
    return this.field("New password", state);
  }

  confirmPasswordInput(state?: ResetState): Locator {
    return this.field("Confirm password", state);
  }

  savePasswordButton(state?: ResetState): Locator {
    return this.card(state).getByRole("button", { name: "Save password", exact: true });
  }

  /** Done state primary. */
  signInButton(state?: ResetState): Locator {
    return this.action("Sign in", state);
  }

  /** Expired state primary. */
  sendNewLinkButton(state?: ResetState): Locator {
    return this.action("Send a new link", state);
  }

  backToSignInLink(state?: ResetState): Locator {
    return this.action("Back to sign in", state);
  }
}
