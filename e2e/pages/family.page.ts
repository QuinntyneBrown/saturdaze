import { Locator, Page, Request } from "@playwright/test";
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
 *     Account               .account-card (avatar · email · "Signed in since …" · [Add photo | Change photo] · [Sign out])
 *
 *   D17b sign-in choice     "Will they sign in?" radios (No sign-in | Invite to sign in) · Email when inviting (L2-125, L2-126)
 *   D30 Invite link dialog  .copy-field__value (the accept-invite link) · [Done]
 *
 *   D27 Profile photo dialog  .photo-picker (.photo-picker__preview avatar · input[type=file] · hint / .field__error)
 *                             actions: [Remove photo] (photo set only) · Cancel · Save
 */
export class FamilyPage extends BasePage {
  readonly slug: PageSlug = "family";

  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".family-grid .section-header__title");
  }

  /** Loads /family in this page's browser context (for a second signed-in person). */
  async open(): Promise<void> {
    await this.page.goto("/family");
    await this.waitForReady();
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

  membersSubtitle(): Locator {
    return this.membersSection().locator(".section-header__sub");
  }

  /** Rows that open the member dialog — only the owner's are actionable (L2-124 #4). */
  actionableMemberRows(): Locator {
    return this.membersSection().locator(".list__item--action");
  }

  /* ---------- Member sign-in (L1-037) ---------- */

  signInChoice(option: "No sign-in" | "Invite to sign in"): Locator {
    return this.dialog().getByRole("radio", { name: option, exact: true });
  }

  /** Fills D17b and submits it; resolves with the `POST /api/family/members` body sent. */
  async addMember(member: { name: string; age: number; inviteEmail?: string }): Promise<Record<string, unknown>> {
    await this.addMemberRow().click();
    await this.dialogField("Name").fill(member.name);
    await this.dialogField("Age").fill(String(member.age));
    if (member.inviteEmail) {
      await this.signInChoice("Invite to sign in").check();
      await this.dialogField("Email").fill(member.inviteEmail);
    }
    const posted = this.page.waitForRequest(
      (r) => r.url().endsWith("/api/family/members") && r.method() === "POST",
    );
    await this.dialogAction(member.inviteEmail ? "Send invite" : "Add member").click();
    return (await posted).postDataJSON() as Record<string, unknown>;
  }

  /** The accept-invite link shown in D30. */
  inviteLink(): Locator {
    return this.dialog().locator(".copy-field__value");
  }

  /** Opens D17 for the member and chooses Remove, leaving D21 open. */
  async startRemoving(name: string): Promise<void> {
    await this.memberRow(name).click();
    await this.dialogAction("Remove").click();
  }

  /** Confirms D21; resolves with the `DELETE /api/family/members/{id}` URLs sent. */
  async confirmRemoval(): Promise<string[]> {
    const deletes: string[] = [];
    const listener = (r: Request) => {
      if (r.method() === "DELETE" && /\/api\/family\/members\//.test(r.url())) deletes.push(r.url());
    };
    this.page.on("request", listener);
    const done = this.page.waitForResponse(
      (r) => r.request().method() === "DELETE" && /\/api\/family\/members\//.test(r.url()),
    );
    await this.dialogAction("Remove").click();
    await done;
    await this.dialog().waitFor({ state: "detached" });
    this.page.off("request", listener);
    return deletes;
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

  /* ---------- Profile photo (L2-087) ---------- */

  /** The Account card avatar: the initial, or the photo once one is set. */
  accountAvatar(): Locator {
    return this.accountCard().locator(".avatar").first();
  }

  accountAvatarPhoto(): Locator {
    return this.accountAvatar().locator("img.avatar__img");
  }

  addPhotoButton(): Locator {
    return control(this.accountCard(), "Add photo");
  }

  changePhotoButton(): Locator {
    return control(this.accountCard(), "Change photo");
  }

  /** Picks a file in the open Profile photo dialog (D27). */
  async choosePhoto(file: string | { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
    await this.dialog().locator('input[type="file"]').setInputFiles(file);
  }

  photoPreview(): Locator {
    return this.dialog().locator(".photo-picker__preview");
  }

  photoError(): Locator {
    return this.dialog().locator(".field__error");
  }
}
