// <sd-empty title="..." subtitle="..." icon="...">

import { SdElement } from "./sd-base.js";

class SdEmpty extends SdElement {
  static get observedAttributes() { return ["title", "subtitle", "icon"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }
  styles() {
    return `
      :host { display: block; text-align: center; padding: 48px 24px; color: var(--sd-ink-soft); }
      sd-icon { color: var(--sd-ink-faint); margin-bottom: 12px; }
      h3 { font-size: var(--sd-fs-md); font-weight: var(--sd-fw-semibold); color: var(--sd-ink); margin: 0 0 4px; }
      p  { margin: 0 0 16px; font-size: var(--sd-fs-sm); }
    `;
  }
  template() {
    return `
      <sd-icon name="${this.attr("icon", "sparkle")}" size="32"></sd-icon>
      <h3>${this.attr("title", "Nothing here yet")}</h3>
      <p>${this.attr("subtitle", "")}</p>
      <slot></slot>
    `;
  }
}
customElements.define("sd-empty", SdEmpty);
