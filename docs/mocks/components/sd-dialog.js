// <sd-dialog open title="..." subtitle="..."> ...content... </sd-dialog>
// Bottom-sheet style modal for mobile feel.

import { SdElement } from "./sd-base.js";

class SdDialog extends SdElement {
  static get observedAttributes() { return ["open", "title", "subtitle", "static"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host { display: none; }
      :host([open]) { display: block; }

      .scrim {
        position: fixed; inset: 0;
        background: rgba(31, 41, 55, 0.35);
        backdrop-filter: blur(2px);
        z-index: 50;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      :host([static]) .scrim {
        position: relative; inset: auto;
        background: transparent;
        backdrop-filter: none;
        padding: 0;
        z-index: 0;
      }
      .sheet {
        width: 100%;
        max-width: var(--sd-app-max-w);
        background: var(--sd-bg-elev);
        border-radius: var(--sd-r-xl) var(--sd-r-xl) 0 0;
        box-shadow: var(--sd-shadow-3);
        padding: 8px 20px 24px;
        max-height: 88vh;
        overflow-y: auto;
        animation: rise var(--sd-dur-base) var(--sd-ease);
      }
      :host([static]) .sheet {
        border-radius: var(--sd-r-xl);
        box-shadow: var(--sd-shadow-2);
        max-height: none;
        animation: none;
      }

      /* Tablet+: centered modal instead of bottom sheet. */
      @media (min-width: 720px) {
        :host(:not([static])) .scrim {
          align-items: center;
          padding: 24px;
        }
        :host(:not([static])) .sheet {
          max-width: 520px;
          border-radius: var(--sd-r-xl);
          max-height: min(80vh, 720px);
          padding: 24px 28px 28px;
        }
        :host(:not([static])) .grip { display: none; }
      }
      @keyframes rise {
        from { transform: translateY(20px); opacity: 0; }
        to   { transform: translateY(0);   opacity: 1; }
      }
      .grip {
        width: 36px; height: 4px;
        background: var(--sd-line-strong);
        border-radius: 999px;
        margin: 8px auto 16px;
      }
      header { margin-bottom: 16px; }
      h2 { font-size: var(--sd-fs-lg); font-weight: var(--sd-fw-semibold); margin: 0; letter-spacing: -0.015em; }
      p.sub { color: var(--sd-ink-soft); margin: 4px 0 0; font-size: var(--sd-fs-sm); }
      .actions { display: flex; gap: 10px; margin-top: 20px; }
      .actions ::slotted(*) { flex: 1; }
    `;
  }

  template() {
    return `
      <div class="scrim">
        <div class="sheet" role="dialog" aria-modal="true">
          <div class="grip"></div>
          <header>
            <h2>${this.attr("title", "")}</h2>
            ${this.attr("subtitle") ? `<p class="sub">${this.attr("subtitle")}</p>` : ""}
          </header>
          <div class="content"><slot></slot></div>
          <div class="actions"><slot name="actions"></slot></div>
        </div>
      </div>
    `;
  }
}

customElements.define("sd-dialog", SdDialog);
