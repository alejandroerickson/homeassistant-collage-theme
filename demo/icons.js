// Home Assistant draws `<ha-icon icon="mdi:...">` itself; the demo has no Home Assistant, so this
// stand-in draws the same Material Design Icons from the @mdi/js package.
import * as mdi from "https://cdn.jsdelivr.net/npm/@mdi/js@7.4.47/mdi.js";

const camel = (name) => `mdi${name.replace(/^mdi:/, "").replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())}`;

if (!customElements.get("ha-icon")) {
  customElements.define("ha-icon", class extends HTMLElement {
    static get observedAttributes() { return ["icon"]; }
    connectedCallback() { this.draw(); }
    attributeChangedCallback() { this.draw(); }
    draw() {
      const path = mdi[camel(this.getAttribute("icon") || "")] || "";
      this.style.display = "inline-flex";
      this.innerHTML = `<svg viewBox="0 0 24 24" style="width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);fill:currentColor" aria-hidden="true"><path d="${path}"/></svg>`;
    }
  });
}
