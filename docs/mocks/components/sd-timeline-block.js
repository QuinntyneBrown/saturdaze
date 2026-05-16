// <sd-timeline-block time="9:00" title="..." subtitle="..." icon="..."
//                     tone="..." locked drive="12 min">
// One block in a day's timeline. Tap to open detail (in real app).

import { SdElement } from "./sd-base.js";

class SdTimelineBlock extends SdElement {
  static get observedAttributes() {
    return ["time", "title", "subtitle", "icon", "tone", "locked", "drive", "duration"];
  }
  attributeChangedCallback() { if (this._rendered) this.render(); }

  styles() {
    return `
      :host { display: block; position: relative; }
      .row {
        display: grid;
        grid-template-columns: 56px 1fr auto;
        gap: 12px;
        align-items: stretch;
      }
      .time {
        font-size: var(--sd-fs-xs);
        color: var(--sd-ink-soft);
        font-weight: var(--sd-fw-medium);
        text-align: right;
        padding-top: 18px;
        font-variant-numeric: tabular-nums;
      }
      .time small { display: block; font-size: 10px; color: var(--sd-ink-faint); margin-top: 2px; }
      .rail {
        width: 2px; background: var(--sd-line); position: relative;
        margin: 8px auto;
      }
      .dot {
        position: absolute;
        top: 16px; left: 50%;
        transform: translateX(-50%);
        width: 14px; height: 14px;
        background: var(--sd-bg-elev);
        border: 3px solid var(--sd-primary);
        border-radius: 50%;
      }
      :host([locked]) .dot { border-color: var(--sd-accent); background: var(--sd-accent); }
      :host([tone="downtime"]) .dot { border-color: var(--sd-ink-faint); }

      .body {
        background: var(--sd-surface);
        border: 1px solid var(--sd-line);
        border-radius: var(--sd-r-lg);
        padding: 14px 14px 14px 14px;
        display: flex;
        gap: 12px;
        align-items: flex-start;
        cursor: pointer;
        transition: transform var(--sd-dur-fast) var(--sd-ease), box-shadow var(--sd-dur-fast) var(--sd-ease);
      }
      .body:hover { transform: translateY(-1px); box-shadow: var(--sd-shadow-1); }
      :host([locked]) .body { background: var(--sd-accent-soft); border-color: transparent; }
      :host([tone="downtime"]) .body { background: var(--sd-surface-2); border-color: transparent; }

      .icon {
        width: 36px; height: 36px;
        border-radius: var(--sd-r-md);
        background: var(--sd-primary-soft);
        color: var(--sd-primary);
        display: inline-flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      :host([tone="meal"]) .icon     { background: #FBEBC4; color: #8A6212; }
      :host([tone="drive"]) .icon    { background: #DCE9F1; color: #2C5F7A; }
      :host([tone="workout"]) .icon  { background: var(--sd-accent-soft); color: var(--sd-accent); }
      :host([tone="fixed"]) .icon    { background: var(--sd-accent-soft); color: var(--sd-accent); }
      :host([tone="downtime"]) .icon { background: rgba(31,41,55,0.08); color: var(--sd-ink-soft); }
      :host([tone="indoor"]) .icon   { background: #EADFF4; color: #5A3B82; }

      .text { flex: 1; min-width: 0; }
      .title { font-weight: var(--sd-fw-semibold); font-size: var(--sd-fs-base); letter-spacing: -0.005em; line-height: 1.3; }
      .subtitle { font-size: var(--sd-fs-sm); color: var(--sd-ink-soft); margin-top: 2px; }
      .meta { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }

      .right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; color: var(--sd-ink-soft); }

      .col-rail { display: flex; }
    `;
  }

  template() {
    const time = this.attr("time", "");
    const duration = this.attr("duration", "");
    const title = this.attr("title", "");
    const subtitle = this.attr("subtitle", "");
    const icon = this.attr("icon", "sparkle");
    const locked = this.battr("locked");
    const drive = this.attr("drive", "");

    return `
      <div class="row">
        <div class="time">${time}${duration ? `<small>${duration}</small>` : ""}</div>
        <div class="body">
          <div class="icon"><sd-icon name="${icon}" size="20"></sd-icon></div>
          <div class="text">
            <div class="title">${title}</div>
            ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
            <div class="meta">
              <slot name="chips"></slot>
              ${locked ? `<sd-chip tone="accent"><sd-icon name="lock" size="12"></sd-icon> Locked</sd-chip>` : ""}
              ${drive ? `<sd-chip tone="sky"><sd-icon name="car" size="12"></sd-icon> ${drive}</sd-chip>` : ""}
            </div>
          </div>
        </div>
        <div class="right">
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define("sd-timeline-block", SdTimelineBlock);
