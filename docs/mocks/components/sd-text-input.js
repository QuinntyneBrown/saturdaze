// <sd-text-input label="..." value="..." placeholder="..." type="text|number">

import { SdElement } from "./sd-base.js";

class SdTextInput extends SdElement {
  static get observedAttributes() { return ["label", "value", "placeholder", "type", "hint"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host { display: block; }
      label { display: block; font-size: var(--sd-fs-sm); font-weight: var(--sd-fw-medium); color: var(--sd-ink-soft); margin-bottom: 6px; padding-left: 4px; }
      input {
        width: 100%;
        padding: 12px 14px;
        border-radius: var(--sd-r-md);
        border: 1px solid var(--sd-line-strong);
        background: var(--sd-surface);
        font: inherit;
        color: var(--sd-ink);
      }
      input:focus { outline: 2px solid var(--sd-primary-soft); outline-offset: 1px; border-color: var(--sd-primary); }
      .hint { font-size: var(--sd-fs-xs); color: var(--sd-ink-faint); margin: 6px 0 0 4px; }
    `;
  }

  template() {
    const label = this.attr("label", "");
    const value = this.attr("value", "");
    const ph = this.attr("placeholder", "");
    const type = this.attr("type", "text");
    const hint = this.attr("hint", "");
    return `
      ${label ? `<label>${label}</label>` : ""}
      <input type="${type}" value="${value}" placeholder="${ph}" />
      ${hint ? `<div class="hint">${hint}</div>` : ""}
    `;
  }
}

customElements.define("sd-text-input", SdTextInput);
