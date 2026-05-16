// <sd-anticipate icon="..." headline="..." body="..." cta="...">
// The "11-star" pre-emptive callout — surfaces something the user
// hasn't asked for yet, but will be glad you noticed.

import { SdElement } from "./sd-base.js";

class SdAnticipate extends SdElement {
  static get observedAttributes() { return ["icon", "headline", "body", "cta"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }
  styles() {
    return `
      :host { display: block; }
      .wrap {
        display: flex; gap: 12px;
        background: linear-gradient(135deg, var(--sd-primary-soft), #FBEBC4);
        padding: 14px 16px;
        border-radius: var(--sd-r-lg);
        align-items: flex-start;
      }
      .icon {
        width: 36px; height: 36px;
        background: var(--sd-bg-elev);
        color: var(--sd-primary);
        border-radius: var(--sd-r-md);
        display: inline-flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .body { flex: 1; }
      .headline { font-weight: var(--sd-fw-semibold); font-size: var(--sd-fs-base); letter-spacing: -0.005em; }
      .text { font-size: var(--sd-fs-sm); color: var(--sd-ink-soft); margin-top: 2px; }
      .row { margin-top: 10px; }
    `;
  }
  template() {
    return `
      <div class="wrap">
        <div class="icon"><sd-icon name="${this.attr("icon", "sparkle")}" size="20"></sd-icon></div>
        <div class="body">
          <div class="headline">${this.attr("headline", "")}</div>
          <div class="text">${this.attr("body", "")}</div>
          ${this.attr("cta") ? `<div class="row"><sd-button size="sm" variant="secondary">${this.attr("cta")}</sd-button></div>` : ""}
        </div>
      </div>
    `;
  }
}

customElements.define("sd-anticipate", SdAnticipate);
