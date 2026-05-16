// <sd-bottom-nav active="home|activities|saved|profile">
// Fixed-bottom primary navigation.

import { SdElement } from "./sd-base.js";

const ITEMS = [
  { key: "home",       label: "Weekend",  icon: "home",     href: "home.html" },
  { key: "activities", label: "Discover", icon: "sparkle",  href: "activities.html" },
  { key: "saved",      label: "Saved",    icon: "heart",    href: "saved.html" },
  { key: "profile",    label: "Family",   icon: "user",     href: "profile.html" },
];

class SdBottomNav extends SdElement {
  static get observedAttributes() { return ["active"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host {
        position: fixed;
        left: 50%; transform: translateX(-50%);
        bottom: 12px;
        width: calc(100% - 24px);
        max-width: calc(var(--sd-app-max-w) - 24px);
        background: var(--sd-surface);
        border: 1px solid var(--sd-line);
        border-radius: var(--sd-r-xl);
        box-shadow: var(--sd-shadow-2);
        padding: 6px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        z-index: 10;
      }
      a {
        text-decoration: none;
        color: var(--sd-ink-soft);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 8px 4px;
        border-radius: var(--sd-r-md);
        gap: 2px;
        font-size: 10px;
        font-weight: var(--sd-fw-medium);
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }
      a[data-active="true"] {
        color: var(--sd-primary);
        background: var(--sd-primary-soft);
      }
      .brand { display: none; }

      /* Tablet: icon rail anchored to the left edge. */
      @media (min-width: 720px) {
        :host {
          position: fixed;
          left: 16px; top: 16px; bottom: 16px;
          transform: none;
          width: var(--sd-rail-w-tablet);
          max-width: var(--sd-rail-w-tablet);
          grid-template-columns: 1fr;
          grid-auto-rows: 60px;
          align-content: start;
          gap: 4px;
          padding: 14px 8px;
          border-radius: var(--sd-r-xl);
        }
        .brand {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          margin-bottom: 6px;
          color: var(--sd-primary);
        }
        a {
          padding: 10px 4px;
          font-size: 10px;
        }
      }

      /* Desktop: rail expands, labels appear next to icons. */
      @media (min-width: 1024px) {
        :host {
          width: var(--sd-rail-w-desktop);
          max-width: var(--sd-rail-w-desktop);
          padding: 20px 14px;
          grid-auto-rows: auto;
          gap: 2px;
        }
        .brand {
          justify-content: flex-start;
          padding: 0 10px;
          gap: 8px;
          height: 32px;
          margin-bottom: 18px;
          color: var(--sd-ink);
          font-weight: var(--sd-fw-bold);
          font-size: 18px;
          letter-spacing: -0.02em;
        }
        .brand sd-icon { color: var(--sd-primary); }
        a {
          flex-direction: row;
          justify-content: flex-start;
          gap: 12px;
          padding: 11px 14px;
          font-size: 14px;
          text-transform: none;
          letter-spacing: -0.005em;
          font-weight: var(--sd-fw-medium);
          border-radius: var(--sd-r-md);
        }
      }
    `;
  }

  template() {
    const active = this.attr("active", "home");
    const brand = `
      <div class="brand">
        <sd-icon name="sparkle" size="20"></sd-icon>
        <span>Saturdaze</span>
      </div>
    `;
    return brand + ITEMS.map(it => `
      <a href="${it.href}" data-active="${active === it.key}">
        <sd-icon name="${it.icon}" size="20"></sd-icon>
        <span>${it.label}</span>
      </a>
    `).join("");
  }
}

customElements.define("sd-bottom-nav", SdBottomNav);
