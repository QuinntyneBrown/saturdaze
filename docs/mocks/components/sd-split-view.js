// <sd-split-view sticky-detail | sticky-master>
//   <div slot="master">...</div>
//   <div slot="detail">...</div>
// Master-detail layout. On mobile/tablet only the master slot is visible
// (the detail is reached via navigation). On desktop both slots show
// side-by-side. One of them can be made sticky.

import { SdElement } from "./sd-base.js";

class SdSplitView extends SdElement {
  static get observedAttributes() { return ["sticky-detail", "sticky-master"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host { display: block; }
      .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0;
      }
      .master { min-width: 0; }
      .detail { display: none; }

      @media (min-width: 1024px) {
        .grid {
          grid-template-columns: minmax(360px, 0.85fr) minmax(0, 1.15fr);
          gap: 28px;
          align-items: start;
        }
        .detail { display: block; min-width: 0; }
        :host([sticky-detail]) .detail { position: sticky; top: 88px; }
        :host([sticky-master]) .master { position: sticky; top: 88px; }
      }

      .detail-frame {
        background: var(--sd-surface);
        border: 1px solid var(--sd-line);
        border-radius: var(--sd-r-xl);
        padding: 4px 0 16px;
        overflow: hidden;
      }
    `;
  }

  template() {
    return `
      <div class="grid">
        <div class="master"><slot name="master"></slot></div>
        <div class="detail"><div class="detail-frame"><slot name="detail"></slot></div></div>
      </div>
    `;
  }
}

customElements.define("sd-split-view", SdSplitView);
