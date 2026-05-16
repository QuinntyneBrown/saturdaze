// <sd-card variant="default|raised|sunk" padding="sm|md|lg">
// The all-purpose container. Most surfaces compose from this.

import { SdElement } from "./sd-base.js";

class SdCard extends SdElement {
  static get observedAttributes() { return ["variant", "padding", "interactive"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host {
        display: block;
        background: var(--sd-surface);
        border-radius: var(--sd-r-lg);
        border: 1px solid var(--sd-line);
        overflow: hidden;
      }
      .pad { padding: 16px; }
      :host([padding="sm"]) .pad { padding: 12px; }
      :host([padding="lg"]) .pad { padding: 20px; }
      :host([variant="raised"]) { box-shadow: var(--sd-shadow-2); border-color: transparent; }
      :host([variant="sunk"])   { background: var(--sd-surface-2); border-color: transparent; }
      :host([interactive]) { cursor: pointer; transition: transform var(--sd-dur-fast) var(--sd-ease), box-shadow var(--sd-dur-fast) var(--sd-ease); }
      :host([interactive]:hover) { transform: translateY(-1px); box-shadow: var(--sd-shadow-2); }
    `;
  }

  template() { return `<div class="pad"><slot></slot></div>`; }
}

customElements.define("sd-card", SdCard);
