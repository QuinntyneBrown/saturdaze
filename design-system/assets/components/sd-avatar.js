// <sd-avatar name="Eli" tone="leaf|sky|sun|primary|indoor"> — initials disc.

import { SdElement } from "./sd-base.js";

class SdAvatar extends SdElement {
  static get observedAttributes() { return ["name", "tone", "size"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host {
        --_size: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--_size); height: var(--_size);
        border-radius: 50%;
        background: var(--sd-surface-2);
        color: var(--sd-ink);
        font-weight: var(--sd-fw-semibold);
        font-size: calc(var(--_size) * 0.4);
        letter-spacing: -0.02em;
      }
      :host([size="sm"]) { --_size: 28px; }
      :host([size="lg"]) { --_size: 48px; }
      :host([size="xl"]) { --_size: 72px; font-size: 28px; }
      :host([tone="leaf"])    { background: var(--sd-accent-soft);  color: var(--sd-accent); }
      :host([tone="sky"])     { background: #DCE9F1; color: #2C5F7A; }
      :host([tone="sun"])     { background: #FBEBC4; color: #8A6212; }
      :host([tone="primary"]) { background: var(--sd-primary-soft); color: var(--sd-primary); }
      :host([tone="indoor"])  { background: #EADFF4; color: #5A3B82; }
    `;
  }

  template() {
    const name = this.attr("name", "?");
    const initials = name.split(/\s+/).map(p => p[0] || "").join("").slice(0, 2).toUpperCase();
    return `<span>${initials}</span>`;
  }
}

customElements.define("sd-avatar", SdAvatar);
