// <sd-tag-group> — horizontal scrollable strip of chips.

import { SdElement } from "./sd-base.js";

class SdTagGroup extends SdElement {
  styles() {
    return `
      :host {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        padding: 4px var(--sd-app-pad-x, 20px);
        margin: 0 calc(-1 * var(--sd-app-pad-x, 20px));
      }
      :host::-webkit-scrollbar { display: none; }
      ::slotted(*) { flex: 0 0 auto; }
    `;
  }
  template() { return `<slot></slot>`; }
}

customElements.define("sd-tag-group", SdTagGroup);
