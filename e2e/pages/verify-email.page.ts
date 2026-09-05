import { Locator, Page } from "@playwright/test";
import { AuthCardPage } from "./auth-card.page.js";
import { PageSlug } from "../fixtures/routes.js";

export type VerifyState = "sent" | "verifying" | "verified" | "expired";

/**
 * Verify email — pages/verify-email.html, four stacked states:
 *   sent       "Check your email" (right after creating an account) · [Resend] · [Skip to this weekend]
 *   verifying  role=status "Verifying your email"
 *   verified   "You are verified" · [Set up your family] · [Skip to this weekend]
 *   expired    "This link has expired" · [Resend verification email] · [Back to sign in]
 * App: `/verify-email?token=` drives verifying → verified | expired; `?state=` overrides.
 */
export class VerifyEmailPage extends AuthCardPage {
  readonly slug: PageSlug = "verify-email";

  constructor(page: Page) {
    super(page);
  }

  /** The verifying card is a live region. */
  statusCard(state?: VerifyState): Locator {
    return this.scope(state).locator('.auth-card[role="status"]');
  }

  resendButton(state?: VerifyState): Locator {
    return this.card(state).getByRole("button", { name: "Resend", exact: true });
  }

  resendVerificationButton(state?: VerifyState): Locator {
    return this.card(state).getByRole("button", { name: "Resend verification email", exact: true });
  }

  skipToWeekendLink(state?: VerifyState): Locator {
    return this.action("Skip to this weekend", state);
  }

  setUpFamilyLink(state?: VerifyState): Locator {
    return this.action("Set up your family", state);
  }

  backToSignInLink(state?: VerifyState): Locator {
    return this.action("Back to sign in", state);
  }
}
