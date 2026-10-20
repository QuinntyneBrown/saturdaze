import { Locator, Page } from "@playwright/test";
import { AuthCardPage } from "./auth-card.page.js";
import { control } from "./base.page.js";
import { PageSlug } from "../fixtures/routes.js";

export type WelcomeStep = "home" | "family" | "likes" | "preferences" | "done";

/**
 * Welcome — pages/welcome.html, the onboarding wizard (L2-158 to L2-163),
 * five stacked states in the mock and one route per step in the app:
 *   home         .stepper "Step 1 of 4" · "Where's home?" · Neighbourhood or address · [Continue] · Skip for now
 *   family       "Step 2 of 4" · "Who's in?" · ul.list--card member rows · .ghost-row "Add a family member" · [Continue] · Back · Skip for now
 *   likes        "Step 3 of 4" · "What does your family like?" · Likes / Dislikes chip inputs · [Continue] · Back · Skip for now
 *   preferences  "Step 4 of 4" · "A few preferences" · three role=switch toggles · [Continue] · Back · Skip for now
 *   done         no stepper · "You're set" · [Plan this weekend] · [Review your family]
 *
 *   D17b / D17 / D21 / D30 behave as on Family (family.page.ts).
 */
export class WelcomePage extends AuthCardPage {
  readonly slug: PageSlug = "welcome";

  constructor(page: Page) {
    super(page);
  }

  /** Opens a step directly in this page's browser context. */
  async open(step: WelcomeStep): Promise<void> {
    await this.page.goto(`/welcome/${step}`);
    await this.waitForReady();
  }

  /* ---------- Stepper (L2-158) ---------- */

  stepper(state?: WelcomeStep): Locator {
    return this.scope(state).locator(".stepper");
  }

  stepperLabel(state?: WelcomeStep): Locator {
    return this.stepper(state).locator(".stepper__label");
  }

  stepperTrack(state?: WelcomeStep): Locator {
    return this.stepper(state).locator(".stepper__track");
  }

  stepperSegments(state?: WelcomeStep): Locator {
    return this.stepperTrack(state).locator(".stepper__seg");
  }

  /* ---------- Navigation ---------- */

  continueButton(state?: WelcomeStep): Locator {
    return this.card(state).getByRole("button", { name: "Continue", exact: true });
  }

  backButton(state?: WelcomeStep): Locator {
    return control(this.card(state), "Back");
  }

  skipButton(state?: WelcomeStep): Locator {
    return control(this.card(state), "Skip for now");
  }

  /* ---------- Home step (L2-159) ---------- */

  /** The address field; its label also reads "Required". */
  homeInput(state?: WelcomeStep): Locator {
    return this.card(state).getByLabel(/^\s*Neighbourhood or address(\s+Required)?\s*$/);
  }

  /* ---------- Who's in (L2-160) ---------- */

  memberRows(state?: WelcomeStep): Locator {
    return this.card(state).locator(".list__item");
  }

  memberRow(name: string, state?: WelcomeStep): Locator {
    return this.memberRows(state).filter({ has: this.page.locator(".list__title", { hasText: name }) });
  }

  rowSubtitle(row: Locator): Locator {
    return row.locator(".list__sub");
  }

  addMemberRow(state?: WelcomeStep): Locator {
    return control(this.card(state), "Add a family member");
  }

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

  /* ---------- Likes (L2-161) ---------- */

  /** A dialog-free chip input on the likes step, by its label. */
  chipInput(label: "Likes" | "Dislikes", state?: WelcomeStep): Locator {
    return this.field(label, state);
  }

  chipInputError(label: "Likes" | "Dislikes"): Locator {
    return this.card()
      .locator("sd-chip-input")
      .filter({ has: this.page.locator(".field__label", { hasText: label }) })
      .locator(".field__error");
  }

  /** Types a value into one of the step's chip inputs and adds it as a chip. */
  async addChip(label: "Likes" | "Dislikes", value: string): Promise<void> {
    const input = this.chipInput(label);
    await input.fill(value);
    await input.press("Enter");
  }

  /* ---------- Preferences (L2-162) ---------- */

  toggle(name: "Budget matters" | "Try something new each weekend" | "Friday preview email", state?: WelcomeStep): Locator {
    return this.card(state).getByRole("switch", { name, exact: true });
  }

  /* ---------- Done (L2-163) ---------- */

  planWeekendLink(state?: WelcomeStep): Locator {
    return this.action("Plan this weekend", state);
  }

  reviewFamilyLink(state?: WelcomeStep): Locator {
    return this.action("Review your family", state);
  }

  /** Waits for the next `PUT /api/family` and resolves with its JSON body. */
  nextProfileSave(): Promise<Record<string, unknown>> {
    return this.page
      .waitForRequest((r) => r.url().endsWith("/api/family") && r.method() === "PUT")
      .then((r) => r.postDataJSON() as Record<string, unknown>);
  }
}
