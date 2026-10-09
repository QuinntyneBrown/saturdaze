import { Locator, Page } from "@playwright/test";
import { AuthCardPage } from "./auth-card.page.js";
import { PageSlug } from "../fixtures/routes.js";

export type AcceptInviteState = "join" | "invalid";

/**
 * Accept invite — pages/accept-invite.html, two stacked states (L2-127):
 *   join     "Join {family} on Saturdaze" · Email (read-only) · Password · Confirm password · [Join the family]
 *   invalid  "This invite no longer works" · [Sign in]
 * App: `/accept-invite?token=` previews the invitation, then shows join | invalid.
 */
export class AcceptInvitePage extends AuthCardPage {
  readonly slug: PageSlug = "accept-invite";

  constructor(page: Page) {
    super(page);
  }

  /** Opens the link the owner shared, keeping only its path and query. */
  async open(inviteUrl: string): Promise<void> {
    const url = new URL(inviteUrl, "http://localhost");
    await this.page.goto(`${url.pathname}${url.search}`);
    await this.waitForReady();
  }

  emailField(state?: AcceptInviteState): Locator {
    return this.field("Email", state);
  }

  async join(password: string): Promise<void> {
    await this.field("Password", "join").fill(password);
    await this.field("Confirm password", "join").fill(password);
    await this.action("Join the family", "join").click();
  }

  signInLink(state?: AcceptInviteState): Locator {
    return this.action("Sign in", state);
  }
}
