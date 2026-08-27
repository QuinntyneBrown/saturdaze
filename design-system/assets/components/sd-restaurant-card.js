// <sd-restaurant-card name="..." style="..." near="..." drive="...">
// Restaurant pick with family vote row inside.

import { SdElement } from "./sd-base.js";

class SdRestaurantCard extends SdElement {
  static get observedAttributes() {
    return ["name", "style", "near", "drive", "wifeapproved", "icon"];
  }
  attributeChangedCallback() { if (this._rendered) this.render(); }
  styles() {
    return `
      :host { display: block; }
      .card {
        background: var(--sd-surface);
        border: 1px solid var(--sd-line);
        border-radius: var(--sd-r-lg);
        padding: 16px;
      }
      .head { display: flex; gap: 12px; align-items: flex-start; }
      .icon {
        width: 44px; height: 44px;
        background: var(--sd-primary-soft);
        color: var(--sd-primary);
        border-radius: var(--sd-r-md);
        display: inline-flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .name { font-weight: var(--sd-fw-semibold); font-size: var(--sd-fs-md); letter-spacing: -0.01em; }
      .style { color: var(--sd-ink-soft); font-size: var(--sd-fs-sm); margin-top: 2px; }
      .meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
      .votes { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--sd-line); }
      .votes-label { font-size: var(--sd-fs-xs); color: var(--sd-ink-soft); text-transform: uppercase; letter-spacing: 0.06em; font-weight: var(--sd-fw-semibold); margin-bottom: 8px; }
    `;
  }
  template() {
    const name = this.attr("name", "");
    const style = this.attr("style", "");
    const near = this.attr("near", "");
    const drive = this.attr("drive", "");
    const wife = this.battr("wifeapproved");
    return `
      <div class="card">
        <div class="head">
          <div class="icon"><sd-icon name="${this.attr("icon", "fork")}" size="22"></sd-icon></div>
          <div style="flex:1; min-width:0;">
            <div class="name">${name}</div>
            <div class="style">${style}${near ? ` &middot; ${near}` : ""}</div>
            <div class="meta">
              ${drive ? `<sd-chip tone="sky"><sd-icon name="car" size="12"></sd-icon> ${drive}</sd-chip>` : ""}
              ${wife ? `<sd-chip tone="accent"><sd-icon name="heart" size="12"></sd-icon> Wife-approved</sd-chip>` : ""}
              <slot name="chips"></slot>
            </div>
          </div>
        </div>
        <div class="votes">
          <div class="votes-label">Family vote</div>
          <slot name="votes"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define("sd-restaurant-card", SdRestaurantCard);
