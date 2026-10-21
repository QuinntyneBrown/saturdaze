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
 *     Calendar              Google connected: "Google Calendar" (email · synced …) [Disconnect] + switch "Plan around my calendar"; needs reconnect: .banner[role=alert] + [Reconnect];
 *                           not connected: "Connect Google Calendar" · "Subscribe from another calendar"; link on: "Subscription link is on" [Stop] + ghost "Get a new link" (L2-166, L2-172)
 *     Admin (.admin-only)   "Review submissions" row + count chip — Admin role only
 *     Account               .account-card (avatar · email · "Signed in since …" · [Add photo | Change photo] · [Sign out])
 *
 *   D17b sign-in choice     "Will they sign in?" radios (No sign-in | Invite to sign in) · Email when inviting (L2-125, L2-126)
 *   D30 Invite link dialog  .copy-field__value (the accept-invite link) · [Done]
 *
 *   D31 Connect Google      what Saturdaze writes and reads · [Not now] · [Continue to Google] (error state: warn banner)
 *   D32 Disconnect          [Keep it] · [Disconnect]
 *   D33 Subscription link   .copy-field__value (webcal URL) · [Copy link] · per-app steps · [Stop the link] · [Done]
 *   D34 Stop the link       [Keep it] · [Stop the link]
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

  /** The track of the "Will they sign in?" segmented choice in D17b. */
  signInTrack(): Locator {
    return this.dialog().getByRole("radiogroup");
  }

  /** The chosen option of that choice (the segment that carries the selected edge). */
  selectedSignInOption(): Locator {
    return this.signInTrack().locator(".seg-radio__opt").filter({ has: this.page.locator("input:checked") });
  }

  signInChoice(option: "No sign-in" | "Invite to sign in"): Locator {
    return this.dialog().getByRole("radio", { name: option, exact: true });
  }

  dialogFieldHint(): Locator {
    return this.dialog().locator(".field__hint");
  }

  dialogFieldError(): Locator {
    return this.dialog().locator(".field__error");
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

  /** A value's chip in the open Likes and dislikes dialog. */
  dialogChip(value: string): Locator {
    return this.dialog().locator(".chip").filter({ hasText: value });
  }

  /** The error line under one of the dialog's chip inputs. */
  dialogChipError(field: "Likes" | "Dislikes"): Locator {
    return this.dialog()
      .locator("sd-chip-input")
      .filter({ has: this.page.locator(".field__label", { hasText: field }) })
      .locator(".field__error");
  }

  chipInputStatus(field: "Likes" | "Dislikes"): Locator {
    return this.dialogField(field)
      .locator("xpath=ancestor::sd-chip-input")
      .getByRole("status");
  }

  /** Types a value into one of the dialog's chip inputs and adds it as a chip. */
  async addDialogChip(field: "Likes" | "Dislikes", value: string): Promise<void> {
    const input = this.dialogField(field);
    await input.fill(value);
    await input.press("Enter");
  }

  /**
   * Taps `px` above the top edge of a chip's visible remove glyph, centred
   * on it — inside a 24px target around the 16px glyph, outside the glyph.
   */
  async tapJustAboveRemoveGlyph(value: string, px: number): Promise<void> {
    const glyph = this.dialog().getByRole("button", { name: `Remove ${value}`, exact: true });
    const box = await glyph.boundingBox();
    if (!box) throw new Error(`No remove button for ${value}`);
    await this.page.mouse.click(box.x + box.width / 2, box.y - px);
  }

  /* ---------- Preferences ---------- */

  preferencesSection(): Locator {
    return this.section("Preferences");
  }

  /** `role="switch"` input named by its visually-hidden label. */
  toggle(name: "Budget matters" | "Try something new each weekend" | "Friday preview email"): Locator {
    return this.preferencesSection().getByRole("switch", { name, exact: true });
  }

  /* ---------- Calendar (L2-166, L2-172) ---------- */

  calendarSection(): Locator {
    return this.section("Calendar");
  }

  /** A row of the Calendar section by its title ("Subscribe from another calendar", "Google Calendar"…). */
  calendarRow(title: string): Locator {
    return this.calendarSection()
      .locator(".list__item")
      .filter({ has: this.page.locator(".list__title", { hasText: title }) });
  }

  calendarRows(): Locator {
    return this.calendarSection().locator(".list__item");
  }

  subscribeRow(): Locator {
    return this.calendarRow("Subscribe from another calendar");
  }

  connectGoogleRow(): Locator {
    return this.calendarRow("Connect Google Calendar");
  }

  /** The connected (or needs-reconnect) Google row: title "Google Calendar", the account's email in its sub. */
  googleRow(): Locator {
    return this.calendarSection()
      .locator(".list__item")
      .filter({ has: this.page.locator(".list__title", { hasText: /^\s*Google Calendar\s*$/ }) });
  }

  disconnectGoogleButton(): Locator {
    return control(this.calendarSection(), "Disconnect");
  }

  reconnectGoogleButton(): Locator {
    return control(this.googleRow(), "Reconnect");
  }

  readCommitmentsToggle(): Locator {
    return this.calendarSection().getByRole("switch", { name: "Plan around my calendar", exact: true });
  }

  /** The Calendar section's banner: the needs-reconnect alert or the consent-denied note. */
  calendarBanner(): Locator {
    return this.calendarSection().locator(".banner");
  }

  /** The warn banner inside the open connect dialog (D31's error state). */
  dialogBanner(): Locator {
    return this.dialog().locator(".banner");
  }

  /** The return route Google sends the browser back to (stood in for by the spec). */
  async returnFromGoogle(query: string): Promise<void> {
    await this.page.goto(`/family/calendar/google?${query}`);
    await this.waitForReady();
  }

  feedOnRow(): Locator {
    return this.calendarRow("Subscription link is on");
  }

  stopFeedButton(): Locator {
    return control(this.feedOnRow(), "Stop");
  }

  newFeedLinkRow(): Locator {
    return control(this.calendarSection(), "Get a new link");
  }

  /** The subscription URL D33 shows once. */
  feedUrl(): Locator {
    return this.dialog().locator(".copy-field__value");
  }

  copyFeedButton(): Locator {
    return this.dialog().getByRole("button", { name: /Copy link|Copied/ });
  }

  /** Opens D33 from a row and waits for the link `POST /api/calendar/feed` minted. */
  async createFeedFrom(trigger: Locator): Promise<void> {
    const minted = this.page.waitForResponse(
      (r) => r.url().endsWith("/api/calendar/feed") && r.request().method() === "POST",
    );
    await trigger.click();
    await minted;
    await this.feedUrl().waitFor();
  }

  /** Confirms D34; resolves once `DELETE /api/calendar/feed` has answered. */
  async confirmStopFeed(): Promise<void> {
    const stopped = this.page.waitForResponse(
      (r) => r.url().endsWith("/api/calendar/feed") && r.request().method() === "DELETE",
    );
    await this.dialogAction("Stop the link").click();
    await stopped;
    await this.dialog().waitFor({ state: "detached" });
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
