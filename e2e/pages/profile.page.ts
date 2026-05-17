import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Family profile — pages/profile.html.
 *
 * Contract:
 *   - top-bar "Family profile" with back + more
 *   - centered "The Browns" heading + "Port Credit, Mississauga"
 *   - section "Who's in" — 4 sd-list-item (Quinn/Sara/Eli/Mae) + "Add"
 *   - section "Recurring commitments" — 3 items each with Locked chip + Add
 *   - section "Daily rhythm" — 2 items (out the door, bed by)
 *   - section "Likes & dislikes" — sd-tag-group with leaf/warn chips
 *   - section "Preferences" — sd-card with 3 sd-toggle rows (the 1st off,
 *     the other two checked)
 *   - sd-bottom-nav active=profile
 */
export class ProfilePage extends BasePage {
  familyName(): Locator {
    return this.page.locator("h2").filter({ hasText: "The Browns" });
  }

  location(): Locator {
    return this.page.locator("p").filter({ hasText: "Port Credit, Mississauga" });
  }

  /* ---------- Members ---------- */

  membersSection(): Locator {
    return this.sectionByTitle("Who's in");
  }

  memberRow(name: string): Locator {
    return this.membersSection().locator(`sd-list-item[title="${name}"]`);
  }

  addMemberRow(): Locator {
    return this.membersSection().locator(
      'sd-list-item[title="Add family member"]'
    );
  }

  memberAvatar(name: string): Locator {
    return this.memberRow(name).locator(`sd-avatar[name="${name}"]`);
  }

  /* ---------- Commitments ---------- */

  commitmentsSection(): Locator {
    return this.sectionByTitle("Recurring commitments");
  }

  commitmentRow(title: string): Locator {
    return this.commitmentsSection().locator(`sd-list-item[title="${title}"]`);
  }

  addCommitmentRow(): Locator {
    return this.commitmentsSection().locator(
      'sd-list-item[title="Add a commitment"]'
    );
  }

  /* ---------- Daily rhythm ---------- */

  rhythmSection(): Locator {
    return this.sectionByTitle("Daily rhythm");
  }

  /* ---------- Likes & dislikes ---------- */

  likesSection(): Locator {
    return this.sectionByTitle("Likes & dislikes");
  }

  likeChips(): Locator {
    return this.likesSection().locator('sd-chip[tone="leaf"]');
  }

  dislikeChips(): Locator {
    return this.likesSection().locator('sd-chip[tone="warn"]');
  }

  /* ---------- Preferences toggles ---------- */

  preferencesSection(): Locator {
    return this.sectionByTitle("Preferences");
  }

  toggles(): Locator {
    return this.preferencesSection().locator("sd-toggle");
  }

  toggleByLabel(label: string): Locator {
    return this.preferencesSection()
      .locator("div", { hasText: label })
      .locator("sd-toggle");
  }

  /* ---------- Account / sign-out ---------- */

  accountSection(): Locator {
    return this.sectionByTitle("Account");
  }

  accountEmail(): Locator {
    return this.accountSection().locator(".account-email");
  }

  signOutButton(): Locator {
    return this.accountSection().locator('sd-button[variant="danger"]');
  }

  async clickSignOut(): Promise<void> {
    await this.signOutButton().scrollIntoViewIfNeeded();
    await this.signOutButton().locator("button").click();
  }

  private sectionByTitle(title: string): Locator {
    return this.page.locator(`sd-section[title="${title}"]`);
  }
}
