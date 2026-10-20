import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";
import { control } from "../base.page.js";

/**
 * Invitations (A8) — pages/admin.invitations.html (L2-157, L2-158).
 *
 *   .page-header  "Invitations" · [New sample weekend] → /invitations/samples/new · [Invite families] → AD7
 *   .sample-list  .sample-row  .list__title family name · .list__sub dates, members, home · .chip status
 *   .invite-list  .invite-row  .list__title email · .list__sub sample line · .list__sub meta line
 *                 · .invite-row__trail .chip status · [Revoke] → AD8 (pending rows only)
 *   .empty        "No invites yet" when nothing was sent
 *
 *   AD7 (#dialog-admin-invite)  Emails chip input · Sample weekend select · Message · [Send invites]
 *   AD8 (#dialog-admin-revoke)  "Revoke this invite?" · [Revoke]
 */
export class AdminInvitationsPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".invite-list, .empty__title");
  }

  inviteFamiliesButton(): Locator {
    return control(this.pageHeader, "Invite families");
  }

  newSampleWeekendButton(): Locator {
    return control(this.pageHeader, "New sample weekend");
  }

  /* ---------- Sample weekends ---------- */

  sampleRows(): Locator {
    return this.main.locator(".sample-list .sample-row");
  }

  sampleRow(familyName: string): Locator {
    return this.sampleRows().filter({ has: this.page.locator(".list__title", { hasText: familyName }) });
  }

  sampleRowStatus(row: Locator): Locator {
    return row.locator(".chip");
  }

  /* ---------- Invites ---------- */

  inviteRows(): Locator {
    return this.main.locator(".invite-list .invite-row");
  }

  inviteRow(email: string): Locator {
    return this.inviteRows().filter({ has: this.page.locator(".list__title", { hasText: email }) });
  }

  inviteRowStatus(row: Locator): Locator {
    return row.locator(".invite-row__trail .chip");
  }

  inviteRowMeta(row: Locator): Locator {
    return row.locator(".list__sub").last();
  }

  inviteRowSample(row: Locator): Locator {
    return row.locator(".list__sub").first();
  }

  revokeButton(row: Locator): Locator {
    return control(row, "Revoke");
  }

  emptyTitle(): Locator {
    return this.main.locator(".empty__title");
  }

  emptyInviteButton(): Locator {
    return control(this.main.locator(".empty"), "Invite families");
  }

  /* ---------- AD7 · Invite families ---------- */

  inviteDialog(): Locator {
    return this.dialog();
  }

  /** The bare input of the Emails chip field. */
  emailsInput(): Locator {
    return this.inviteDialog().getByLabel("Emails", { exact: true });
  }

  /** Types each address and commits it with Enter. */
  async enterEmails(emails: readonly string[]): Promise<void> {
    for (const email of emails) {
      await this.emailsInput().fill(email);
      await this.emailsInput().press("Enter");
    }
  }

  emailChips(): Locator {
    return this.inviteDialog().locator(".chip-input .chip");
  }

  sampleWeekendSelect(): Locator {
    return this.inviteDialog().getByLabel("Sample weekend", { exact: true });
  }

  messageInput(): Locator {
    return this.inviteDialog().getByLabel("Message", { exact: true });
  }

  sendInvitesButton(): Locator {
    return this.inviteDialog().getByRole("button", { name: "Send invites", exact: true });
  }

  inviteDialogError(): Locator {
    return this.inviteDialog().locator('[role="alert"], .field__error');
  }

  /* ---------- AD8 · Revoke ---------- */

  revokeDialog(): Locator {
    return this.dialog();
  }

  confirmRevokeButton(): Locator {
    return this.revokeDialog().getByRole("button", { name: "Revoke", exact: true });
  }
}
