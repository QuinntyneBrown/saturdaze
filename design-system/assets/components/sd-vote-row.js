// <sd-vote-row name="Eli" tone="leaf" vote="up|down|none">
// One row in the family vote UI.

import { SdElement } from "./sd-base.js";

class SdVoteRow extends SdElement {
  static get observedAttributes() { return ["name", "tone", "vote"]; }
  attributeChangedCallback() { if (this._rendered) this.render(); }
  styles() {
    return `
      :host { display: block; }
      .row {
        display: flex; align-items: center; gap: 12px;
        padding: 8px 0;
      }
      .name { flex: 1; font-size: var(--sd-fs-base); font-weight: var(--sd-fw-medium); }
      .buttons { display: flex; gap: 6px; }
      button {
        width: 36px; height: 36px;
        border-radius: 50%;
        border: 1px solid var(--sd-line);
        background: var(--sd-surface);
        cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
        color: var(--sd-ink-soft);
      }
      button.up.active { background: var(--sd-accent-soft); color: var(--sd-accent); border-color: transparent; }
      button.down.active { background: var(--sd-warn-soft); color: var(--sd-warn); border-color: transparent; }
    `;
  }
  template() {
    const name = this.attr("name", "");
    const tone = this.attr("tone", "leaf");
    const vote = this.attr("vote", "none");
    return `
      <div class="row">
        <sd-avatar name="${name}" tone="${tone}" size="sm"></sd-avatar>
        <span class="name">${name}</span>
        <div class="buttons">
          <button class="up ${vote === "up" ? "active" : ""}" aria-label="Yes"><sd-icon name="thumbs_up" size="16"></sd-icon></button>
          <button class="down ${vote === "down" ? "active" : ""}" aria-label="No"><sd-icon name="thumbs_down" size="16"></sd-icon></button>
        </div>
      </div>
    `;
  }
}

customElements.define("sd-vote-row", SdVoteRow);
