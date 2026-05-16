import { Locator } from "@playwright/test";
import { BasePage } from "./base.page.js";

/**
 * Component gallery — pages/components.html.
 *
 * Hosts the presentation atoms in isolation. Visual tests in this POM are
 * what catch off-spec colour/spacing/typography for the design system.
 */
export class ComponentsGalleryPage extends BasePage {
  galleryHeading(): Locator {
    return this.page.locator("h1").filter({ hasText: "Component gallery" });
  }

  section(name: string): Locator {
    return this.page.locator("section").filter({
      has: this.page.locator(`h2:has-text("${name}")`),
    });
  }

  /* ---------- Buttons section ---------- */

  buttonsSection(): Locator {
    return this.section("Buttons");
  }

  buttonByVariant(variant: "primary" | "secondary" | "ghost" | "danger" | "disabled"): Locator {
    if (variant === "disabled") {
      return this.buttonsSection().locator("sd-button[disabled]");
    }
    if (variant === "primary") {
      // Primary is the default — no variant attribute.
      return this.buttonsSection()
        .locator("sd-button:not([variant]):not([disabled])")
        .first();
    }
    return this.buttonsSection().locator(`sd-button[variant="${variant}"]`);
  }

  buttonBySize(size: "sm" | "md" | "lg"): Locator {
    if (size === "md") {
      // Default size — no size attribute.
      return this.buttonsSection()
        .locator("sd-button:not([size]):not([disabled]):not([variant])")
        .nth(0);
    }
    return this.buttonsSection().locator(`sd-button[size="${size}"]`);
  }

  /* ---------- Icon buttons ---------- */

  iconButton(icon: string): Locator {
    return this.section("Icon buttons").locator(
      `sd-icon-button[icon="${icon}"]`
    );
  }

  /* ---------- Chips ---------- */

  chip(tone: string | "default"): Locator {
    if (tone === "default") {
      return this.section("Chips").locator("sd-chip:not([tone])");
    }
    return this.section("Chips").locator(`sd-chip[tone="${tone}"]`);
  }

  /* ---------- Avatars ---------- */

  avatar(name: string, size?: "sm" | "lg" | "xl"): Locator {
    const sel = size
      ? `sd-avatar[name="${name}"][size="${size}"]`
      : `sd-avatar[name="${name}"]:not([size])`;
    return this.section("Avatars").locator(sel);
  }

  /* ---------- Inputs ---------- */

  textInput(label: string): Locator {
    return this.section("Inputs").locator(`sd-text-input[label="${label}"]`);
  }

  toggle(label: string): Locator {
    return this.section("Inputs").locator(`sd-toggle[label="${label}"]`);
  }

  /* ---------- Cards ---------- */

  card(variant: "default" | "raised" | "sunk"): Locator {
    if (variant === "default") {
      return this.section("Cards").locator("sd-card:not([variant])");
    }
    return this.section("Cards").locator(`sd-card[variant="${variant}"]`);
  }

  /* ---------- List items ---------- */

  listItem(title: string): Locator {
    return this.section("List items").locator(`sd-list-item[title="${title}"]`);
  }

  /* ---------- Weather strip ---------- */

  weatherStrip(): Locator {
    return this.section("Weather strip").locator("sd-weather-strip");
  }

  /* ---------- Timeline blocks ---------- */

  timelineBlock(title: string): Locator {
    return this.section("Timeline block").locator(
      `sd-timeline-block[title="${title}"]`
    );
  }

  /* ---------- Anticipate ---------- */

  anticipate(): Locator {
    return this.section("Anticipate callout").locator("sd-anticipate");
  }

  /* ---------- Empty state ---------- */

  emptyState(): Locator {
    return this.section("Empty state").locator("sd-empty");
  }
}
