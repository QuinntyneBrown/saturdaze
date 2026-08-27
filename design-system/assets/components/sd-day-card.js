// <sd-day-card day="Saturday" date="Sat May 17" weather="22° sunny" highlight="Lavender Fields">
// Compact preview for a single day on the home screen.

import { SdElement } from "./sd-base.js";

class SdDayCard extends SdElement {
  static get observedAttributes() { return ["day", "date", "weather", "highlight", "icon", "href"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host { display: block; }
      a {
        display: block;
        text-decoration: none;
        color: inherit;
        background: var(--sd-surface);
        border: 1px solid var(--sd-line);
        border-radius: var(--sd-r-lg);
        padding: 16px;
        transition: transform var(--sd-dur-fast) var(--sd-ease), box-shadow var(--sd-dur-fast) var(--sd-ease);
      }
      a:hover { transform: translateY(-1px); box-shadow: var(--sd-shadow-2); }
      .head { display: flex; align-items: center; justify-content: space-between; }
      .day { font-weight: var(--sd-fw-bold); font-size: var(--sd-fs-lg); letter-spacing: -0.015em; }
      .date { color: var(--sd-ink-soft); font-size: var(--sd-fs-sm); }
      .weather { display: inline-flex; align-items: center; gap: 4px; color: var(--sd-ink-soft); font-size: var(--sd-fs-sm); }
      .weather sd-icon { color: var(--sd-sun); }
      .highlight {
        margin-top: 12px;
        padding: 12px;
        background: var(--sd-primary-soft);
        border-radius: var(--sd-r-md);
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .highlight .icon {
        width: 36px; height: 36px;
        background: var(--sd-bg-elev);
        color: var(--sd-primary);
        border-radius: var(--sd-r-md);
        display: inline-flex; align-items: center; justify-content: center;
      }
      .highlight .label { font-size: 11px; color: var(--sd-primary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: var(--sd-fw-semibold); }
      .highlight .title { font-weight: var(--sd-fw-semibold); font-size: var(--sd-fs-base); margin-top: 1px; }
      .footer { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
    `;
  }
  template() {
    const day = this.attr("day", "Saturday");
    const date = this.attr("date", "");
    const weather = this.attr("weather", "");
    const icon = this.attr("icon", "sun");
    const highlight = this.attr("highlight", "");
    const href = this.attr("href", "itinerary.html");

    return `
      <a href="${href}">
        <div class="head">
          <div>
            <div class="day">${day}</div>
            <div class="date">${date}</div>
          </div>
          <div class="weather"><sd-icon name="${icon}" size="18"></sd-icon> ${weather}</div>
        </div>
        ${highlight ? `
          <div class="highlight">
            <div class="icon"><sd-icon name="star" size="18"></sd-icon></div>
            <div>
              <div class="label">Day highlight</div>
              <div class="title">${highlight}</div>
            </div>
          </div>
        ` : ""}
        <div class="footer"><slot name="chips"></slot></div>
      </a>
    `;
  }
}

customElements.define("sd-day-card", SdDayCard);
