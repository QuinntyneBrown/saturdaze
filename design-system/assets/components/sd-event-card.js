// <sd-event-card title="..." venue="..." when="..." drive="..." date-day="17" date-mon="MAY">
// Local-events feed card with a date tile.

import { SdElement } from "./sd-base.js";

class SdEventCard extends SdElement {
  static get observedAttributes() {
    return ["title", "venue", "when", "drive", "date-day", "date-mon", "tag", "icon"];
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
        display: flex; gap: 14px;
      }
      .date {
        width: 56px; flex-shrink: 0;
        background: var(--sd-primary-soft);
        color: var(--sd-primary);
        border-radius: var(--sd-r-md);
        text-align: center;
        padding: 8px 4px;
      }
      .date .mon { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: var(--sd-fw-semibold); }
      .date .day { font-size: 22px; font-weight: var(--sd-fw-bold); line-height: 1; margin-top: 2px; }
      .body { flex: 1; min-width: 0; }
      .title { font-weight: var(--sd-fw-semibold); font-size: var(--sd-fs-base); letter-spacing: -0.005em; }
      .venue { color: var(--sd-ink-soft); font-size: var(--sd-fs-sm); margin-top: 2px; }
      .meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    `;
  }
  template() {
    return `
      <div class="card">
        <div class="date">
          <div class="mon">${this.attr("date-mon", "MAY")}</div>
          <div class="day">${this.attr("date-day", "17")}</div>
        </div>
        <div class="body">
          <div class="title">${this.attr("title", "")}</div>
          <div class="venue">${this.attr("venue", "")}${this.attr("when") ? ` &middot; ${this.attr("when")}` : ""}</div>
          <div class="meta">
            ${this.attr("drive") ? `<sd-chip tone="sky"><sd-icon name="car" size="12"></sd-icon> ${this.attr("drive")}</sd-chip>` : ""}
            ${this.attr("tag") ? `<sd-chip tone="primary">${this.attr("tag")}</sd-chip>` : ""}
            <slot name="chips"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("sd-event-card", SdEventCard);
