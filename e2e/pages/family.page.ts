import { Locator, Page } from "@playwright/test";
import { BasePage, control } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

/**
 * Family — pages/family.html.
 *
 *   .page-header "The Browns" + home subtitle
 *   .family-grid (1 col; 1.2fr 1fr ≥1024)
 *     Who's in              ul.list--card > a.list__item--action (avatar · name · "Parent · 38" / "Kid · 9") + .ghost-row "Add a family member"
 *     Locked in every weekend  a.list__item--action (disc · title · "Saturdays · 9:00 to 10:00") + .ghost-row "Add a commitment"
 *     Home                  [Edit] · li.list__item (home location)
 *     Likes and dislikes    [Edit] · .cluster > .chip--leaf (likes) / .chip--warn (dislikes)
 *     Preferences           li.list__item + label.toggle > input.toggle__input[role=switch]
 *     Admin (.admin-only)   "Review submissions" row + count chip — Admin role only
 *     Account               .account-card (avatar · email · "Signed in since …" · [Sign out])
 */
export class FamilyPage extends BasePage {
  readonly slug: PageSlug = "family";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".family-grid .section-header__title");
  }

  get grid(): Locator {
    return this.main.locator(".family-grid");
  }

  /* ---------- Members ---------- */

  membersSection(): Locator {
    return this.section("Who's in");
  }

  memberRows(): Locator {
    return this.membersSection().locator(".list__item");
  }

  memberRow(name: string): Locator {
    return this.memberRows().filter({ has: this.page.locator(".list__title", { hasText: name }) });
  }

  rowTitle(row: Locator): Locator {
    return row.locator(".list__title");
  }

  rowSubtitle(row: Locator): Locator {
    return row.locator(".list__sub");
  }

  addMemberRow(): Locator {
    return control(this.membersSection(), "Add a family member");
  }

  /* ---------- Commitments ---------- */

  commitmentsSection(): Locator {
    return this.section("Locked in every weekend");
  }

  commitmentRows(): Locator {
    return this.commitmentsSection().locator(".list__item");
  }

  commitmentRow(title: string): Locator {
    return this.commitmentRows().filter({ has: this.page.locator(".list__title", { hasText: title }) });
  }

  addCommitmentRow(): Locator {
    return control(this.commitmentsSection(), "Add a commitment");
  }

  /* ---------- Home ---------- */

  homeSection(): Locator {
    return this.section("Home");
  }

  homeRow(): Locator {
    return this.homeSection().locator(".list__item");
  }

  editHomeButton(): Locator {
    return control(this.homeSection().locator(".section-header"), "Edit");
  }

  /* ---------- Likes ---------- */

  likesSection(): Locator {
    return this.section("Likes and dislikes");
  }

  editLikesButton(): Locator {
    return control(this.likesSection().locator(".section-header"), "Edit");
  }

  likeChips(): Locator {
    return this.likesSection().locator(".chip.chip--leaf");
  }

  dislikeChips(): Locator {
    return this.likesSection().locator(".chip.chip--warn");
  }

  /* ---------- Preferences ---------- */

  preferencesSection(): Locator {
    return this.section("Preferences");
  }

  /** `role="switch"` input named by its visually-hidden label. */
  toggle(name: "Budget matters" | "Try something new each weekend" | "Friday preview email"): Locator {
    return this.preferencesSection().getByRole("switch", { name, exact: true });
  }

  /* ---------- Admin ---------- */

  adminSection(): Locator {
    return this.main.locator(".section.admin-only");
  }

  reviewSubmissionsRow(): Locator {
    return this.adminSection().locator(".list__item").filter({ hasText: "Review submissions" });
  }

  pendingCountChip(): Locator {
    return this.adminSection().locator(".chip--count");
  }

  /* ---------- Account ---------- */

  accountSection(): Locator {
    return this.section("Account");
  }

  accountCard(): Locator {
    return this.accountSection().locator(".account-card");
  }

  accountEmail(): Locator {
    return this.accountCard().locator(".list__title");
  }

  accountSince(): Locator {
    return this.accountCard().locator(".list__sub");
  }

  signOutButton(): Locator {
    return control(this.accountCard(), "Sign out");
  }
}
