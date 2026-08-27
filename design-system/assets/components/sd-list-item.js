// <sd-list-item title="..." subtitle="..." href="...">
// Generic row. Leading + trailing slots for icons / chips / controls.

import { SdElement } from "./sd-base.js";

class SdListItem extends SdElement {
  static get observedAttributes() { return ["title", "subtitle", "href"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host { display: block; }
      .row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        background: var(--sd-surface);
        border: 1px solid var(--sd-line);
        border-radius: var(--sd-r-lg);
        color: var(--sd-ink);
        text-decoration: none;
        transition: background var(--sd-dur-fast) var(--sd-ease);
      }
      a.row:hover { background: var(--sd-surface-2); }
      .body { flex: 1; min-width: 0; }
      .title { font-weight: var(--sd-fw-semibold); font-size: var(--sd-fs-base); letter-spacing: -0.005em; }
      .subtitle { color: var(--sd-ink-soft); font-size: var(--sd-fs-sm); margin-top: 2px; }
      .trailing { display: flex; align-items: center; gap: 8px; color: var(--sd-ink-soft); }
      :host([compact]) .row { padding: 10px 12px; border-radius: var(--sd-r-md); }
      :host([flat]) .row { border-color: transparent; background: transparent; }
    `;
  }

  template() {
    const title = this.attr("title", "");
    const subtitle = this.attr("subtitle", "");
    const href = this.attr("href", "");
    const tag = href ? `a` : `div`;
    const hrefAttr = href ? `href="${href}"` : "";
    return `
      <${tag} class="row" ${hrefAttr}>
        <slot name="leading"></slot>
        <div class="body">
          ${title ? `<div class="title">${title}</div>` : ""}
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
          <slot></slot>
        </div>
        <div class="trailing"><slot name="trailing"></slot></div>
      </${tag}>
    `;
  }
}

customElements.define("sd-list-item", SdListItem);
