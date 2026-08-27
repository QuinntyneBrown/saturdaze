// <sd-dialog open title="..." subtitle="..."> ...content... </sd-dialog>
// Bottom-sheet style modal for mobile feel.

import { SdElement } from "./sd-base.js";

class SdDialog extends SdElement {
  static get observedAttributes() { return ["open", "title", "subtitle", "static"]; }
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._rendered) return;
    if (name === "open" && oldValue === null && newValue !== null && !this.battr("static")) {
      this._returnFocus = document.activeElement;
    }
    this.render();
    if (name === "open" && oldValue !== null && newValue === null) this.restoreFocus();
  }

  connectedCallback() {
    if (this.battr("open") && !this.battr("static")) this._returnFocus = document.activeElement;
    super.connectedCallback();
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKeydown, true);
  }

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
        <div class="sheet" role="${this.battr("static") ? "region" : "dialog"}" ${this.battr("static") ? "" : "aria-modal=\"true\""} aria-labelledby="dialog-title" tabindex="-1">
          <div class="grip"></div>
          <header>
            <h2 id="dialog-title">${this.attr("title", "Dialog")}</h2>
            ${this.attr("subtitle") ? `<p class="sub">${this.attr("subtitle")}</p>` : ""}
          </header>
          <div class="content"><slot></slot></div>
          <div class="actions"><slot name="actions"></slot></div>
        </div>
      </div>
    `;
  }

  afterRender() {
    document.removeEventListener("keydown", this._onKeydown, true);
    if (!this.battr("open") || this.battr("static")) return;

    this._onKeydown = event => {
      if (!this.battr("open")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        this.close("escape");
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = this.focusables();
      if (!focusables.length) {
        event.preventDefault();
        this.shadowRoot.querySelector(".sheet")?.focus();
        return;
      }
      const activeHost = document.activeElement;
      const index = focusables.findIndex(item => item.host === activeHost || item.node === activeHost);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        this.focusItem(focusables.at(-1));
      } else if (!event.shiftKey && index === focusables.length - 1) {
        event.preventDefault();
        this.focusItem(focusables[0]);
      }
    };
    document.addEventListener("keydown", this._onKeydown, true);
    this.shadowRoot.querySelector(".scrim")?.addEventListener("click", event => {
      if (event.target === event.currentTarget) this.close("backdrop");
    });
    queueMicrotask(() => {
      const first = this.focusables()[0];
      if (first) this.focusItem(first);
      else this.shadowRoot.querySelector(".sheet")?.focus();
    });
  }

  focusables() {
    const selector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), sd-button, sd-icon-button';
    return [...this.querySelectorAll(selector)].map(node => ({
      host: node,
      node: node.shadowRoot?.querySelector('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? node,
    })).filter(item => !item.host.hasAttribute("hidden"));
  }

  focusItem(item) { item?.node?.focus(); }

  close(reason = "programmatic") {
    const closeEvent = new CustomEvent("sd-close", { bubbles: true, composed: true, cancelable: true, detail: { reason } });
    if (!this.dispatchEvent(closeEvent)) return;
    this.removeAttribute("open");
  }

  restoreFocus() {
    document.removeEventListener("keydown", this._onKeydown, true);
    queueMicrotask(() => this._returnFocus?.isConnected && this._returnFocus.focus());
  }
}

customElements.define("sd-dialog", SdDialog);
