// <sd-saved-card date="..." title="..." rating="4" highlights="...">
// A row in saved weekends / history.

import { SdElement } from "./sd-base.js";

class SdSavedCard extends SdElement {
  static get observedAttributes() {
    return ["date", "title", "rating", "highlights", "favourite"];
  }
  attributeChangedCallback() { if (this._rendered) this.render(); }
  styles() {
    return `
      :host { display: block; }
      .card {
        background: var(--sd-surface);
        border: 1px solid var(--sd-line);
        border-radius: var(--sd-r-lg);
        padding: 14px;
      }
      .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
      .date { font-size: var(--sd-fs-xs); color: var(--sd-ink-soft); text-transform: uppercase; letter-spacing: 0.08em; font-weight: var(--sd-fw-semibold); }
      .title { font-weight: var(--sd-fw-semibold); font-size: var(--sd-fs-md); letter-spacing: -0.01em; margin-top: 2px; }
      .stars { display: flex; gap: 2px; color: var(--sd-sun); margin-top: 6px; }
      .stars sd-icon[filled] { color: var(--sd-sun); }
      .stars sd-icon:not([filled]) { color: var(--sd-ink-faint); }
      .highlights { margin-top: 10px; padding: 10px 12px; background: var(--sd-surface-2); border-radius: var(--sd-r-md); font-size: var(--sd-fs-sm); color: var(--sd-ink); }
      .footer { display: flex; gap: 8px; margin-top: 12px; }
      .footer ::slotted(*) { flex: 1; }
      .heart { color: var(--sd-warn); }
    `;
  }
  template() {
    const rating = parseInt(this.attr("rating", "0"), 10);
    const fav = this.battr("favourite");
    const stars = [0,1,2,3,4].map(i =>
      `<sd-icon name="star" size="14" ${i < rating ? "filled" : ""}></sd-icon>`
    ).join("");
    return `
      <div class="card">
        <div class="head">
          <div>
            <div class="date">${this.attr("date", "")}</div>
            <div class="title">${this.attr("title", "")}</div>
            <div class="stars">${stars}</div>
          </div>
          <div class="heart">${fav ? `<sd-icon name="heart" size="20" filled></sd-icon>` : `<sd-icon name="heart" size="20"></sd-icon>`}</div>
        </div>
        ${this.attr("highlights") ? `<div class="highlights">${this.attr("highlights")}</div>` : ""}
        <div class="footer"><slot></slot></div>
      </div>
    `;
  }
}

customElements.define("sd-saved-card", SdSavedCard);
