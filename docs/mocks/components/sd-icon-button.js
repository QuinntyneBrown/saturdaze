// <sd-icon-button label="..." icon="..."> — round, single-icon button.

import { SdElement } from "./sd-base.js";

class SdIconButton extends SdElement {
  static get observedAttributes() { return ["icon", "label", "variant"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host { display: inline-flex; }
      button {
        width: 40px; height: 40px;
        border-radius: 50%;
        border: 1px solid var(--sd-line);
        background: var(--sd-surface);
        color: var(--sd-ink);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background var(--sd-dur-fast) var(--sd-ease);
      }
      button:hover { background: var(--sd-surface-2); }
      :host([variant="ghost"]) button { border-color: transparent; background: transparent; }
      :host([variant="filled"]) button { background: var(--sd-surface-2); border-color: transparent; }
    `;
  }

  template() {
    const icon = this.attr("icon", "more");
    const label = this.attr("label", "Action");
    return `<button type="button" aria-label="${label}"><sd-icon name="${icon}" size="18"></sd-icon></button>`;
  }
}

customElements.define("sd-icon-button", SdIconButton);
