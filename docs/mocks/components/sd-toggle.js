// <sd-toggle label="..." checked> — switch.

import { SdElement } from "./sd-base.js";

class SdToggle extends SdElement {
  static get observedAttributes() { return ["label", "checked"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host { display: inline-flex; align-items: center; gap: 12px; cursor: pointer; }
      .label { font-size: var(--sd-fs-base); font-weight: var(--sd-fw-medium); }
      .track {
        width: 42px; height: 24px;
        background: var(--sd-surface-2);
        border-radius: var(--sd-r-pill);
        position: relative;
        transition: background var(--sd-dur-base) var(--sd-ease);
        border: 1px solid var(--sd-line);
      }
      .knob {
        width: 18px; height: 18px;
        background: var(--sd-bg-elev);
        border-radius: 50%;
        position: absolute;
        top: 2px; left: 2px;
        box-shadow: var(--sd-shadow-1);
        transition: transform var(--sd-dur-base) var(--sd-ease);
      }
      :host([checked]) .track { background: var(--sd-accent); border-color: transparent; }
      :host([checked]) .knob  { transform: translateX(18px); }
    `;
  }

  template() {
    const label = this.attr("label", "");
    return `
      ${label ? `<span class="label">${label}</span>` : ""}
      <span class="track"><span class="knob"></span></span>
    `;
  }
}

customElements.define("sd-toggle", SdToggle);
