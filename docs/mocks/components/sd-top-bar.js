// <sd-top-bar title="..." back> — page header.

import { SdElement } from "./sd-base.js";

class SdTopBar extends SdElement {
  static get observedAttributes() { return ["title", "back"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: var(--sd-top-h, 56px);
        padding: 0 16px;
        background: var(--sd-bg);
        position: sticky;
        top: 0;
        z-index: 5;
        backdrop-filter: blur(8px);
        background: color-mix(in srgb, var(--sd-bg) 88%, transparent);
      }
      .left, .right {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 44px;
      }
      h1 {
        font-size: var(--sd-fs-md);
        font-weight: var(--sd-fw-semibold);
        margin: 0;
        letter-spacing: -0.01em;
        text-align: center;
        flex: 1;
      }
      a.back {
        width: 40px; height: 40px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--sd-surface);
        border: 1px solid var(--sd-line);
        color: var(--sd-ink);
        text-decoration: none;
      }
    `;
  }

  template() {
    const title = this.attr("title", "");
    const back = this.battr("back");
    return `
      <div class="left">
        ${back ? `<a class="back" href="../index.html" aria-label="Back"><sd-icon name="arrow_left" size="18"></sd-icon></a>` : `<slot name="leading"></slot>`}
      </div>
      <h1>${title}</h1>
      <div class="right"><slot name="trailing"></slot></div>
    `;
  }
}

customElements.define("sd-top-bar", SdTopBar);
