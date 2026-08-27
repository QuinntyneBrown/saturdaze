// Saturdaze — shared base class for shadow-DOM components.
// Container vs presentation:
//   - Presentation components render markup + accept attributes/slots.
//   - Container components compose presentation components, hold layout
//     decisions and (in the real app) state.
// Both extend SdElement so they share a styling baseline.

export const SD_SHARED_CSS = `
  :host { box-sizing: border-box; font-family: var(--sd-font-sans, system-ui, sans-serif); color: var(--sd-ink, #1F2937); }
  :host([hidden]) { display: none !important; }
  *, *::before, *::after { box-sizing: border-box; }
  button { font: inherit; color: inherit; }
`;

export class SdElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  // Subclasses define `template()` returning an HTML string and `styles()`
  // returning a CSS string. render() stitches them together.
  connectedCallback() {
    if (!this._rendered) {
      this.render();
      this._rendered = true;
    }
  }

  render() {
    const css = this.styles ? this.styles() : "";
    const html = this.template ? this.template() : "";
    this.shadowRoot.innerHTML = `
      <style>${SD_SHARED_CSS}${css}</style>
      ${html}
    `;
    if (this.afterRender) this.afterRender();
  }

  // Helper: read attribute with default.
  attr(name, fallback = "") {
    return this.getAttribute(name) ?? fallback;
  }

  // Helper: read boolean attribute (presence-based).
  battr(name) {
    return this.hasAttribute(name);
  }
}
