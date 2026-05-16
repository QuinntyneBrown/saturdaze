// <sd-activity-card title="..." subtitle="..." drive="..." why="..." tone="...">
// Suggestion card. Image is a tinted swatch in the skeleton.

import { SdElement } from "./sd-base.js";

class SdActivityCard extends SdElement {
  static get observedAttributes() {
    return ["title", "subtitle", "drive", "why", "icon", "tone", "ages", "tag"];
  }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host { display: block; }
      .card {
        background: var(--sd-surface);
        border: 1px solid var(--sd-line);
        border-radius: var(--sd-r-lg);
        overflow: hidden;
        transition: transform var(--sd-dur-fast) var(--sd-ease), box-shadow var(--sd-dur-fast) var(--sd-ease);
      }
      .card:hover { transform: translateY(-1px); box-shadow: var(--sd-shadow-2); }
      .image {
        height: 110px;
        position: relative;
        background: linear-gradient(135deg, var(--sd-primary-soft), #FBEBC4);
        display: flex; align-items: center; justify-content: center;
        color: var(--sd-primary);
      }
      :host([tone="outdoor"]) .image  { background: linear-gradient(135deg, #DDEEDA, #DCE9F1); color: var(--sd-accent); }
      :host([tone="indoor"]) .image   { background: linear-gradient(135deg, #EADFF4, #FBEBC4); color: #5A3B82; }
      :host([tone="food"]) .image     { background: linear-gradient(135deg, #FBEBC4, var(--sd-primary-soft)); color: #8A6212; }
      .image .corner-tag {
        position: absolute; top: 10px; left: 10px;
      }
      .body { padding: 14px 16px 16px; }
      .title { font-size: var(--sd-fs-md); font-weight: var(--sd-fw-semibold); letter-spacing: -0.01em; }
      .subtitle { color: var(--sd-ink-soft); font-size: var(--sd-fs-sm); margin-top: 2px; }
      .why {
        margin-top: 12px;
        padding: 10px 12px;
        background: var(--sd-surface-2);
        border-radius: var(--sd-r-md);
        font-size: var(--sd-fs-sm);
        color: var(--sd-ink);
        display: flex; gap: 8px; align-items: flex-start;
      }
      .why sd-icon { color: var(--sd-primary); flex-shrink: 0; margin-top: 2px; }
      .meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
    `;
  }

  template() {
    const title = this.attr("title", "");
    const subtitle = this.attr("subtitle", "");
    const drive = this.attr("drive", "");
    const why = this.attr("why", "");
    const icon = this.attr("icon", "tree");
    const ages = this.attr("ages", "");
    const tag = this.attr("tag", "");

    return `
      <div class="card">
        <div class="image">
          <sd-icon name="${icon}" size="44"></sd-icon>
          ${tag ? `<div class="corner-tag"><sd-chip tone="primary">${tag}</sd-chip></div>` : ""}
        </div>
        <div class="body">
          <div class="title">${title}</div>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
          <div class="meta">
            ${drive ? `<sd-chip tone="sky"><sd-icon name="car" size="12"></sd-icon> ${drive}</sd-chip>` : ""}
            ${ages ? `<sd-chip tone="leaf">Ages ${ages}</sd-chip>` : ""}
            <slot name="chips"></slot>
          </div>
          ${why ? `
            <div class="why">
              <sd-icon name="sparkle" size="14"></sd-icon>
              <span>${why}</span>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }
}

customElements.define("sd-activity-card", SdActivityCard);
