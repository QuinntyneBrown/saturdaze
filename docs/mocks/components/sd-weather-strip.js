// <sd-weather-strip>
//   <sd-weather-day day="Sat" icon="sun" hi="22" lo="14" note="Light breeze">
//   <sd-weather-day day="Sun" icon="cloud" hi="18" lo="12" note="Cloudy">
// Two-day glance for the weekend.

import { SdElement } from "./sd-base.js";

class SdWeatherStrip extends SdElement {
  styles() {
    return `
      :host {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
    `;
  }
  template() { return `<slot></slot>`; }
}

class SdWeatherDay extends SdElement {
  static get observedAttributes() { return ["day", "icon", "hi", "lo", "note"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }
  styles() {
    return `
      :host {
        display: block;
        padding: 14px;
        background: var(--sd-surface);
        border: 1px solid var(--sd-line);
        border-radius: var(--sd-r-lg);
      }
      .top { display: flex; justify-content: space-between; align-items: center; }
      .day { font-weight: var(--sd-fw-semibold); font-size: var(--sd-fs-base); letter-spacing: -0.01em; }
      .temps { font-size: var(--sd-fs-xs); color: var(--sd-ink-soft); }
      .temps b { color: var(--sd-ink); font-weight: var(--sd-fw-semibold); }
      .note { font-size: var(--sd-fs-xs); color: var(--sd-ink-soft); margin-top: 8px; }
      sd-icon { color: var(--sd-sun); }
      :host([icon="cloud"]) sd-icon, :host([icon="rain"]) sd-icon { color: var(--sd-ink-soft); }
    `;
  }
  template() {
    return `
      <div class="top">
        <span class="day">${this.attr("day", "Sat")}</span>
        <sd-icon name="${this.attr("icon", "sun")}" size="22"></sd-icon>
      </div>
      <div class="temps"><b>${this.attr("hi", "22")}°</b> &nbsp; ${this.attr("lo", "14")}°</div>
      <div class="note">${this.attr("note", "")}</div>
    `;
  }
}

customElements.define("sd-weather-strip", SdWeatherStrip);
customElements.define("sd-weather-day", SdWeatherDay);
