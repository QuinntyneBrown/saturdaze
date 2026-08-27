// <sd-chip tone="default|sun|sky|leaf|indoor|warn|accent|primary"> label </sd-chip>
// Small status / category tag. Icon via slot.

import { SdElement } from "./sd-base.js";

class SdChip extends SdElement {
  static get observedAttributes() { return ["tone"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        font-size: var(--sd-fs-xs);
        font-weight: var(--sd-fw-medium);
        background: var(--sd-surface-2);
        color: var(--sd-ink);
        border-radius: var(--sd-r-pill);
        line-height: 1.4;
        white-space: nowrap;
      }
      :host([tone="sun"])    { background: #FBEBC4; color: #8A6212; }
      :host([tone="sky"])    { background: #DCE9F1; color: #2C5F7A; }
      :host([tone="leaf"])   { background: var(--sd-accent-soft); color: var(--sd-accent); }
      :host([tone="indoor"]) { background: #EADFF4; color: #5A3B82; }
      :host([tone="warn"])   { background: var(--sd-warn-soft); color: var(--sd-warn); }
      :host([tone="accent"]) { background: var(--sd-accent-soft); color: var(--sd-accent); }
      :host([tone="primary"]){ background: var(--sd-primary-soft); color: var(--sd-primary); }
    `;
  }

  template() { return `<slot></slot>`; }
}

customElements.define("sd-chip", SdChip);
