// <sd-hero greeting="..." subtitle="..."> — home-screen greeting block.
// The first moment of the experience — sets tone for the weekend.

import { SdElement } from "./sd-base.js";

class SdHero extends SdElement {
  static get observedAttributes() { return ["greeting", "subtitle", "cta"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host {
        display: block;
        padding: 24px var(--sd-app-pad-x, 20px) 8px;
        background:
          radial-gradient(120% 80% at 0% 0%, var(--sd-primary-soft) 0%, transparent 60%),
          radial-gradient(120% 80% at 100% 0%, #FBEBC4 0%, transparent 60%);
      }
      .small {
        font-size: var(--sd-fs-xs);
        color: var(--sd-ink-soft);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: var(--sd-fw-semibold);
      }
      h1 {
        font-size: var(--sd-fs-xxl);
        font-weight: var(--sd-fw-bold);
        letter-spacing: -0.025em;
        margin: 6px 0 6px;
        line-height: 1.1;
      }
      p { margin: 0 0 16px; color: var(--sd-ink-soft); font-size: var(--sd-fs-md); }
      .cta-row { display: flex; gap: 10px; margin-top: 8px; }
      .inner { max-width: 720px; }

      @media (min-width: 720px) {
        :host { padding: 32px var(--sd-app-pad-x, 20px) 20px; border-radius: var(--sd-r-xl); margin-top: 16px; }
        .cta-row { max-width: 320px; }
      }
      @media (min-width: 1024px) {
        :host { padding: 44px 40px 28px; }
        h1 { font-size: 44px; letter-spacing: -0.03em; }
        p { font-size: 18px; max-width: 560px; }
      }
    `;
  }
  template() {
    const greeting = this.attr("greeting", "Morning, the Browns");
    const sub = this.attr("subtitle", "Your weekend's looking good. Want me to map it out?");
    const cta = this.attr("cta", "Plan This Weekend");
    return `
      <div class="small">Saturdaze</div>
      <h1>${greeting}</h1>
      <p>${sub}</p>
      <div class="cta-row">
        <sd-button size="lg" full>
          <sd-icon slot="leading" name="sparkle" size="18"></sd-icon>
          ${cta}
        </sd-button>
      </div>
      <slot></slot>
    `;
  }
}

customElements.define("sd-hero", SdHero);
