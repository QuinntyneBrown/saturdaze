import { SdElement } from './sd-base.js';
class SdAuthCard extends SdElement {styles(){return `:host{display:block;width:min(390px,calc(100vw - 40px));box-sizing:border-box;padding:24px;background:var(--sd-surface);border:1px solid var(--sd-line);border-radius:var(--sd-r-xl);box-shadow:var(--sd-shadow-2)}`};template(){return `<slot></slot>`}} customElements.define('sd-auth-card',SdAuthCard);
