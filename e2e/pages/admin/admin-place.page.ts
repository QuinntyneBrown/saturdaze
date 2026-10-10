import { Locator, Page } from "@playwright/test";
import { AdminPage } from "./admin.page.js";
import { control } from "../base.page.js";

/**
 * Place photos (A4) — pages/admin.place.html.
 *
 *   .page-header  eyebrow "Places" · title · "Activity · 4 photos · 5 weekend covers follow this place"
 *                 [Upload photo] [Add from URL]
 *   .preview-grid .preview  idea card (.card--media) · thumbnails · .cover
 *   .photo-grid   .photo-tile  .photo-tile__media · .photo-tile__badges .chip · .details · .photo-tile__actions
 *   .empty        "No photos yet" when the place has none
 */
export class AdminPlacePage extends AdminPage {
  constructor(page: Page) {
    super(page);
  }

  protected readyAnchor(): Locator {
    return this.page.locator(".photo-grid, .empty__title");
  }

  backLink(): Locator {
    return this.pageHeader.locator('.page-header__eyebrow, [aria-label="Back to Places"]').filter({ visible: true });
  }

  /* ---------- Previews ---------- */

  previews(): Locator {
    return this.main.locator(".preview");
  }

  preview(label: RegExp): Locator {
    return this.previews().filter({ has: this.page.locator(".preview__label", { hasText: label }) });
  }

  previewCard(): Locator {
    return this.preview(/Idea card/).locator(".card--media");
  }

  /** The name pill over the 4:3 photo-pick tile in the thumbnail preview. */
  previewPickName(): Locator {
    return this.preview(/Thumbnail/).locator(".photo-pick__name");
  }

  previewCover(): Locator {
    return this.preview(/cover/).locator(".cover");
  }

  /* ---------- Tiles ---------- */

  get photoGrid(): Locator {
    return this.main.locator(".photo-grid");
  }

  tiles(): Locator {
    return this.photoGrid.locator(".photo-tile");
  }

  /** A tile by its alt-text detail (the image itself may be a fallback when its host is unreachable). */
  tile(alt: string): Locator {
    return this.tiles().filter({ has: this.page.locator(".details__value", { hasText: alt }) });
  }

  primaryTile(): Locator {
    return this.tiles().filter({ has: this.page.locator(".chip", { hasText: "Primary" }) });
  }

  tileBadges(tile: Locator): Locator {
    return tile.locator(".photo-tile__badges .chip");
  }

  tileDetail(tile: Locator, label: "Alt text" | "Credit" | "Licence" | "Size"): Locator {
    return tile.locator(".details__label", { hasText: label }).locator("xpath=following-sibling::dd[1]");
  }

  tileAction(tile: Locator, name: string): Locator {
    return control(tile.locator(".photo-tile__actions"), name);
  }

  /* ---------- Header actions and dialogs ---------- */

  uploadButton(): Locator {
    return this.headerAction("Upload photo");
  }

  addFromUrlButton(): Locator {
    return this.headerAction("Add from URL");
  }

  /** AD2's address field and its inline reason. */
  urlInput(): Locator {
    return this.dialog().getByLabel("Image URL");
  }

  urlError(): Locator {
    return this.dialog().locator(".field__error");
  }

  /** AD1's file input ("Choose a photo"). */
  uploadFileInput(): Locator {
    return this.dialog().getByLabel("Choose a photo", { exact: true });
  }

  /** AD1 / AD3: alt text, attribution and licence (a required field's label also reads "Required"). */
  async fillPhotoDetails(details: { alt?: string; attribution?: string; licence?: string }): Promise<void> {
    if (details.alt !== undefined) await this.dialogField("Alt text").fill(details.alt);
    if (details.attribution !== undefined) await this.dialog().getByLabel("Attribution").fill(details.attribution);
    if (details.licence !== undefined) await this.dialogField("Licence").selectOption(details.licence);
  }

  dialogBanner(): Locator {
    return this.dialog().locator('.banner--warn[role="alert"]');
  }

  /** AD5's next-primary picker: a radio per sibling plus "No photo". */
  nextPrimaryOptions(): Locator {
    return this.dialog().locator('.photo-pick input[type="radio"]');
  }

  nextPrimaryOption(name: string | RegExp): Locator {
    return this.dialog().getByRole("radio", { name });
  }
}
