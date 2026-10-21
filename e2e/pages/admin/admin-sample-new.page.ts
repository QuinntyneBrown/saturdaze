import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";
import { control } from "../base.page.js";

/**
 * New sample weekend (A9) — pages/admin.sample.new.html (L2-159).
 *
 *   .page-header  "New sample weekend"
 *   .sample-form  Family name · Home · Members (.member-row: Name · Age · Remove) · [Add a member]
 *                 · Likes chip input · Weekend select · [Cancel] [Generate weekend]
 */
export class AdminSampleNewPage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".sample-form");
  }

  get form(): Locator {
    return this.main.locator(".sample-form");
  }

  familyNameInput(): Locator {
    return this.form.getByLabel("Family name", { exact: true });
  }

  homeInput(): Locator {
    return this.form.getByLabel("Home", { exact: true });
  }

  memberRows(): Locator {
    return this.form.locator(".member-row");
  }

  memberName(row: Locator): Locator {
    return row.getByLabel("Name", { exact: true });
  }

  memberAge(row: Locator): Locator {
    return row.getByLabel("Age", { exact: true });
  }

  addMemberButton(): Locator {
    return control(this.form, "Add a member");
  }

  /** Fills the member rows in order, adding rows as needed. */
  async enterMembers(
    members: readonly { name: string; age: number }[],
  ): Promise<void> {
    for (let i = 0; i < members.length; i++) {
      if ((await this.memberRows().count()) <= i)
        await this.addMemberButton().click();
      const row = this.memberRows().nth(i);
      await this.memberName(row).fill(members[i].name);
      await this.memberAge(row).fill(String(members[i].age));
    }
  }

  likesInput(): Locator {
    return this.form.getByLabel("Likes", { exact: true });
  }

  weekendSelect(): Locator {
    return this.form.getByLabel("Weekend", { exact: true });
  }

  generateButton(): Locator {
    return this.form.getByRole("button", {
      name: "Generate weekend",
      exact: true,
    });
  }

  cancelLink(): Locator {
    return control(this.form, "Cancel");
  }

  formError(): Locator {
    return this.form.locator('[role="alert"]');
  }
}
