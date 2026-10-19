// Collage: a card library for Home Assistant dashboards, after the cut-paper collages of
// Jean Arp and Sophie Taeuber-Arp. Rooms are rectangles of cut paper pinned to a dim wall;
// whatever is alive now carries an Arp form, and loose bits of patterned paper scatter
// around the cards. Vanilla custom elements in one file, no build step; data comes from
// Home Assistant's state, history and statistics websocket API. See DESIGN.md.
// https://github.com/alejandroerickson/homeassistant-collage-theme (MIT)

const VERSION = "1.0.0";

// ---------- the face: Familjen Grotesk, served next to this file ----------

// A font loaded inside a card's shadow root is not seen by the page, so the face is declared
// once on the document, from wherever this file is served (HACS puts both in one folder).
(() => {
  if (document.getElementById("collage-face")) return;
  let src;
  try { src = new URL("./familjen-grotesk.woff2", import.meta.url).href; } catch (e) { return; }
  const style = document.createElement("style");
  style.id = "collage-face";
  style.textContent = `@font-face { font-family: "Familjen Grotesk"; font-style: normal; font-weight: 400 700; font-display: swap;
    src: url(${src}) format("woff2"); }`;
  document.head.appendChild(style);
})();

// ---------- shared helpers ----------

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (t) => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

function duration(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} m`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} m` : `${h} h`;
}

function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

// Paper colours, defined by the Collage theme (with fallbacks).
const COLOURS = {
  cobalt: "var(--hc-cobalt, #1F3D8C)",
  yellow: "var(--hc-yellow, #F2B705)",
  orange: "var(--hc-orange, #E8632B)",
  red: "var(--hc-red, #D7301F)",
  olive: "var(--hc-olive, #6B7F2A)",
  pink: "var(--hc-pink, #E9A3B8)",
  black: "var(--hc-black, #141414)",
  paper: "var(--hc-paper, #F4F0E6)",
};
const colour = (c) => COLOURS[c] || c || COLOURS.cobalt;

// Arp forms, drawn once in a 100 x 100 box. Each card names one by number.
const FORMS = [
  "M20,55 C10,30 35,8 58,14 C80,20 92,42 84,62 C76,82 52,92 36,84 C24,78 26,68 20,55 Z",
  "M50,6 C70,20 88,44 80,70 C72,92 44,96 30,80 C18,66 30,52 38,40 C46,28 40,16 50,6 Z",
  "M50,10 C78,10 92,32 88,54 C84,78 62,92 44,88 C26,84 8,70 12,48 C15,30 30,22 40,26 C46,28 44,10 50,10 Z",
  "M40,4 C58,4 54,22 64,34 C76,48 80,66 66,82 C58,92 44,98 34,90 C22,80 30,62 26,50 C22,38 26,4 40,4 Z",
  "M8,40 C20,20 44,24 56,34 C66,42 78,38 90,28 C96,46 86,70 64,74 C46,77 36,62 24,64 C14,66 2,58 8,40 Z",
];
const form = (n, fill, cls = "form") =>
  `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><path d="${FORMS[((n || 1) - 1) % FORMS.length]}" fill="${fill}"/></svg>`;

const icon = (name) => `<ha-icon icon="mdi:${name}"></ha-icon>`;

// Organised chaos: loose collage bits tucked under each card, peeking out at
// odd angles. Seeded by the card, so a card's bits stay put between renders.
function rng(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function scatter(seed, n = 4, sides = ["right", "bottom"]) {
  const r = rng(seed);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const between = (a, b) => a + r() * (b - a);
  const hues = ["cobalt", "yellow", "orange", "red", "black", "pink", "olive", "cobalt", "red"];
  const bits = [];
  for (let i = 0; i < n; i++) {
    const side = sides[(i + Math.floor(r() * sides.length)) % sides.length];
    const along = between(4, 88).toFixed(1), out = -between(6, 26).toFixed(0);
    const pos = side === "top" ? `left:${along}%;top:${out}px` : side === "bottom" ? `left:${along}%;bottom:${out}px`
      : side === "left" ? `top:${along}%;left:${out}px` : `top:${along}%;right:${out}px`;
    const rot = between(-38, 38).toFixed(1);
    const kind = pick(["pattern", "pattern", "pattern", "tri", "bar", "dot", "strip", "half"]);
    const c = colour(pick(hues));
    let style = `${pos};transform:rotate(${rot}deg);`;
    if (kind === "pattern") {
      // Patterned paper: halftone dots, stripes or squared paper.
      const ink = colour(pick(["black", "cobalt", "red"])), ground = colour(pick(["paper", "yellow", "pink", "orange"]));
      const p = pick([
        `radial-gradient(${ink} 28%, transparent 30%) 0 0 / 7px 7px, ${ground}`,
        `repeating-linear-gradient(${pick([45, -45, 90, 0])}deg, ${ink} 0 3px, ${ground} 3px 8px)`,
        `linear-gradient(${ink} 1px, transparent 1px) 0 0 / 9px 9px, linear-gradient(90deg, ${ink} 1px, transparent 1px) 0 0 / 9px 9px, ${ground}`,
      ]);
      style += `width:${between(36, 86).toFixed(0)}px;height:${between(24, 60).toFixed(0)}px;background:${p};`;
    } else if (kind === "tri") {
      const w = between(28, 62).toFixed(0);
      style += `width:${w}px;height:${(w * between(0.7, 1.3)).toFixed(0)}px;background:${c};clip-path:polygon(0 100%,${between(20, 80).toFixed(0)}% 0,100% 100%);`;
    } else if (kind === "bar") {
      style += `width:${between(5, 8).toFixed(0)}px;height:${between(48, 104).toFixed(0)}px;background:var(--hc-black,#141414);`;
    } else if (kind === "dot") {
      const d = between(16, 42).toFixed(0);
      style += `width:${d}px;height:${d}px;border-radius:50%;background:${c};`;
    } else if (kind === "half") {
      const d = between(30, 56).toFixed(0);
      style += `width:${d}px;height:${(d / 2).toFixed(0)}px;border-radius:${d}px ${d}px 0 0;background:${c};`;
    } else {
      style += `width:${between(70, 136).toFixed(0)}px;height:${between(9, 16).toFixed(0)}px;background:${c};`;
    }
    bits.push(`<i class="bit" style="${style}"></i>`);
  }
  return `<div class="bits" aria-hidden="true">${bits.join("")}</div>`;
}

// On a phone the cards reach the screen's edges, so the bits peeking past them would make the
// whole view scroll sideways. Cut the view at its sides instead: "clip", not "hidden", so the
// view doesn't become a scroller of its own.
function keepOnScreen(card) {
  for (let n = card; n; n = n.parentNode || n.host) {
    if (/^hui-(\w+-)?view$/.test(n.localName)) { n.style.overflowX = "clip"; return; }
  }
}

// History: one request per entity set, cached for five minutes.
const historyCache = new Map();

async function fetchHistory(hass, ids, hours, withAttributes = false, force = false) {
  const key = `${ids.join(",")}|${hours}|${withAttributes}`;
  const hit = historyCache.get(key);
  if (!force && hit && Date.now() - hit.at < 5 * 60000) return hit.promise;
  const start = new Date(Date.now() - hours * 3600000).toISOString();
  const promise = hass
    .callWS({
      type: "history/history_during_period",
      start_time: start,
      entity_ids: ids,
      minimal_response: !withAttributes,
      no_attributes: !withAttributes,
      significant_changes_only: false,
    })
    .then((r) => {
      const out = {};
      // "lc" is when the state last changed; a change only in the attributes (the furnace
      // starting while the thermostat stays on "heat") moves only "lu", so that is the time to read.
      for (const id of ids) {
        out[id] = (r[id] || []).map((e) => ({ t: (withAttributes ? e.lu : e.lc ?? e.lu) * 1000, s: e.s, a: e.a || {} }));
      }
      return out;
    })
    .catch((err) => { historyCache.delete(key); throw err; });
  historyCache.set(key, { at: Date.now(), promise });
  return promise;
}

// The spans a binary entity spent "on" inside [from, to].
function onSpans(points, from, to, isOn = (s) => s === "on") {
  const spans = [];
  for (let i = 0; i < points.length; i++) {
    if (!isOn(points[i].s)) continue;
    const a = Math.max(points[i].t, from);
    const b = Math.min(i + 1 < points.length ? points[i + 1].t : to, to);
    if (b > a) spans.push([a, b]);
  }
  return spans;
}

const overlap = (spans, a, b) => spans.reduce((sum, [s, e]) => sum + Math.max(0, Math.min(e, b) - Math.max(s, a)), 0);

// Smooth closed-top path through points (Catmull-Rom to Bezier).
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

// The shared material: paper, type, the pinned shadow.
const MATERIAL = `
  :host { display: block; position: relative; isolation: isolate; font-family: var(--hc-display, "Familjen Grotesk", sans-serif);
    color: var(--hc-black, #141414); -webkit-tap-highlight-color: transparent; }
  * { box-sizing: border-box; }
  /* A chart drawn at one width never holds its card open at a narrower one; it is redrawn to fit. */
  svg { max-width: 100%; }
  .paper { position: relative; z-index: 1; background: var(--hc-paper, #F4F0E6); color: var(--hc-black, #141414);
    box-shadow: 0 1px 1px rgba(0,0,0,.28), 0 8px 18px -6px rgba(0,0,0,.45); }
  .num { font-variant-numeric: tabular-nums; }
  .bits { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
  .bit { position: absolute; display: block; box-shadow: 0 1px 1px rgba(0,0,0,.25), 0 4px 8px -4px rgba(0,0,0,.5); }
  .press { cursor: pointer; user-select: none; outline: none; }
  .press:focus-visible { outline: 3px solid var(--hc-yellow, #F2B705); outline-offset: 3px; }
  button { font: inherit; color: inherit; border: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  button:focus-visible { outline: 3px solid var(--hc-yellow, #F2B705); outline-offset: 2px; }
  .form { position: absolute; pointer-events: none; overflow: visible; }
  .notice { position: absolute; z-index: 20; left: 8px; right: 8px; bottom: 8px; padding: 9px 11px; font-size: 14px; font-weight: 700;
    background: var(--hc-pink, #E9A3B8); color: var(--hc-black, #141414); transform: rotate(-1deg);
    box-shadow: 0 1px 1px rgba(0,0,0,.3), 0 8px 14px -6px rgba(0,0,0,.6); }
  .tabs { display: flex; gap: 4px; }
  .tabs button { padding: 7px 11px; font-size: 13px; font-weight: 700; background: #DDD6C6; color: var(--hc-black, #141414); min-height: 36px; }
  .tabs button[aria-pressed="true"] { background: var(--hc-black, #141414); color: var(--hc-paper, #F4F0E6); }
  @media (prefers-reduced-motion: no-preference) {
    .lay { animation: lay .42s cubic-bezier(.16,1,.3,1) both; }
    @keyframes lay { from { transform: translate(6px,-10px) rotate(var(--r-from, 3deg)); opacity: 0; } }
  }
`;

// A battery as cut paper: a thick ink outline and a nub, holding four hand-cut cells,
// as many filled as quarters of charge. No number: the cells say enough.
const level = (v) => (v < 30 ? "low" : v < 50 ? "mid" : "");
function batteryArt(seed, v) {
  const r = rng(seed), lit = isNaN(v) ? 0 : v <= 0 ? 0 : Math.ceil(v / 25);
  const cells = [0, 1, 2, 3].map((i) => `<i class="${i < lit ? "lit" : ""}" style="--r:${(r() * 6 - 3).toFixed(1)}deg;height:${(86 + r() * 14).toFixed(0)}%"></i>`).join("");
  return `<span class="cell ${isNaN(v) ? "dead" : level(v)}" style="--t:${(r() * 6 - 3).toFixed(1)}deg">${cells}</span>`;
}
const BATTERY = `
  .cell { position: relative; display: flex; align-items: center; gap: 5px; width: calc(100% - 12px); aspect-ratio: 2.2; padding: 5px;
    border: 4px solid var(--hc-black, #141414); background: var(--hc-paper, #F4F0E6); transform: rotate(var(--t));
    box-shadow: 0 1px 1px rgba(0,0,0,.25), 0 6px 10px -6px rgba(0,0,0,.5); }
  .cell::after { content: ""; position: absolute; right: -12px; top: 30%; width: 8px; height: 40%; background: var(--hc-black, #141414); }
  .cell i { flex: 1; display: block; transform: rotate(var(--r));
    background: radial-gradient(#CFC7B4 30%, transparent 33%) 0 0 / 6px 6px; }
  .cell i.lit { background: var(--fill); box-shadow: 0 1px 1px rgba(0,0,0,.2); --fill: var(--hc-olive, #6B7F2A); }
  .cell.mid i.lit { --fill: var(--hc-orange, #E8632B); }
  .cell.low i.lit { --fill: var(--hc-red, #D7301F); }
  .cell.dead { border-style: dashed; border-color: #8C877C; background: transparent; box-shadow: none; }
  .cell.dead::after { background: #8C877C; }
`;

// Tap toggles, hold opens the entity's details. Keyboard: Enter or Space.
// Controls inside a pressable card carry the class "nopress" and are left alone.
const fromControl = (e) => e.composedPath().some((n) => n.classList && n.classList.contains("nopress"));

function pressable(el, { tap, hold }) {
  let timer = null, held = false, sx = 0, sy = 0;
  const clear = () => { clearTimeout(timer); timer = null; };
  el.addEventListener("pointerdown", (e) => {
    if (fromControl(e)) return;
    held = false; sx = e.clientX; sy = e.clientY;
    timer = setTimeout(() => { held = true; hold && hold(); }, 520);
  });
  el.addEventListener("pointermove", (e) => { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 10) clear(); });
  el.addEventListener("pointerleave", clear);
  el.addEventListener("pointercancel", clear);
  el.addEventListener("pointerup", () => { if (timer && !held) { clear(); tap && tap(); } clear(); });
  el.addEventListener("contextmenu", (e) => e.preventDefault());
  el.addEventListener("keydown", (e) => { if (fromControl(e)) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap && tap(); } });
}

class CollageCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); }
  setConfig(config) { this._config = this.validate(config); if (this._hass) this.update(true); }
  validate(c) { return c; }
  set hass(hass) {
    const old = this._hass;
    this._hass = hass;
    const changed = !old || this.watch().some((id) => old.states[id] !== hass.states[id]);
    if (!changed) return;
    // Never redraw under a finger: a drag in progress defers the update.
    if (this._busy) { this._deferred = true; return; }
    this.update(!old);
    this.renderNotice();
  }
  release() {
    this._busy = false;
    if (this._deferred) { this._deferred = false; this.update(false); this.renderNotice(); }
  }
  // Call a service; when the device does not answer, say so on the card.
  run(domain, service, data, failure) {
    return this._hass.callService(domain, service, data).catch((err) => {
      this.notice(failure || `That didn't work: ${err && err.message ? err.message : err}`);
      throw err;
    });
  }
  notice(text) {
    clearTimeout(this._noticeTimer);
    this._notice = text;
    this.renderNotice();
    this._noticeTimer = setTimeout(() => { this._notice = null; this.renderNotice(); }, 7000);
  }
  renderNotice() {
    const old = this.shadowRoot.querySelector(".notice");
    if (old) old.remove();
    if (!this._notice) return;
    const n = document.createElement("div");
    n.className = "notice";
    n.setAttribute("role", "status");
    n.textContent = this._notice;
    this.shadowRoot.appendChild(n);
  }
  get hass() { return this._hass; }
  watch() { return []; }
  update() {}
  st(id) { return this._hass && this._hass.states[id]; }
  moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId } }));
  }
  navigate(path) {
    history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }
  getCardSize() { return 3; }
  // Re-read history every five minutes and whenever a watched entity changes.
  scheduleHistory(load) {
    clearTimeout(this._historyTimer);
    load();
    this._historyTimer = setTimeout(() => this.update(true), 5 * 60000);
  }
  connectedCallback() { keepOnScreen(this); }
  disconnectedCallback() { clearTimeout(this._historyTimer); }
}

// ---------- room: one cut-paper rectangle per room ----------

class CollageRoomCard extends CollageCard {
  validate(c) {
    if (!c.entity) throw new Error("collage-room-card needs an entity");
    const r = rng(c.entity);
    return { form: 1, color: "cobalt", form_color: "black", tilt: +(r() * 4 - 2).toFixed(1), ...c };
  }
  watch() { return [this._config.entity]; }
  getGridOptions() { return { columns: 6, rows: "auto", min_columns: 3 }; }

  dimmable(s) {
    const modes = s.attributes.supported_color_modes || [];
    return modes.some((m) => m !== "onoff") && s.entity_id.startsWith("light.");
  }

  update(reloadHistory) {
    const c = this._config, s = this.st(c.entity);
    if (!s) { this.shadowRoot.innerHTML = `<style>${MATERIAL}</style><div class="paper missing">${esc(c.name || c.entity)} is not found</div>`; return; }
    const focusKey = this.shadowRoot.activeElement?.dataset?.focus;
    const on = s.state === "on";
    const unavailable = s.state === "unavailable" || s.state === "unknown";
    const wasOn = this._on;
    this._on = on;
    const dim = this.dimmable(s);
    const pct = on && s.attributes.brightness != null ? Math.round((s.attributes.brightness / 255) * 100) : on ? 100 : 0;
    const name = c.name || s.attributes.friendly_name;
    const room = colour(c.color);
    // Ink for type on the room's colour: black on light papers, paper on dark ones.
    const ink = ["yellow", "pink", "paper"].includes(c.color) ? "var(--hc-black, #141414)" : "var(--hc-paper, #F4F0E6)";
    const black = "var(--hc-black, #141414)";
    const back = !!this._back;
    const range = this._range || "day";
    const stateLine = unavailable ? "Unavailable" : on ? `${dim ? `<b class="num">${pct}%</b> · ` : ""}on since ${hhmm(new Date(s.last_changed))}` : `Off, ${ago(new Date(s.last_changed))}`;

    const style = `<style>${MATERIAL}
        .room { display: block; aspect-ratio: 1 / ${dim ? 1.42 : 1.16}; min-height: 200px; transform: rotate(${c.tilt}deg); }
        .grain { position: absolute; inset: 0; opacity: .2;
          background: radial-gradient(${room} 22%, transparent 24%) 0 0 / 8px 8px; }
        .swatch { position: absolute; left: -4px; right: 18%; top: -6px; height: 76px; background: ${room};
          box-shadow: 0 1px 1px rgba(0,0,0,.25), 0 6px 12px -6px rgba(0,0,0,.5); transform: rotate(-1.2deg); }
        .on { background: ${room}; }
        .on .swatch { display: none; }
        .form { width: 70%; right: -36%; top: -34%; z-index: 3; transform: rotate(${c.tilt * -4 + 12}deg);
          filter: drop-shadow(0 6px 8px rgba(0,0,0,.4)); }
        .label { position: absolute; left: 12px; right: 48px; top: 10px; z-index: 4; color: ${ink}; }
        .name { font-weight: 700; font-size: 25px; line-height: .95; letter-spacing: -.02em; }
        .state { margin-top: 6px; font-size: 13px; font-weight: 500; }
        .state b { font-size: 18px; letter-spacing: -.02em; }
        .flip { position: absolute; z-index: 6; top: 8px; right: 8px; width: 36px; height: 36px; display: grid; place-items: center;
          background: ${black}; color: var(--hc-paper, #F4F0E6); --mdc-icon-size: 20px; }
        .dim { position: absolute; z-index: 5; left: 11px; right: 11px; top: 86px; height: 34px; touch-action: none; cursor: ew-resize;
          background: #DDD6C6; box-shadow: inset 0 0 0 2px ${black}; }
        .on .dim { background: color-mix(in srgb, ${ink} 26%, ${room}); box-shadow: inset 0 0 0 2px ${ink}; }
        .dim i { position: absolute; left: 0; top: 0; bottom: 0; background: ${black}; }
        .on .dim i { background: ${ink}; }
        .dim span { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 700;
          color: ${black}; mix-blend-mode: normal; }
        .on .dim span { color: ${ink}; }
        .dim span.inside { right: auto; left: 8px; color: var(--hc-paper, #F4F0E6); }
        .on .dim span.inside { color: ${room}; }
        .foot { position: absolute; left: 11px; right: 11px; bottom: 9px; z-index: 2; }
        .on .foot { color: ${ink}; }
        .today { display: flex; justify-content: space-between; align-items: baseline; font-size: 12px; font-weight: 600; }
        .today b { font-size: 17px; letter-spacing: -.02em; }
        .week { font-size: 11px; font-weight: 500; margin: 1px 0 6px; }
        .strip { display: grid; grid-template-columns: repeat(24, 1fr); gap: 2px; height: 50px; align-items: end;
          border-bottom: 2px solid currentColor; }
        .strip i { display: block; height: 4px; background: #DDD6C6; }
        .strip i.lit { background: ${room}; }
        .on .strip i { background: color-mix(in srgb, ${ink} 30%, ${room}); }
        .on .strip i.lit { background: ${ink}; }
        .strip i.now { box-shadow: 0 0 0 1.5px ${black}; }
        .on .strip i.now { box-shadow: 0 0 0 1.5px ${ink}; }
        .hours { display: grid; grid-template-columns: repeat(24, 1fr); font-size: 11px; font-weight: 600; margin-top: 2px; }
        .hours span { white-space: nowrap; }
        .unavail { filter: grayscale(1); }
        .unavail .state { font-weight: 700; }
        /* The back of the card: the record in detail. */
        .backside { display: block; min-height: 200px; padding: 12px 11px 11px; transform: rotate(${c.tilt}deg); border-top: 10px solid ${room}; }
        .backside h3 { margin: 0; font-size: 21px; font-weight: 700; letter-spacing: -.02em; padding-right: 40px; }
        .backside .sub { font-size: 12px; font-weight: 500; margin: 2px 0 8px; }
        .bars { display: grid; gap: 2px; height: 64px; align-items: end; border-bottom: 2px solid ${black}; margin-top: 8px; }
        .bars i { display: block; background: #DDD6C6; min-height: 3px; }
        .bars i.lit { background: ${room}; }
        .ticks { display: grid; font-size: 11px; font-weight: 600; margin-top: 2px; }
        .ticks span { white-space: nowrap; line-height: 1.15; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; margin-top: 10px; font-size: 11px; font-weight: 600; }
        .stats b { display: block; font-size: 17px; letter-spacing: -.02em; }
        .acts { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; }
        .acts button { flex: 1 1 0; min-width: 40px; min-height: 40px; font-size: 13px; font-weight: 700; background: ${black}; color: var(--hc-paper, #F4F0E6); }
        .acts button.cur { background: ${room}; color: ${ink}; box-shadow: inset 0 0 0 2px ${black}; }
        @media (prefers-reduced-motion: no-preference) {
          .turn { animation: turn .32s cubic-bezier(.16,1,.3,1) both; }
          @keyframes turn { from { transform: rotate(${c.tilt}deg) perspective(600px) rotateY(80deg); } }
        }
      </style>`;

    if (back) {
      const presets = dim ? [25, 50, 75, 100] : [];
      this.shadowRoot.innerHTML = `${style}
        ${scatter(c.entity, 5)}
        <div class="paper backside ${this._turning ? "turn" : ""}">
          <button class="flip nopress" data-focus="flip" aria-label="Back to the front of ${esc(name)}">${icon("close")}</button>
          <h3>${esc(name)}</h3>
          <div class="sub">${stateLine}</div>
          <div class="tabs" role="group" aria-label="Range">
            ${[["hour", "Hour"], ["day", "Day"], ["week", "Week"]].map(([k, l]) => `<button data-range="${k}" data-focus="r-${k}" aria-pressed="${range === k}">${l}</button>`).join("")}
          </div>
          <div class="bars" id="bars" role="img"></div>
          <div class="ticks num" id="ticks" aria-hidden="true"></div>
          <div class="stats num" id="stats"></div>
          <div class="acts">
            ${presets.map((p) => `<button data-pct="${p}" data-focus="p-${p}" class="${on && Math.abs(pct - p) < 3 ? "cur" : ""}" aria-label="${esc(name)} to ${p} percent">${p}%</button>`).join("")}
            <button data-pct="0" data-focus="p-0" class="${on ? "" : "cur"}" aria-label="Turn ${esc(name)} off">Off</button>
            ${dim ? "" : `<button data-pct="100" data-focus="p-on" class="${on ? "cur" : ""}" aria-label="Turn ${esc(name)} on">On</button>`}
          </div>
        </div>`;
      this._turning = false;
      const sr = this.shadowRoot;
      sr.querySelector(".flip").addEventListener("click", () => { this._back = false; this._turning = true; this.update(false); this.shadowRoot.querySelector(".flip")?.focus(); });
      sr.querySelectorAll("[data-range]").forEach((b) => b.addEventListener("click", () => { this._range = b.dataset.range; this.update(false); this.shadowRoot.querySelector(`[data-range="${this._range}"]`)?.focus(); }));
      sr.querySelectorAll("[data-pct]").forEach((b) => b.addEventListener("click", () => this.setLevel(Number(b.dataset.pct))));
    } else {
      const hourStart = new Date(); hourStart.setMinutes(0, 0, 0);
      const labels = Array.from({ length: 24 }, (_, i) => {
        const h = new Date(hourStart.getTime() - (23 - i) * 3600000).getHours();
        return `<span>${h % 6 === 0 ? pad(h) : ""}</span>`;
      }).join("");
      this.shadowRoot.innerHTML = `${style}
        ${scatter(c.entity, 5)}
        <div class="paper room press ${on ? "on" : "off"} ${unavailable ? "unavail" : ""} ${this._turning ? "turn" : ""}" role="button" tabindex="0" data-focus="room"
          aria-pressed="${on}" aria-label="${esc(name)}, ${on ? "on" : unavailable ? "unavailable" : "off"}. Tap to turn ${on ? "off" : "on"}.">
          ${on ? "" : `<div class="grain"></div><div class="swatch"></div>`}
          ${on ? form(c.form, colour(c.form_color), `form ${wasOn === false ? "lay" : ""}`) : ""}
          <button class="flip nopress" data-focus="flip" aria-label="Turn ${esc(name)} over for its record${dim ? " and brightness" : ""}">${icon("chart-bar")}</button>
          <div class="label"><div class="name">${esc(name)}</div><div class="state">${stateLine}</div></div>
          ${dim && !unavailable ? `<div class="dim nopress" role="slider" tabindex="0" data-focus="dim" aria-label="${esc(name)} brightness"
              aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i><span class="num ${pct > 78 ? "inside" : ""}">${pct}%</span></div>` : ""}
          <div class="foot"><div class="today"><span>Today</span><b class="num" id="today">–</b></div>
            <div class="week num" id="week">This week –</div>
            <div class="strip" id="strip" role="img" aria-label="Hours on, last 24 hours">${"<i></i>".repeat(24)}</div>
            <div class="hours num" aria-hidden="true">${labels}</div></div>
        </div>`;
      this._turning = false;
      const card = this.shadowRoot.querySelector(".room");
      pressable(card, {
        tap: () => !unavailable && this.run("homeassistant", "toggle", { entity_id: c.entity }, `${name} didn't answer. Try again in a moment.`).catch(() => {}),
        hold: () => this.moreInfo(c.entity),
      });
      this.shadowRoot.querySelector(".flip").addEventListener("click", () => { this._back = true; this._turning = true; this.update(false); this.shadowRoot.querySelector(".flip")?.focus(); });
      const slider = this.shadowRoot.querySelector(".dim");
      if (slider) this.wireSlider(slider);
    }
    if (focusKey) this.shadowRoot.querySelector(`[data-focus="${focusKey}"]`)?.focus();
    if (this._history) this.drawHistory();
    this.scheduleHistory(() => this.loadHistory(!reloadHistory));
  }

  setLevel(pct) {
    const c = this._config;
    const name = c.name || this.st(c.entity).attributes.friendly_name;
    const p = pct <= 0
      ? this.run("homeassistant", "turn_off", { entity_id: c.entity }, `${name} didn't answer.`)
      : this.dimmable(this.st(c.entity))
        ? this.run("light", "turn_on", { entity_id: c.entity, brightness_pct: pct }, `${name} didn't answer.`)
        : this.run("homeassistant", "turn_on", { entity_id: c.entity }, `${name} didn't answer.`);
    p.catch(() => {});
  }

  // Drag across the bar to set brightness; let go to send it. Arrow keys step by 10.
  wireSlider(el) {
    const fill = el.querySelector("i"), label = el.querySelector("span");
    let value = Number(el.getAttribute("aria-valuenow"));
    const show = (v) => {
      value = Math.max(0, Math.min(100, Math.round(v)));
      fill.style.width = `${value}%`; label.textContent = `${value}%`;
      label.classList.toggle("inside", value > 78);
      el.setAttribute("aria-valuenow", value);
    };
    const at = (e) => { const r = el.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
    el.addEventListener("pointerdown", (e) => { e.stopPropagation(); el.setPointerCapture(e.pointerId); this._busy = true; show(at(e)); });
    el.addEventListener("pointermove", (e) => { if (this._busy && el.hasPointerCapture(e.pointerId)) show(at(e)); });
    const done = (e) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      el.releasePointerCapture(e.pointerId);
      this.setLevel(value < 3 ? 0 : value);
      this.release();
    };
    el.addEventListener("pointerup", done);
    el.addEventListener("pointercancel", (e) => { el.hasPointerCapture(e.pointerId) && el.releasePointerCapture(e.pointerId); this.release(); });
    el.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 10, ArrowUp: 10, ArrowLeft: -10, ArrowDown: -10 }[e.key];
      if (step == null) return;
      e.preventDefault(); show(value + step);
      clearTimeout(this._keyTimer);
      this._keyTimer = setTimeout(() => this.setLevel(value < 3 ? 0 : value), 450);
    });
  }

  loadHistory(force) {
    const id = this._config.entity;
    fetchHistory(this._hass, [id], 24 * 7, false, force).then((h) => { this._history = h[id]; this.drawHistory(); }).catch(() => {});
  }

  drawHistory() {
    const pts = this._history || [];
    const now = Date.now();
    const spans = onSpans(pts, now - 7 * 86400000, now);
    const sr = this.shadowRoot;
    if (this._back) return this.drawBack(pts, spans, now);
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    sr.getElementById("today").textContent = duration(overlap(spans, midnight.getTime(), now));
    const hourStart = new Date(); hourStart.setMinutes(0, 0, 0);
    sr.querySelectorAll("#strip i").forEach((cell, i) => {
      const a = hourStart.getTime() - (23 - i) * 3600000, b = a + 3600000;
      const f = overlap(spans, a, Math.min(b, now)) / Math.min(3600000, Math.max(60000, Math.min(b, now) - a));
      cell.className = (f > 0 ? "lit" : "") + (i === 23 ? " now" : "");
      cell.style.height = f > 0 ? `${Math.max(6, Math.round(f * 50))}px` : "4px";
      cell.title = `${pad(new Date(a).getHours())}:00, ${Math.round(overlap(spans, a, Math.min(b, now)) / 60000)} m on`;
    });
    sr.getElementById("week").textContent = `This week ${duration(overlap(spans, now - 7 * 86400000, now))}`;
  }

  drawBack(pts, spans, now) {
    const sr = this.shadowRoot, range = this._range || "day";
    // Cells for the chosen range: 5-minute cells for the hour, hours for the day, days for the week.
    let cells = [], from;
    if (range === "hour") {
      const end = Math.ceil(now / 300000) * 300000; from = end - 3600000;
      for (let i = 0; i < 12; i++) { const a = from + i * 300000; cells.push({ a, b: a + 300000, label: i % 3 === 0 ? hhmm(a) : "" }); }
    } else if (range === "day") {
      const h = new Date(); h.setMinutes(0, 0, 0); from = h.getTime() - 23 * 3600000;
      for (let i = 0; i < 24; i++) { const a = from + i * 3600000; const hr = new Date(a).getHours(); cells.push({ a, b: a + 3600000, label: hr % 6 === 0 ? pad(hr) : "" }); }
    } else {
      const d = new Date(); d.setHours(0, 0, 0, 0); from = d.getTime() - 6 * 86400000;
      for (let i = 0; i < 7; i++) { const a = from + i * 86400000; cells.push({ a, b: a + 86400000, label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(a).getDay()] }); }
    }
    const n = cells.length;
    const bars = sr.getElementById("bars"), ticks = sr.getElementById("ticks");
    bars.style.gridTemplateColumns = ticks.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    bars.setAttribute("aria-label", `Time on, last ${range}`);
    // Hour and day bars are measured against the whole cell; week bars against the busiest day.
    const amounts = cells.map(({ a, b }) => overlap(spans, a, Math.min(b, now)));
    const scale = range === "week" ? Math.max(...amounts, 3600000) : null;
    bars.innerHTML = cells.map(({ a, b }, i) => {
      const on = amounts[i], f = on / (scale || b - a);
      return `<i class="${on > 0 ? "lit" : ""}" style="height:${on > 0 ? Math.max(5, Math.round(f * 64)) : 3}px" title="${duration(on)} on"></i>`;
    }).join("");
    if (range === "week") cells.forEach((x, i) => { x.label = `${x.label}<br>${amounts[i] >= 3600000 ? `${Math.round(amounts[i] / 3600000)}h` : `${Math.round(amounts[i] / 60000)}m`}`; });
    ticks.innerHTML = cells.map((x) => `<span>${x.label}</span>`).join("");
    const inRange = spans.map(([a, b]) => [Math.max(a, from), Math.min(b, now)]).filter(([a, b]) => b > a);
    const total = inRange.reduce((t, [a, b]) => t + b - a, 0);
    const longest = inRange.reduce((m, [a, b]) => Math.max(m, b - a), 0);
    const switchedOn = pts.filter((p, i) => p.s === "on" && p.t >= from && (i === 0 || pts[i - 1].s !== "on")).length;
    const lastOn = [...pts].reverse().find((p) => p.s === "on");
    sr.getElementById("stats").innerHTML = `
      <span>On for<b>${duration(total)}</b></span><span>Switched on<b>${switchedOn} ${switchedOn === 1 ? "time" : "times"}</b></span>
      <span>Longest<b>${duration(longest)}</b></span><span>Last on<b>${lastOn ? `${hhmm(lastOn.t)}${new Date(lastOn.t).toDateString() === new Date().toDateString() ? "" : `, ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(lastOn.t).getDay()]}`}` : "–"}</b></span>`;
  }
}

// ---------- status: the house in one sentence ----------

class CollageStatusCard extends CollageCard {
  validate(c) { return { ...c, lights: [].concat(c.lights || []), alerts: [].concat(c.alerts || []) }; }
  watch() {
    const c = this._config;
    return [c.temperature, c.climate, "sun.sun", ...c.lights, ...c.alerts.map((a) => a.entity)].filter(Boolean);
  }
  getGridOptions() { return { columns: 12, rows: "auto" }; }

  alertsNow() {
    return this._config.alerts.filter((a) => {
      const s = this.st(a.entity);
      if (!s) return false;
      if (a.state != null) return [].concat(a.state).includes(s.state);
      if (a.above != null) return Number(s.state) > a.above;
      if (a.below != null) return s.state !== "" && Number(s.state) < a.below;
      return false;
    }).map((a) => ({ ...a, value: this.st(a.entity).state }));
  }

  update() {
    const c = this._config;
    const lit = c.lights.filter((id) => this.st(id)?.state === "on").map((id) => this.st(id));
    const t = this.st(c.temperature), cl = this.st(c.climate), sun = this.st("sun.sun");
    const alerts = this.alertsNow();
    const temp = tempOf(t);
    const heating = cl?.attributes.hvac_action === "heating";
    const up = sun?.state === "above_horizon";
    const sunTime = sun ? hhmm(new Date(up ? sun.attributes.next_setting : sun.attributes.next_rising)) : "";
    const litNames = lit.map((s) => esc((c.names || {})[s.entity_id] || s.attributes.friendly_name));
    const lead = alerts.length
      ? `${alerts.length === 1 ? "One thing" : `${alerts.length} things`} to look at.`
      : lit.length === 0 ? "All quiet. Every light is off." : `All quiet. ${lit.length === 1 ? "One light" : `${lit.length} lights`} on.`;

    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        :host { z-index: 3; }
        .wrap { position: relative; z-index: 1; padding: 4px 0 14px; color: var(--hc-paper, #F4F0E6); }
        .temp { position: relative; display: inline-block; padding: 8px 18px 4px 14px; background: var(--hc-red, #D7301F);
          transform: rotate(-2deg); box-shadow: 0 1px 1px rgba(0,0,0,.3), 0 10px 20px -8px rgba(0,0,0,.6); }
        .temp .n { font-size: 92px; font-weight: 700; line-height: .82; letter-spacing: -.05em; }
        .temp .n sup { font-size: 40px; vertical-align: top; letter-spacing: 0; }
        .temp .k { font-size: 12px; font-weight: 600; letter-spacing: .04em; margin-top: 4px; }
        .disc { position: absolute; width: 74px; height: 74px; border-radius: 50%; background: var(--hc-yellow, #F2B705);
          right: 8px; top: 0; box-shadow: 0 8px 16px -8px rgba(0,0,0,.6); }
        .disc.down { background: var(--hc-cobalt, #1F3D8C); }
        .sun { position: absolute; right: 14px; top: 78px; text-align: right; font-size: 13px; font-weight: 600; }
        .sun b { display: block; font-size: 26px; letter-spacing: -.02em; }
        .lead { margin: 18px 0 0; font-size: 30px; font-weight: 700; line-height: 1; letter-spacing: -.025em; max-width: 15ch; }
        .lit { margin-top: 8px; font-size: 16px; font-weight: 600; color: var(--hc-paper, #F4F0E6); }
        .alerts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .alert { background: var(--hc-pink, #E9A3B8); color: var(--hc-black, #141414); padding: 7px 11px 6px; font-size: 14px; font-weight: 700;
          box-shadow: 0 1px 1px rgba(0,0,0,.3), 0 6px 12px -6px rgba(0,0,0,.6); }
        .alert:nth-child(odd) { transform: rotate(-1deg); } .alert:nth-child(even) { transform: rotate(.8deg); }
        .alert.error { background: var(--hc-red, #D7301F); color: var(--hc-paper, #F4F0E6); }
      </style>
      ${scatter("status", 8, ["top", "right"])}
      <div class="wrap">
        <div class="temp num"><div class="n">${temp != null ? temp.toFixed(1) : "–"}<sup>°</sup></div>
          <div class="k">${heating ? "INSIDE · HEATING" : "INSIDE"}</div></div>
        <div class="disc ${up ? "" : "down"}"></div>
        <div class="sun num">${up ? "Sunset" : "Sunrise"}<b>${sunTime}</b></div>
        <p class="lead">${lead}</p>
        ${lit.length ? `<div class="lit">${litNames.length === 1 ? litNames[0] : `${litNames.slice(0, -1).join(", ")} and ${litNames[litNames.length - 1]}`} ${lit.length === 1 ? "light is" : "lights are"} on.</div>` : ""}
        ${alerts.length ? `<div class="alerts">${alerts.map((a, i) => `<button class="alert ${a.level === "error" ? "error" : ""}" data-i="${i}">${esc((a.text_one && Number(a.value) === 1 ? a.text_one : a.text || this.st(a.entity)?.attributes.friendly_name || a.entity).replace("{state}", a.value))}</button>`).join("")}</div>` : ""}
      </div>`;
    this.shadowRoot.querySelectorAll(".alert").forEach((b) => b.addEventListener("click", () => {
      const a = alerts[Number(b.dataset.i)];
      a.navigate ? this.navigate(a.navigate) : this.moreInfo(a.entity);
    }));
  }
}

// ---------- action: one black bar, one tap ----------

class CollageActionCard extends CollageCard {
  validate(c) { if (!c.action || !c.name) throw new Error("collage-action-card needs name and action"); return { form: 3, ...c }; }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  update() {
    const c = this._config;
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .bar { display: flex; align-items: center; justify-content: space-between; min-height: 64px; padding: 0 20px;
          background: var(--hc-black, #141414); color: var(--hc-paper, #F4F0E6); transform: rotate(.6deg); overflow: visible; }
        .bar span { font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
        .bar em { font-style: normal; font-size: 13px; font-weight: 500; opacity: .75; }
        .form { width: 58px; left: 46%; top: -20px; transform: rotate(-28deg); }
        .done span::after { content: " — done"; color: var(--hc-yellow, #F2B705); }
      </style>
      ${scatter(c.name, 5)}
      <div class="paper bar press" role="button" tabindex="0" aria-label="${esc(c.name)}">
        <span>${esc(c.name)}</span>${c.note ? `<em>${esc(c.note)}</em>` : ""}
        ${form(c.form, colour(c.form_color || "yellow"))}
      </div>`;
    const bar = this.shadowRoot.querySelector(".bar");
    pressable(bar, {
      tap: () => {
        const [domain, service] = c.action.split(".");
        this.run(domain, service, c.data || {}).then(() => {
          bar.classList.add("done");
          setTimeout(() => bar.classList.remove("done"), 2200);
        }).catch(() => {});
      },
    });
  }
}

// ---------- climate: the day's heat as one cut-paper form ----------

const MODE_WORDS = { heat: "Heat", cool: "Cool", heat_cool: "Auto", auto: "Auto", off: "Off", dry: "Dry", fan_only: "Fan" };
// A temperature from a sensor, or from a weather entity, whose state is the sky and not a number.
const tempOf = (s) => { if (!s) return null; const v = Number(s.entity_id.startsWith("weather.") ? s.attributes.temperature : s.state); return isNaN(v) ? null : v; };

class CollageClimateCard extends CollageCard {
  validate(c) {
    if (!c.climate) throw new Error("collage-climate-card needs a climate entity");
    return { name: "Heat", ...c };
  }
  watch() { return [this._config.climate, this._config.temperature, this._config.outside].filter(Boolean); }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  connectedCallback() {
    super.connectedCallback();
    this._ro = this._ro || new ResizeObserver(() => { if (this._data) this.draw(); });
    this._ro.observe(this);
  }
  disconnectedCallback() { super.disconnectedCallback(); this._ro && this._ro.disconnect(); clearTimeout(this._fade); }

  update(reloadHistory) {
    const c = this._config, cl = this.st(c.climate);
    if (!cl) { this.shadowRoot.innerHTML = `<style>${MATERIAL}</style><div class="paper" style="padding:14px">${esc(c.climate)} is not found</div>`; return; }
    // The inside temperature: its own sensor if given, else the thermostat's reading.
    const inside = this.inside();
    const focusKey = this.shadowRoot.activeElement?.dataset?.focus;
    const set = cl.attributes.temperature;
    const mode = cl.state;
    const action = cl.attributes.hvac_action;
    // What does the work: "Furnace running" with runner: Furnace, else "Heating" or "Cooling".
    const runs = c.runner ? `${c.runner} running` : "Running";
    const status = mode === "off" ? "Off" : action === "heating" ? (c.runner ? runs : "Heating") : action === "cooling" ? (c.runner ? runs : "Cooling")
      : action === "drying" ? "Drying" : action === "fan" ? "Fan only" : c.runner ? `${c.runner} idle` : "Idle";
    const fixed = set == null || mode === "off";
    // The outside temperature, optional: a sensor or a weather entity's reading.
    const o = c.outside && tempOf(this.st(c.outside)), out = o != null ? `${o.toFixed(1)}°` : null;
    const range = this._range || "day";
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .card { padding: 14px 14px 12px; transform: rotate(-.5deg); }
        .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
        .sub { font-size: 13px; font-weight: 500; margin-top: 4px; color: #4A4740; }
        .set { display: flex; align-items: center; gap: 6px; }
        .set button { display: grid; place-items: center; width: 44px; height: 44px; background: var(--hc-black, #141414);
          color: var(--hc-paper, #F4F0E6); --mdc-icon-size: 22px; }
        .set button:disabled { background: #B9B3A5; cursor: default; }
        .set .v { min-width: 62px; text-align: center; font-size: 26px; font-weight: 700; letter-spacing: -.03em; }
        .set .v small { display: block; font-size: 11px; font-weight: 600; letter-spacing: .04em; }
        .row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin-top: 12px; }
        .tabs button[data-mode="heat"][aria-pressed="true"] { background: var(--hc-red, #D7301F); }
        .runs { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font-size: 12px; font-weight: 600; }
        .runs b { display: block; font-size: 20px; letter-spacing: -.02em; }
        .plot { position: relative; margin-top: 10px; min-height: 172px; }
        svg.chart { display: block; overflow: visible; touch-action: pan-y; cursor: crosshair; user-select: none; -webkit-user-select: none; }
        .tip { position: absolute; top: 0; z-index: 2; padding: 4px 7px 5px; pointer-events: none; white-space: nowrap;
          background: var(--hc-black, #141414); color: var(--hc-paper, #F4F0E6); box-shadow: 0 6px 10px -6px rgba(0,0,0,.6); }
        .tip b { display: block; font-size: 18px; letter-spacing: -.02em; line-height: 1.1; }
        .tip span { display: block; font-size: 11px; font-weight: 600; }
        .axis { font: 600 11px var(--hc-display, sans-serif); fill: #4A4740; }
        .axis.set { font-weight: 700; fill: var(--hc-black, #141414); }
        .shape { filter: drop-shadow(0 6px 6px rgba(0,0,0,.28)); }
        .legend { display: flex; gap: 14px; font-size: 12px; font-weight: 600; margin-top: 4px; }
        .legend i { display: inline-block; width: 14px; height: 8px; margin-right: 5px; vertical-align: 0; }
      </style>
      ${scatter(c.climate, 7)}
      <div class="paper card">
        <div class="head">
          <div><h2>${esc(c.name)}</h2><div class="sub num" id="sub">${esc(status)}</div></div>
          <div class="set">
            <button id="down" data-focus="down" aria-label="Lower the setpoint" ${fixed ? "disabled" : ""}>${icon("minus")}</button>
            <div class="v num">${set != null ? Number(set).toFixed(1) : "–"}°<small>SET</small></div>
            <button id="up" data-focus="up" aria-label="Raise the setpoint" ${fixed ? "disabled" : ""}>${icon("plus")}</button>
          </div>
        </div>
        <div class="row">
          <div class="tabs" role="group" aria-label="Thermostat mode">
            ${(cl.attributes.hvac_modes || ["heat", "off"]).map((m) => `<button data-mode="${m}" data-focus="m-${m}" aria-pressed="${mode === m}">${MODE_WORDS[m] || esc(said(m))}</button>`).join("")}
          </div>
          <div class="tabs" role="group" aria-label="Range">
            <button data-range="day" data-focus="r-day" aria-pressed="${range === "day"}">24 h</button>
            <button data-range="week" data-focus="r-week" aria-pressed="${range === "week"}">7 days</button>
          </div>
        </div>
        <div class="runs num"><span>${esc(c.runner || "Running")} today<b id="rtoday">–</b></span><span>This week<b id="rweek">–</b></span>${inside != null ? `<span>Inside now<b>${inside.toFixed(1)}°</b></span>` : ""}${out ? `<span>Outside now<b>${out}</b></span>` : ""}</div>
        <div class="plot" id="plot"></div>
        <div class="legend"><span><i style="background:var(--hc-red,#D7301F)"></i>Inside temperature</span><span><i style="background:var(--hc-black,#141414)"></i>${esc(runs)}</span></div>
      </div>`;
    const sr = this.shadowRoot;
    // The thermostat's own step, else half a degree Celsius or one Fahrenheit.
    const inc = Number(cl.attributes.target_temp_step) || (this._hass.config.unit_system?.temperature === "°F" ? 1 : 0.5);
    const step = (d) => () => {
      const v = Math.round((Number(this.st(c.climate).attributes.temperature) + d) / inc) * inc;
      this.run("climate", "set_temperature", { entity_id: c.climate, temperature: v }, "The thermostat didn't answer.").catch(() => {});
    };
    sr.getElementById("down").addEventListener("click", step(-inc));
    sr.getElementById("up").addEventListener("click", step(inc));
    sr.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () =>
      this.run("climate", "set_hvac_mode", { entity_id: c.climate, hvac_mode: b.dataset.mode }, "The thermostat didn't answer.").catch(() => {})));
    sr.querySelectorAll("[data-range]").forEach((b) => b.addEventListener("click", () => { this._range = b.dataset.range; this.update(false); }));
    if (focusKey) sr.querySelector(`[data-focus="${focusKey}"]`)?.focus();
    if (this._data) this.draw();
    this.scheduleHistory(() => Promise.all([
      c.temperature ? fetchHistory(this._hass, [c.temperature], 168, false, !reloadHistory) : Promise.resolve({}),
      fetchHistory(this._hass, [c.climate], 168, true, !reloadHistory),
    ]).then(([a, b]) => {
      // Without a temperature sensor, the thermostat's current_temperature is the reading.
      const temp = c.temperature ? a[c.temperature] : (b[c.climate] || []).map((p) => ({ t: p.t, s: p.a.current_temperature }));
      this._data = { temp, climate: b[c.climate] };
      this.draw();
    }).catch(() => {}));
  }

  inside() {
    const c = this._config, t = c.temperature ? Number(this.st(c.temperature)?.state) : Number(this.st(c.climate)?.attributes.current_temperature);
    return isNaN(t) ? null : t;
  }

  draw() {
    const plot = this.shadowRoot.getElementById("plot");
    if (!plot || !this._data) return;
    const { temp, climate } = this._data, c = this._config;
    const week = this._range === "week";
    const hours = week ? 168 : 24;
    const now = Date.now(), from = now - hours * 3600000;
    // Drawn at the measured width, so type and bars keep their proportions.
    const W = Math.max(240, Math.round(plot.clientWidth)), H = 172, G = 34, top = 10, base = 124;
    const all = temp.map((p) => [p.t, Number(p.s)]).filter((p) => !isNaN(p[1]));
    if (!all.length) return;
    all.push([now, all[all.length - 1][1]]);
    const pts = all.filter((p, i) => p[0] >= from || (all[i + 1] && all[i + 1][0] > from));
    const vals = pts.map((p) => p[1]);
    const setRaw = this.st(c.climate).attributes.temperature, set = setRaw == null ? null : Number(setRaw);
    const range = set == null ? vals : [...vals, set];
    const lo = Math.floor(Math.min(...range) - 0.6), hi = Math.ceil(Math.max(...range) + 0.4);
    const x = (t) => G + ((Math.max(t, from) - from) / (now - from)) * (W - G);
    const y = (v) => top + (1 - (v - lo) / (hi - lo)) * (base - top);
    // One organic form: readings averaged over spans, rising from the cut edge and falling back to it.
    const span = week ? 6 * 3600000 : 5400000;
    const samples = [[G, base]];
    for (let t = from, i = 0; t < now; t += span) {
      let sum = 0, n = 0;
      for (let u = t; u < Math.min(t + span, now); u += 300000) {
        while (i + 1 < pts.length && pts[i + 1][0] <= u) i++;
        sum += pts[i][0] <= u ? pts[i][1] : pts[0][1]; n++;
      }
      if (n) samples.push([x(Math.min(t + span / 2, now)), y(sum / n)]);
    }
    samples.push([W - 6, y(pts[pts.length - 1][1])], [W, base]);
    const r = rng(c.climate);
    let bottom = `L${W},${base + 3}`;
    for (let bx = W - 28; bx > G; bx -= 28) bottom += ` L${bx.toFixed(0)},${(base + 1 + r() * 5).toFixed(1)}`;
    bottom += ` L${G},${base + 2} Z`;
    const heatAll = onSpans(climate.map((p) => ({ t: p.t, s: p.a.hvac_action })), now - 168 * 3600000, now, (s) => s === "heating" || s === "cooling");
    const heat = heatAll.map(([a, b]) => [Math.max(a, from), b]).filter(([a, b]) => b > a);
    const ticks = [];
    if (week) {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      for (let i = 6; i >= 0; i--) {
        const t = d.getTime() - i * 86400000;
        if (t > from) ticks.push(`<text class="axis" x="${x(t).toFixed(1)}" y="${H - 2}">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(t).getDay()]}</text>`);
      }
    } else {
      for (let h = 0; h <= 24; h += 6) {
        const t = now - (24 - h) * 3600000;
        ticks.push(`<text class="axis" x="${x(t).toFixed(1)}" y="${H - 2}" text-anchor="${h === 0 ? "start" : h === 24 ? "end" : "middle"}">${h === 24 ? "now" : hhmm(t)}</text>`);
      }
    }
    const ys = set == null ? -100 : y(set);
    const labelHi = Math.abs(y(hi) - ys) > 14, labelLo = Math.abs(base - ys) > 14;
    plot.innerHTML = `
      <svg class="chart num" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Inside temperature over the last ${week ? "7 days" : "day"}, between ${lo} and ${hi} degrees">
        <path class="shape" d="${smoothPath(samples)} ${bottom}" fill="var(--hc-red, #D7301F)" transform="rotate(-.6 ${W / 2} ${base})"/>
        ${set == null ? "" : `<line x1="${G}" x2="${W}" y1="${ys.toFixed(1)}" y2="${ys.toFixed(1)}" stroke="var(--hc-black,#141414)" stroke-width="1.5" stroke-dasharray="4 3"/>
        <text class="axis set" x="0" y="${(ys + 4).toFixed(1)}">${set}°</text>`}
        ${labelHi ? `<text class="axis" x="0" y="${(y(hi) + 4).toFixed(1)}">${hi}°</text>` : ""}
        ${labelLo ? `<text class="axis" x="0" y="${base}">${lo}°</text>` : ""}
        ${heat.map(([a, b]) => `<rect x="${x(a).toFixed(1)}" y="${base + 14}" width="${Math.max(2, x(b) - x(a)).toFixed(1)}" height="14" fill="var(--hc-black,#141414)"/>`).join("")}
        ${ticks.join("")}
        <line id="hl" y1="${top - 6}" y2="${base + 28}" stroke="var(--hc-black,#141414)" stroke-width="1.5" stroke-dasharray="1.5 3" stroke-linecap="round" visibility="hidden"/>
      </svg>
      <div class="tip num" id="tip" hidden><b></b><span></span></div>`;
    this.hover(plot, { pts, from, now, W, G, x });
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    this.shadowRoot.getElementById("rtoday").textContent = duration(overlap(heatAll, midnight.getTime(), now));
    this.shadowRoot.getElementById("rweek").textContent = duration(overlap(heatAll, now - 7 * 86400000, now));
  }

  // Pointing at the chart (a mouse over it, or a finger on it) draws a dotted line there and
  // the reading in force at that moment, with its time. A finger's reading stays a few seconds.
  hover(plot, { pts, from, now, W, G, x }) {
    const svg = plot.querySelector("svg"), line = plot.querySelector("#hl"), tip = plot.querySelector("#tip");
    const show = (t) => {
      this._hoverT = t;
      if (t == null) { line.setAttribute("visibility", "hidden"); tip.hidden = true; return; }
      let i = 0;
      while (i + 1 < pts.length && pts[i + 1][0] <= t) i++;
      const d = new Date(t), today = d.toDateString() === new Date().toDateString();
      const px = x(t).toFixed(1);
      line.setAttribute("x1", px); line.setAttribute("x2", px); line.setAttribute("visibility", "visible");
      tip.querySelector("b").textContent = `${pts[i][1].toFixed(1)}°`;
      tip.querySelector("span").textContent = today ? hhmm(t) : `${DAYS[d.getDay()]} ${hhmm(t)}`;
      tip.hidden = false;
      // Beside the line, on whichever side has room.
      const w = tip.offsetWidth, right = x(t) + 8 + w <= W;
      tip.style.left = `${right ? x(t) + 8 : Math.max(0, x(t) - 8 - w)}px`;
    };
    const at = (e) => {
      const px = e.clientX - svg.getBoundingClientRect().left;
      return from + (Math.min(Math.max(px, G), W) - G) / (W - G) * (now - from);
    };
    this._show = show;
    svg.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      clearTimeout(this._fade); this._busy = true; show(at(e));
    });
    svg.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || this._busy) show(at(e)); });
    svg.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") show(null); });
    const lift = (e) => {
      if (e.pointerType === "mouse") return;
      this.release();
      // Through this._show, so a redraw meanwhile still has its reading taken away.
      this._fade = setTimeout(() => this._show(null), 4000);
    };
    svg.addEventListener("pointerup", lift);
    svg.addEventListener("pointercancel", lift);
    // A redraw (new readings, a resize) keeps what was being pointed at.
    if (this._hoverT != null) show(Math.min(Math.max(this._hoverT, from), now));
  }
}

// ---------- sun and shade: the day's arc, the shade in its window ----------

// Where the sun is, seen from (lat, lon) at time t: bearing from north and height above the
// horizon, in degrees. A short form of NOAA's equations, good to about half a degree.
function sunPosition(t, lat, lon) {
  const rad = Math.PI / 180, d = t / 86400000 - 10957.5;
  const g = (357.529 + 0.98560028 * d) * rad, q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad, e = (23.439 - 0.00000036 * d) * rad;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
  const H = ((18.697374558 + 24.06570982441908 * d) * 15 + lon) * rad - ra, la = lat * rad;
  const el = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(H));
  return { az: ((az / rad) % 360 + 360) % 360, el: el / rad };
}
const POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
const point = (az) => POINTS[Math.round(az / 22.5) % 16];
const POINT_WORDS = { N: "north", E: "east", S: "south", W: "west" };
// "SSE" said as "south-southeast".
const pointSaid = (az) => { const w = point(az).split("").map((ch) => POINT_WORDS[ch]); return w.length === 3 ? `${w[0]}-${w[1]}${w[2]}` : w.join(""); };

// Building footprints near a point, from OpenStreetMap: Overpass first, the OSM API if it is
// busy. Fetched once per browser and kept for 30 days, so the card asks about once a month.
async function buildingsNear(lat, lon, metres = 90) {
  const key = `collage:buildings:${lat.toFixed(5)},${lon.toFixed(5)},${metres}`;
  try { const hit = JSON.parse(localStorage.getItem(key)); if (hit && Date.now() - hit.at < 30 * 86400000) return hit.ways; } catch (e) { /* none kept */ }
  let ways;
  try {
    const q = `[out:json][timeout:20];way(around:${metres},${lat},${lon})[building];out geom;`;
    const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: new URLSearchParams({ data: q }) });
    if (!r.ok) throw new Error(r.status);
    ways = (await r.json()).elements.filter((e) => e.geometry).map((e) => e.geometry.map((g) => [g.lat, g.lon]));
  } catch (e) {
    const dl = metres / 111320, dn = metres / (111320 * Math.cos((lat * Math.PI) / 180));
    const r = await fetch(`https://api.openstreetmap.org/api/0.6/map?bbox=${lon - dn},${lat - dl},${lon + dn},${lat + dl}`);
    if (!r.ok) throw new Error(r.status);
    const x = new DOMParser().parseFromString(await r.text(), "application/xml"), nodes = {};
    for (const nd of x.querySelectorAll("node")) nodes[nd.getAttribute("id")] = [Number(nd.getAttribute("lat")), Number(nd.getAttribute("lon"))];
    ways = [...x.querySelectorAll("way")].filter((w) => w.querySelector('tag[k="building"]'))
      .map((w) => [...w.querySelectorAll("nd")].map((nd) => nodes[nd.getAttribute("ref")]).filter(Boolean));
  }
  try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), ways })); } catch (e) { /* storage full: fetch again next time */ }
  return ways;
}
const inside = (pt, poly) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ay, ax] = poly[i], [by, bx] = poly[j];
    if ((ay > pt[0]) !== (by > pt[0]) && pt[1] < ((bx - ax) * (pt[0] - ay)) / (by - ay) + ax) hit = !hit;
  }
  return hit;
};

// Where the moon is, as sunPosition, and how much of it is lit: the lunar series cut to its
// largest terms (good to about a degree), with parallax, the lit fraction and whether it waxes.
function moonPosition(t, lat, lon) {
  const rad = Math.PI / 180, d = t / 86400000 - 10957.5, e = 23.4397 * rad;
  const M = (134.963 + 13.064993 * d) * rad, F = (93.272 + 13.22935 * d) * rad;
  const l = (218.316 + 13.176396 * d) * rad + 6.289 * rad * Math.sin(M), b = 5.128 * rad * Math.sin(F);
  const dist = 385001 - 20905 * Math.cos(M);
  const ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
  const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
  const H = ((18.697374558 + 24.06570982441908 * d) * 15 + lon) * rad - ra, la = lat * rad;
  let el = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H));
  el -= Math.asin(6378.14 / dist) * Math.cos(el);
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(H));
  // The phase from the moon's ecliptic longitude against the sun's.
  const g = (357.529 + 0.98560028 * d) * rad;
  const ls = (280.459 + 0.98564736 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const elong = Math.acos(Math.cos(l - ls) * Math.cos(b));
  return { az: ((az / rad) % 360 + 360) % 360, el: el / rad, lit: (1 - Math.cos(elong)) / 2, waxing: Math.sin(l - ls) > 0 };
}
const moonSaid = (m) => (m.lit < 0.03 ? "new" : m.lit > 0.97 ? "full" : m.lit < 0.47 ? `a ${m.waxing ? "waxing" : "waning"} crescent`
  : m.lit > 0.53 ? `${m.waxing ? "waxing" : "waning"} gibbous` : `at its ${m.waxing ? "first" : "last"} quarter`);

// ---------- the dome in 3D: the yard as a paper disc, the sky as glass over it ----------

// three.js, loaded from jsDelivr the first time a dome is shown; nothing else here needs it.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js";
let threeLoading = null;
const loadThree = () => (threeLoading = threeLoading || import(THREE_URL));

// The disc is the 90 m around the home point, photographed from above, with the buildings
// stood up on it (OpenStreetMap rarely has heights, so each is 7 m) and, when the card is
// given one, the lot's outline washed in.
// The dome is the sky: today's sun and moon paths on it, the sun and moon where they are at
// the chosen time, and the light falling from them, so the shadows are the real ones.
// Drag turns it, a pinch zooms, and the slider moves the time through today.
const DOME_R = 90;
class CollageSunDome extends HTMLElement {
  constructor() {
    super();
    this._yaw = 340; this._pitch = 24; this._dist = 330; this._t = null;
    this.attachShadow({ mode: "open" }).innerHTML = `<style>${MATERIAL}
      :host { margin: 14px auto 0; max-width: 440px; }
      .frame { padding: 7px 7px 10px; transform: rotate(.6deg); }
      .stage { position: relative; aspect-ratio: 1; overflow: hidden; touch-action: none; cursor: grab; outline: none;
        background: linear-gradient(#0A1230, #1F3D8C); }
      .stage:active { cursor: grabbing; }
      .stage:focus-visible { box-shadow: inset 0 0 0 3px var(--hc-yellow, #F2B705); }
      canvas { display: block; width: 100%; height: 100%; }
      .stamp { position: absolute; left: 9px; top: 7px; pointer-events: none; color: var(--hc-paper, #F4F0E6); font-size: 11px; font-weight: 700;
        text-shadow: 0 0 3px #141414, 0 0 2px #141414; }
      .stamp b { display: block; font-size: 30px; letter-spacing: -.03em; line-height: 1; }
      .wait { position: absolute; inset: 0; display: grid; place-items: center; padding: 20px; text-align: center; pointer-events: none;
        color: var(--hc-paper, #F4F0E6); font-size: 14px; font-weight: 700; }
      .credit { position: absolute; right: 6px; bottom: 4px; pointer-events: none; color: var(--hc-paper, #F4F0E6); font-size: 8px; font-weight: 700;
        text-shadow: 0 0 2px #141414; }
      .time { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; margin-top: 9px; }
      input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 44px; margin: 0; background: transparent; cursor: pointer; }
      input[type=range]::-webkit-slider-runnable-track { height: 8px; background: var(--track); border: 2px solid var(--hc-black, #141414); }
      input[type=range]::-moz-range-track { height: 8px; background: var(--track); border: 2px solid var(--hc-black, #141414); }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 28px; margin-top: -12px; border-radius: 50%;
        background: var(--hc-red, #D7301F); border: 3px solid var(--hc-black, #141414); }
      input[type=range]::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: var(--hc-red, #D7301F); border: 3px solid var(--hc-black, #141414); }
      input[type=range]:focus-visible { outline: 3px solid var(--hc-yellow, #F2B705); outline-offset: 2px; }
      .now { min-height: 40px; padding: 0 14px; background: var(--hc-black, #141414); color: var(--hc-paper, #F4F0E6); font-size: 13px; font-weight: 700; }
      .now[aria-pressed="true"] { background: #B9B3A5; color: var(--hc-black, #141414); }
      .figs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px 8px; margin-top: 4px; font-size: 11px; font-weight: 600; }
      .figs b { display: block; font-size: 19px; letter-spacing: -.02em; }
      @container (max-width: 360px) { .figs { grid-template-columns: 1fr 1fr; } }
      .said { margin-top: 7px; font-size: 12px; font-weight: 600; color: #4A4740; }
      .grow { position: absolute; right: 7px; top: 7px; display: grid; place-items: center; width: 44px; height: 44px;
        background: var(--hc-black, #141414); color: var(--hc-paper, #F4F0E6); --mdc-icon-size: 24px; }
      /* The lightbox: the same frame lifted into a dialog over the whole screen. */
      dialog { width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 12px; border: 0;
        background: rgba(13,14,19,.94); color: inherit; }
      dialog::backdrop { background: transparent; }
      dialog[open] { display: grid; place-items: center; }
      dialog .frame { display: flex; flex-direction: column; width: min(100%, 1100px); height: 100%; transform: none; }
      dialog .stage { flex: 1; min-height: 0; aspect-ratio: auto; }
    </style>
    <div class="frame paper">
      <div class="stage" tabindex="0" role="img" aria-roledescription="3D view">
        <canvas></canvas>
        <div class="stamp num"><b class="clock"></b><span class="where"></span></div>
        <div class="wait">Unfolding the sky…</div>
        <button class="grow" aria-label="Show full screen">${icon("arrow-expand")}</button>
        <div class="credit">Imagery © Esri · buildings © OpenStreetMap contributors</div>
      </div>
      <div class="time"><input type="range" min="0" max="1435" step="5" aria-label="Time of day"><button class="now" aria-pressed="true">Now</button></div>
      <div class="figs num"><span>Bearing<b data-f="bearing"></b></span><span>Height<b data-f="height"></b></span>
        <span>Highest today<b data-f="high"></b></span><span>Shadows<b data-f="shadow"></b></span></div>
      <div class="said"></div>
    </div>
    <dialog aria-label="The sky over the house"></dialog>`;
    const sr = this.shadowRoot;
    this._stage = sr.querySelector(".stage");
    this._range = sr.querySelector("input");
    this._range.addEventListener("input", () => { this._t = Number(this._range.value); this.paint(); });
    sr.querySelector(".now").addEventListener("click", () => { this._t = null; this.paint(); });
    // Expand moves the frame into a modal dialog (the top layer, clear of the card's tilt) and
    // back again on close; the card holds its redraws meanwhile so the dialog stays put.
    const grow = sr.querySelector(".grow"), dlg = sr.querySelector("dialog"), frame = sr.querySelector(".frame");
    grow.addEventListener("pointerdown", (e) => e.stopPropagation());
    grow.addEventListener("click", () => {
      if (this._big) { dlg.close(); return; }
      this._big = true; this.onBusy?.(true);
      dlg.append(frame); dlg.showModal();
      grow.innerHTML = icon("close"); grow.setAttribute("aria-label", "Close full screen");
    });
    dlg.addEventListener("close", () => {
      this._big = false;
      sr.append(frame);
      grow.innerHTML = icon("arrow-expand"); grow.setAttribute("aria-label", "Show full screen");
      this.onBusy?.(false);
    });
    this.wire();
  }
  connectedCallback() {
    clearInterval(this._clock);
    this._clock = setInterval(() => { if (this._t == null) this.paint(); }, 60000);
    if (this._renderer && !this._ro) this.observe();
  }
  disconnectedCallback() { clearInterval(this._clock); }

  // Data from the card; the scene is built once and kept across the card's redraws.
  show(d) {
    const old = this._d || {};
    this._d = d;
    if (!this._three) {
      if (!this._loading) this._loading = loadThree().then((T) => { this.build(T); this.paint(); }).catch(() => {
        this.shadowRoot.querySelector(".wait").textContent = "The 3D sky needs three.js from cdn.jsdelivr.net, and it didn't load.";
      });
      return;
    }
    if (d.buildings !== old.buildings || d.ours !== old.ours) this.stand();
    if (d.lot !== old.lot) this.washLot();
    this.paint();
  }

  // Drag turns the dome, two fingers pinch it nearer or farther; arrow keys turn it too.
  wire() {
    const st = this._stage, pts = new Map();
    let pinch = 0;
    const spread = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
    st.addEventListener("pointerdown", (e) => {
      st.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) pinch = spread();
      this.onBusy?.(true);
    });
    st.addEventListener("pointermove", (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      if (pts.size === 1) {
        this._yaw = (this._yaw - (e.clientX - p.x) * 0.4 + 360) % 360;
        this._pitch = Math.max(3, Math.min(88, this._pitch + (e.clientY - p.y) * 0.3));
      }
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 2) { const s = spread(); if (pinch) this.zoom(pinch / s); pinch = s; }
      this.frame();
    });
    const up = (e) => { pts.delete(e.pointerId); pinch = 0; if (!pts.size && !this._big) this.onBusy?.(false); };
    st.addEventListener("pointerup", up);
    st.addEventListener("pointercancel", up);
    // A trackpad pinch arrives as a wheel with ctrl held; a plain wheel still scrolls the page,
    // except full screen, where there is no page to scroll.
    st.addEventListener("wheel", (e) => { if (!e.ctrlKey && !this._big) return; e.preventDefault(); this.zoom(Math.exp(e.deltaY * 0.01)); this.frame(); }, { passive: false });
    st.addEventListener("keydown", (e) => {
      const k = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 6], ArrowDown: [0, -6] }[e.key];
      if (!k) return;
      e.preventDefault();
      this._yaw = (this._yaw + k[0] + 360) % 360; this._pitch = Math.max(3, Math.min(88, this._pitch + k[1]));
      this.frame();
    });
  }
  zoom(f) { this._dist = Math.max(170, Math.min(600, this._dist * f)); }
  observe() {
    this._ro = new ResizeObserver(() => {
      const w = this._stage.clientWidth, h = this._stage.clientHeight;
      if (!w || !h) return;
      // Keep 36° across when the view is taller than wide (a phone held upright, full screen).
      const c = this._camera, rad = Math.PI / 180;
      c.aspect = w / h; c.fov = w >= h ? 36 : (2 * Math.atan(Math.tan(18 * rad) / c.aspect)) / rad;
      this._renderer.setSize(w, h, false); c.updateProjectionMatrix(); this.frame();
    });
    this._ro.observe(this._stage);
  }
  frame() { if (this._raf || !this._renderer) return; this._raf = requestAnimationFrame(() => { this._raf = 0; this.draw(); }); }

  // A point on the dome, or on the ground (metres east, up, south of the home point).
  sky(az, el, r = DOME_R) {
    const rad = Math.PI / 180;
    return new this._three.Vector3(r * Math.cos(el * rad) * Math.sin(az * rad), r * Math.sin(el * rad), -r * Math.cos(el * rad) * Math.cos(az * rad));
  }
  local([la, lo]) {
    const { lat, lon } = this._d;
    return [(lo - lon) * 111320 * Math.cos((lat * Math.PI) / 180), -(la - lat) * 110574];
  }
  // A text label as a sprite: paper letters with a black edge, like the map's.
  label(text, size, color = "#F4F0E6") {
    const T = this._three, c = document.createElement("canvas"), x = c.getContext("2d"), font = '700 64px "Familjen Grotesk", sans-serif';
    x.font = font;
    c.width = Math.ceil(x.measureText(text).width) + 28; c.height = 92;
    x.font = font; x.textAlign = "center"; x.textBaseline = "middle"; x.lineJoin = "round";
    x.lineWidth = 14; x.strokeStyle = "#141414"; x.strokeText(text, c.width / 2, 48);
    x.fillStyle = color; x.fillText(text, c.width / 2, 48);
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    s.scale.set((size * c.width) / c.height, size, 1);
    return s;
  }
  glow(color, inner = 0.2) {
    const T = this._three, c = document.createElement("canvas"), x = c.getContext("2d");
    c.width = c.height = 128;
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color); g.addColorStop(inner, color); g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    return new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  }
  // A thick line as a thin cut-paper tube, with a black edge behind it.
  tube(points, radius, color) {
    const T = this._three, g = new T.Group();
    if (points.length < 2) return g;
    const curve = new T.CatmullRomCurve3(points), n = Math.min(400, points.length * 3);
    g.add(new T.Mesh(new T.TubeGeometry(curve, n, radius * 1.7, 8), new T.MeshBasicMaterial({ color: 0x141414, side: T.BackSide })));
    g.add(new T.Mesh(new T.TubeGeometry(curve, n, radius, 8), new T.MeshBasicMaterial({ color })));
    return g;
  }
  rod(mesh, a, b) {
    const T = this._three, d = new T.Vector3().subVectors(b, a), len = d.length();
    mesh.position.copy(a).addScaledVector(d, 0.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    mesh.scale.set(1, Math.max(0.01, len), 1);
  }
  clear(g) {
    for (const o of [...g.children]) {
      g.remove(o);
      o.traverse((n) => { n.geometry?.dispose(); if (n.material) { n.material.map?.dispose(); n.material.dispose(); } });
    }
  }

  build(T) {
    this._three = T;
    const R = DOME_R, canvas = this.shadowRoot.querySelector("canvas");
    const renderer = (this._renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }));
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap;
    const scene = (this._scene = new T.Scene());
    this._camera = new T.PerspectiveCamera(36, 1, 1, 3000);
    this._hemi = new T.HemisphereLight(0xdfe6ff, 0x3b4a2e, 1);
    const light = (size) => {
      const l = new T.DirectionalLight(0xffffff, 0);
      l.castShadow = true; l.shadow.mapSize.set(size, size); l.shadow.bias = -0.0004; l.shadow.normalBias = 0.4;
      Object.assign(l.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 10, far: 700 });
      scene.add(l.target);
      return l;
    };
    this._sunLight = light(2048); this._moonLight = light(1024);
    scene.add(this._hemi, this._sunLight, this._moonLight);

    // The disc: the photo on top, a paper edge, a black rim.
    this._groundMat = new T.MeshLambertMaterial({ color: 0x6b7f2a });
    const ground = new T.Mesh(new T.CircleGeometry(R, 128), this._groundMat);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    const edge = new T.Mesh(new T.CylinderGeometry(R, R * 0.97, 9, 128, 1, true), new T.MeshBasicMaterial({ color: 0xf4f0e6 }));
    edge.position.y = -4.5;
    const rim = new T.Mesh(new T.RingGeometry(R - 0.2, R + 1.4, 128), new T.MeshBasicMaterial({ color: 0x141414 }));
    rim.rotation.x = -Math.PI / 2; rim.position.y = 0.06;
    scene.add(ground, edge, rim);
    this._skin = document.createElement("canvas"); this._skin.width = this._skin.height = 1024;
    const tex = (this._skinTex = new T.CanvasTexture(this._skin));
    tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    this._groundMat.map = tex; this._groundMat.color.set(0xffffff);
    this.photo().then((c) => { this._photo = c; this.washLot(); }).catch(() => {});

    // The glass: faint, with the 30° and 60° rings and a meridian every 30°, in paper.
    scene.add(new T.Mesh(new T.SphereGeometry(R, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2),
      new T.MeshBasicMaterial({ color: 0xbcd0ff, transparent: true, opacity: 0.07, side: T.DoubleSide, depthWrite: false })));
    const grid = new T.LineBasicMaterial({ color: 0xf4f0e6, transparent: true, opacity: 0.32 });
    for (const el of [30, 60]) {
      const pts = []; for (let a = 0; a <= 360; a += 3) pts.push(this.sky(a, el));
      scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), grid));
      const l = this.label(`${el}°`, 6.5); l.position.copy(this.sky(180, el + 2.5)); scene.add(l);
    }
    for (let a = 0; a < 360; a += 30) {
      const pts = []; for (let el = 0; el <= 90; el += 3) pts.push(this.sky(a, el));
      scene.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), grid));
    }
    for (const [a, t] of [[0, "N"], [90, "E"], [180, "S"], [270, "W"]]) {
      const l = this.label(t, 13, a === 0 ? "#F2B705" : "#F4F0E6"); l.position.copy(this.sky(a, 0, R + 15)).setY(4); scene.add(l);
    }
    // Stars, for when it is dark.
    const r = rng("stars"), stars = [];
    for (let i = 0; i < 320; i++) stars.push(this.sky(r() * 360, (Math.asin(r()) * 180) / Math.PI * 0.92 + 4, R * 0.99));
    this._stars = new T.Points(new T.BufferGeometry().setFromPoints(stars),
      new T.PointsMaterial({ color: 0xf4f0e6, size: 1.3, transparent: true, opacity: 0, depthWrite: false }));
    scene.add(this._stars);

    this._paths = new T.Group(); this._bldgs = new T.Group();
    scene.add(this._paths, this._bldgs);

    // The sun: a red paper disc with a black edge in a yellow haze, and a beam to the house.
    this._sun = new T.Group();
    this._sun.add(new T.Mesh(new T.SphereGeometry(5.6, 32, 16), new T.MeshBasicMaterial({ color: 0x141414, side: T.BackSide })));
    this._sun.add(new T.Mesh(new T.SphereGeometry(4.6, 32, 16), new T.MeshBasicMaterial({ color: 0xd7301f })));
    const haze = this.glow("rgba(242,183,5,.85)", 0.12); haze.scale.set(46, 46, 1); this._sun.add(haze);
    this._beam = new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 1, 8), new T.MeshBasicMaterial({ color: 0xd7301f, transparent: true, opacity: 0.85 }));
    this._bearing = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 1, 8), new T.MeshBasicMaterial({ color: 0xd7301f }));
    // The moon: its phase drawn on paper, always facing you, in a pale haze.
    this._moon = new T.Group();
    this._moonGlow = this.glow("rgba(220,228,255,.5)", 0.15); this._moonGlow.scale.set(30, 30, 1);
    this._moonDisc = new T.Sprite(new T.SpriteMaterial({ transparent: true, depthWrite: false })); this._moonDisc.scale.set(14, 14, 1);
    this._moon.add(this._moonGlow, this._moonDisc);
    scene.add(this._sun, this._beam, this._bearing, this._moon);

    this.shadowRoot.querySelector(".wait").remove();
    this.stand(); this.washLot();
    if (this.isConnected) this.observe();
  }

  // Esri's tiles at zoom 19 drawn onto one square canvas spanning the disc.
  async photo() {
    const { lat, lon } = this._d, rad = Math.PI / 180, z = 19, n = 2 ** z;
    const mpp = (156543.03392 * Math.cos(lat * rad)) / n, span = (2 * DOME_R) / mpp, C = 1024, s = C / span;
    const wx = ((lon + 180) / 360) * n * 256;
    const wy = ((1 - Math.log(Math.tan(lat * rad) + 1 / Math.cos(lat * rad)) / Math.PI) / 2) * n * 256;
    const c = document.createElement("canvas"); c.width = c.height = C;
    const x = c.getContext("2d");
    x.fillStyle = "#3B4A2E"; x.fillRect(0, 0, C, C);
    x.filter = "saturate(.8) contrast(1.08)";
    const jobs = [];
    for (let ty = Math.floor((wy - span / 2) / 256); ty <= Math.floor((wy + span / 2) / 256); ty++)
      for (let tx = Math.floor((wx - span / 2) / 256); tx <= Math.floor((wx + span / 2) / 256); tx++)
        jobs.push(new Promise((ok) => {
          const img = new Image(); img.crossOrigin = "anonymous";
          img.onload = () => { x.drawImage(img, (tx * 256 - wx) * s + C / 2, (ty * 256 - wy) * s + C / 2, 256 * s + 1, 256 * s + 1); ok(); };
          img.onerror = ok;
          img.src = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${ty}/${tx}`;
        }));
    await Promise.all(jobs);
    return c;
  }
  // The buildings, stood up 7 m; ours in yellow.
  stand() {
    const T = this._three;
    this.clear(this._bldgs);
    for (const w of this._d.buildings || []) {
      if (w.length < 3) continue;
      const pts = w.map((p) => this.local(p)), cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      if (Math.hypot(cx, cz) > DOME_R - 6) continue;
      const geo = new T.ExtrudeGeometry(new T.Shape(pts.map(([x, z]) => new T.Vector2(x, -z))), { depth: 7, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      const m = new T.Mesh(geo, new T.MeshLambertMaterial({ color: w === this._d.ours ? 0xf2b705 : 0xf4f0e6 }));
      m.castShadow = m.receiveShadow = true;
      m.add(new T.LineSegments(new T.EdgesGeometry(geo, 20), new T.LineBasicMaterial({ color: 0x141414 })));
      this._bldgs.add(m);
    }
    this.frame();
  }
  // The ground's skin: the photo, with the lot washed in and cut round with a dashed line,
  // painted on the texture so the disc's edge clips it.
  washLot() {
    const x = this._skin.getContext("2d"), C = this._skin.width, k = C / (2 * DOME_R), ring = this._d.lot || [];
    x.fillStyle = "#3B4A2E"; x.fillRect(0, 0, C, C);
    if (this._photo) x.drawImage(this._photo, 0, 0);
    if (ring.length > 2) {
      x.beginPath();
      ring.forEach((p, i) => { const [px, pz] = this.local(p); x[i ? "lineTo" : "moveTo"](C / 2 + px * k, C / 2 + pz * k); });
      x.closePath(); x.lineJoin = "round";
      x.fillStyle = "rgba(242,183,5,.16)"; x.fill();
      x.lineWidth = 10; x.strokeStyle = "#141414"; x.setLineDash([]); x.stroke();
      x.lineWidth = 5; x.strokeStyle = "#F4F0E6"; x.setLineDash([18, 12]); x.stroke(); x.setLineDash([]);
    }
    this._skinTex.needsUpdate = true;
    this.frame();
  }
  // Today's paths, midnight to midnight: the sun in yellow with hour beads, the moon in paper.
  trace(day) {
    const T = this._three, { lat, lon } = this._d;
    this.clear(this._paths);
    this._high = { el: -90 };
    for (const [fn, colour, r] of [[sunPosition, 0xf2b705, 0.8], [moonPosition, 0xc9d3ee, 0.45]]) {
      let run = [];
      const flush = () => { if (run.length > 1) this._paths.add(this.tube(run, r, colour)); run = []; };
      for (let t = day; t <= day + 86400000; t += 300000) {
        const p = fn(t, lat, lon);
        if (fn === sunPosition && p.el > this._high.el) this._high = { t, el: p.el };
        if (p.el > -0.5) run.push(this.sky(p.az, Math.max(0, p.el))); else flush();
        if (fn === sunPosition && p.el > 0 && new Date(t).getMinutes() === 0) {
          const bead = new T.Mesh(new T.SphereGeometry(1.5, 12, 8), new T.MeshBasicMaterial({ color: 0x141414 }));
          bead.position.copy(this.sky(p.az, p.el)); this._paths.add(bead);
          const h = new Date(t).getHours();
          if (h % 3 === 0) { const l = this.label(pad(h), 7.5); l.position.copy(this.sky(p.az, p.el + 6)); this._paths.add(l); }
        }
      }
      flush();
    }
    this._day = day;
  }
  phase(m) {
    const key = `${Math.round(m.lit * 50)}${m.waxing}`;
    if (key === this._phaseKey) return;
    this._phaseKey = key;
    const T = this._three, c = document.createElement("canvas"), x = c.getContext("2d"), r = 54;
    c.width = c.height = 128;
    x.translate(64, 64);
    if (!m.waxing) x.scale(-1, 1);
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fillStyle = "#2A3350"; x.fill();
    // Lit on the right while waxing: the right half, then the terminator back up.
    const k = r * Math.abs(1 - 2 * m.lit);
    x.beginPath(); x.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    x.ellipse(0, 0, k, r, 0, Math.PI / 2, -Math.PI / 2, m.lit < 0.5);
    x.fillStyle = "#F4F0E6"; x.fill();
    x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.lineWidth = 7; x.strokeStyle = "#141414"; x.stroke();
    const old = this._moonDisc.material.map;
    this._moonDisc.material.map = new T.CanvasTexture(c); this._moonDisc.material.map.colorSpace = T.SRGBColorSpace;
    this._moonDisc.material.needsUpdate = true; old?.dispose();
  }

  // Move the sun, the moon and the light to the chosen time, and say where they are.
  paint() {
    if (!this._three || !this._d) return;
    const T = this._three, { lat, lon } = this._d, day = new Date(); day.setHours(0, 0, 0, 0);
    const t = this._t == null ? Date.now() : day.getTime() + this._t * 60000;
    if (this._day !== day.getTime()) this.trace(day.getTime());
    this._range.value = String(this._t ?? Math.floor((Date.now() - day.getTime()) / 300000) * 5);
    this.shadowRoot.querySelector(".now").setAttribute("aria-pressed", String(this._t == null));
    const s = sunPosition(t, lat, lon), m = moonPosition(t, lat, lon), rad = Math.PI / 180;
    // How much day there is: 0 at night (sun 8° down) to 1 by the time it is 6° up.
    const day1 = Math.max(0, Math.min(1, (s.el + 8) / 14));
    const sunUp = s.el > -0.833, moonUp = m.el > -0.5;
    this._sun.visible = this._beam.visible = this._bearing.visible = sunUp;
    if (sunUp) {
      const at = this.sky(s.az, Math.max(0, s.el));
      this._sun.position.copy(at);
      this.rod(this._beam, new T.Vector3(0, 7, 0), at);
      this.rod(this._bearing, new T.Vector3(0, 0.5, 0), this.sky(s.az, 0, DOME_R - 1).setY(0.5));
    }
    const low = Math.max(0, Math.min(1, s.el / 25));
    this._sunLight.position.copy(this.sky(s.az, Math.max(s.el, 1), 320));
    this._sunLight.intensity = s.el > 0 ? 1.2 + 3 * Math.min(1, Math.sin(s.el * rad) * 2.5) : 0;
    this._sunLight.color.setRGB(1, 0.72 + 0.26 * low, 0.5 + 0.42 * low);
    this._moon.visible = moonUp;
    if (moonUp) { this._moon.position.copy(this.sky(m.az, Math.max(0, m.el))); this.phase(m); }
    this._moonLight.position.copy(this.sky(m.az, Math.max(m.el, 1), 320));
    this._moonLight.intensity = moonUp && m.el > 0 ? (1 - day1) * 1.1 * m.lit : 0;
    this._moonLight.color.setRGB(0.7, 0.78, 1);
    this._hemi.intensity = 0.22 + 0.3 * day1;
    this._hemi.color.setRGB(0.6 + 0.27 * day1, 0.66 + 0.24 * day1, 1);
    this._stars.material.opacity = (1 - day1) * 0.9;
    const mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * day1));
    const top = mix([8, 14, 40], [31, 61, 140]), bottom = mix([22, 36, 92], [126, 157, 222]);
    this._stage.style.background = `linear-gradient(rgb(${top}), rgb(${bottom}))`;
    const sr = this.shadowRoot;
    sr.querySelector(".clock").textContent = hhmm(t);
    sr.querySelector(".where").textContent = sunUp ? `sun ${Math.round(Math.max(0, s.el))}° up, ${point(s.az)}` : moonUp ? `moon ${Math.round(Math.max(0, m.el))}° up, ${point(m.az)}` : "sun and moon down";
    const fig = (k, v) => { sr.querySelector(`[data-f="${k}"]`).textContent = v; }, shadow = s.el > 0.5 ? 1 / Math.tan(s.el * rad) : null;
    fig("bearing", sunUp ? `${Math.round(s.az)}° ${point(s.az)}` : "–");
    fig("height", sunUp ? `${Math.round(Math.max(0, s.el))}°` : "Below");
    fig("high", `${Math.round(this._high.el)}° at ${hhmm(this._high.t)}`);
    fig("shadow", shadow == null ? "–" : shadow > 9.5 ? "very long" : `${shadow.toFixed(1)}× height`);
    const when = this._t == null ? "Now" : `At ${hhmm(t)}`;
    const said = `${when} the sun is ${sunUp ? `${pointSaid(s.az)} of the house, ${Math.round(Math.max(0, s.el))}° up` : "down"}; the moon is ${moonSaid(m)}, ${Math.round(m.lit * 100)}% lit, ${moonUp ? `${Math.round(Math.max(0, m.el))}° up in the ${pointSaid(m.az)}` : "below the horizon"}.`;
    sr.querySelector(".said").textContent = said;
    this._stage.setAttribute("aria-label", `${said} Drag to turn the view; the slider moves the time through today.`);
    this.frame();
  }
  draw() {
    const T = this._three, c = this._camera, rad = Math.PI / 180, p = this._pitch * rad, y = this._yaw * rad;
    const target = new T.Vector3(0, 16, 0);
    c.position.set(target.x + this._dist * Math.cos(p) * Math.sin(y), target.y + this._dist * Math.sin(p), target.z - this._dist * Math.cos(p) * Math.cos(y));
    c.lookAt(target);
    this._renderer.render(this._scene, c);
  }
}
if (!customElements.get("collage-sun-dome")) customElements.define("collage-sun-dome", CollageSunDome);

class CollageSunCard extends CollageCard {
  validate(c) { return { rails: [], ...c }; }
  watch() { const c = this._config; return ["sun.sun", ...c.rails.map((r) => r.entity), c.lights, c.status].filter(Boolean); }
  getCardSize() { return this._config.map ? 12 : 6; }
  getGridOptions() { return { columns: 12, rows: "auto" }; }

  // ----- the shade controller -----
  // Each rail has a target the user can change at any time. The controller sends targets in
  // the order they were set, never waits for a motor to finish, and holds back only a move
  // that could run one rail into the other, sending it once the other rail reports clear.
  connectedCallback() {
    super.connectedCallback();
    this._want = this._want || {}; this._sent = this._sent || {}; this._since = this._since || {};
    this._tries = this._tries || {}; this._held = this._held || {};
    clearInterval(this._tick);
    this._tick = setInterval(() => { if (Object.keys(this._want).length) { this.reconcile(); if (this._busy) this._deferred = true; else this.update(); } }, 3000);
  }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this._tick); }

  railMap() {
    const rails = this._config.rails.map((r) => ({ ...r, s: this.st(r.entity) })).filter((r) => r.s)
      .map((r) => ({ ...r, name: r.name || r.s.attributes.friendly_name || (r.from_top ? "Top rail" : "Bottom rail") }));
    return { top: rails.find((r) => r.from_top), bottom: rails.find((r) => !r.from_top), list: rails };
  }
  pos(r) { return r.s.attributes.current_position ?? (r.s.state === "open" ? 100 : 0); }
  keyOf(r) { return r.from_top ? "top" : "bottom"; }
  // Where a rail may physically be: between its last report and the target it was sent.
  extent(key, r) {
    const p = this.pos(r), t = this._sent[key];
    return t == null ? [p, p] : [Math.min(p, t), Math.max(p, t)];
  }
  // A new target for one rail, kept on its side of the other rail's target.
  aim(key, value) {
    const m = this.railMap(), other = key === "top" ? m.bottom : m.top;
    let v = Math.max(0, Math.min(100, Math.round(value)));
    if (other) {
      const o = this._want[this.keyOf(other)] ?? this.pos(other);
      v = key === "top" ? Math.max(v, o) : Math.min(v, o);
    }
    this._want[key] = v; this._since[key] = Date.now(); this._tries[key] = 0;
    if (this._sentAt) this._sentAt[key] = null;
    if (this._sent[key] === v) this._sent[key] = null;
    this.reconcile();
    this.update();
  }
  stop(key, r) {
    delete this._want[key]; delete this._sent[key]; delete this._held[key]; if (this._sentAt) delete this._sentAt[key];
    this.run("cover", "stop_cover", { entity_id: r.entity }, "The shade didn't answer.").catch(() => {});
    this.update();
  }
  reconcile() {
    const m = this.railMap();
    for (const key of ["top", "bottom"]) {
      const r = m[key], w = this._want[key];
      if (!r || w == null) continue;
      if (this.pos(r) === w) { delete this._want[key]; delete this._sent[key]; delete this._held[key]; if (this._sentAt) delete this._sentAt[key]; continue; }
      // Slow motors: six minutes from the send to arrive; a held move waits up to ten for the other rail.
      const late = this._sentAt?.[key] ? Date.now() - this._sentAt[key] > 360000 : Date.now() - this._since[key] > 600000;
      if (late) {
        this.notice(`The ${r.name.toLowerCase()} didn't reach ${w}%. The shade may be out of range or need charging.`);
        delete this._want[key]; delete this._sent[key]; delete this._held[key]; if (this._sentAt) delete this._sentAt[key];
        continue;
      }
      if (this._sent[key] === w) continue;
      const other = key === "top" ? m.bottom : m.top;
      if (other) {
        const [lo, hi] = this.extent(this.keyOf(other), other);
        if (key === "top" ? w < hi : w > lo) { this._held[key] = true; continue; }
      }
      this._held[key] = false;
      this._sent[key] = w;
      (this._sentAt = this._sentAt || {})[key] = Date.now();
      this.send(key, r, w);
    }
  }
  async send(key, r, w) {
    await this.wake();
    try {
      await this._hass.callService("cover", "set_cover_position", { entity_id: r.entity, position: w });
    } catch (err) {
      if (this._want[key] !== w) return;
      this._sent[key] = null;
      this._tries[key] = (this._tries[key] || 0) + 1;
      if (this._tries[key] >= 3) {
        this.notice(`The shade didn't answer after three tries (${err && err.message ? err.message.replace(/^.*zwave_error: /, "") : "no reply"}).`);
        delete this._want[key];
      }
      this.update();
    }
  }
  // The shade's radio sleeps or drops out. Ping it first when it is not alive, then wait for it.
  async wake() {
    const c = this._config;
    const alive = () => !c.status || ["alive", "awake"].includes(this.st(c.status)?.state);
    if (alive() || !c.ping) return;
    if (!this._waking) {
      this._waking = this._hass.callService("button", "press", { entity_id: c.ping }).catch(() => {})
        .then(async () => { for (let i = 0; i < 16 && !alive(); i++) await new Promise((res) => setTimeout(res, 500)); })
        .finally(() => { this._waking = null; });
    }
    await this._waking;
  }

  update() {
    const c = this._config, sun = this.st("sun.sun");
    if (!sun) { this.shadowRoot.innerHTML = `<style>${MATERIAL}</style><div class="paper" style="padding:14px">The sun card needs the Sun integration (sun.sun).</div>`; return; }
    if (!this._want) this.connectedCallback();
    if (Object.keys(this._want).length) this.reconcile();
    const focusKey = this.shadowRoot.activeElement?.dataset?.focus;
    const up = sun.state === "above_horizon";
    const rise = new Date(sun.attributes.next_rising), set = new Date(sun.attributes.next_setting);
    // Today's rise and set: the next ones, pulled back a day when they have passed.
    const todayRise = up ? new Date(rise.getTime() - 86400000) : rise;
    const todaySet = set;
    const now = Date.now();
    const f = Math.min(1, Math.max(0, (now - todayRise) / (todaySet - todayRise)));
    const W = 300, R = 120, cx = 150, cy = 136;
    const ang = Math.PI * (1 - f);
    const sx = cx + R * Math.cos(ang), sy = cy - R * Math.sin(ang);
    const lights = c.lights && this.st(c.lights);
    const m = this.railMap(), rails = m.list;
    const status = c.status && this.st(c.status)?.state;
    const responding = !status || ["alive", "awake"].includes(status);
    const na = (r) => ["unavailable", "unknown"].includes(r.s.state);
    const where = (p) => (p >= 100 ? "up" : p <= 0 ? "down" : `${p}% up`);
    const line = (r) => {
      const key = this.keyOf(r), w = this._want[key];
      if (na(r)) return "unavailable";
      if (w != null) return this._held[key] ? `waiting for the ${key === "top" ? "bottom" : "top"} rail` : `moving ${w >= 100 ? "up" : w <= 0 ? "down" : `to ${w}%`}`;
      return where(this.pos(r));
    };
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .card { background: var(--hc-cobalt, #1F3D8C); color: var(--hc-paper, #F4F0E6); padding: 14px; transform: rotate(.4deg); }
        h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
        .times { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-top: 4px; }
        .times b { font-size: 20px; display: block; letter-spacing: -.02em; }
        svg.arc { display: block; width: 100%; max-width: 380px; margin: 4px auto 0; overflow: visible; }
        .elev { text-align: center; font-size: 13px; font-weight: 600; margin-top: 6px; }
        .elev b { font-size: 22px; letter-spacing: -.02em; }
        .shade { display: grid; grid-template-columns: 150px 1fr; gap: 14px; margin-top: 14px; padding: 12px;
          background: var(--hc-paper, #F4F0E6); color: var(--hc-black, #141414); transform: rotate(-.5deg); }
        .shade h3 { margin: 0 0 8px; font-size: 18px; font-weight: 700; letter-spacing: -.01em; }
        .health { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
        .health.bad { color: var(--hc-red, #D7301F); }
        .health button { margin-left: 6px; padding: 4px 8px; min-height: 30px; background: var(--hc-red, #D7301F); color: var(--hc-paper, #F4F0E6); font-size: 12px; font-weight: 700; }
        .rail + .rail { margin-top: 10px; }
        .rail .st { font-size: 13px; font-weight: 600; min-height: 2.5em; }
        .btns { display: grid; grid-template-columns: repeat(3, 44px); gap: 6px; margin-top: 3px; }
        .btns button { display: grid; place-items: center; height: 44px; background: var(--hc-black, #141414);
          color: var(--hc-paper, #F4F0E6); --mdc-icon-size: 22px; }
        .btns button:disabled { background: #B9B3A5; cursor: default; }
        .win { touch-action: none; user-select: none; }
        .handle { cursor: ns-resize; }
        .handle:focus-visible { outline: none; }
        .handle:focus-visible rect.bar { stroke: var(--hc-yellow, #F2B705); stroke-width: 3; }
        .hint { font-size: 11px; font-weight: 600; margin-top: 6px; color: #4A4740; }
        .yard { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding: 12px;
          background: var(--hc-olive, #6B7F2A); color: var(--hc-paper, #F4F0E6); transform: rotate(-.6deg); }
        .yard b { font-size: 18px; } .yard span { font-size: 13px; font-weight: 600; }
        .yard.on { background: var(--hc-yellow, #F2B705); color: var(--hc-black, #141414); }
      </style>
      ${scatter("sun", 7)}
      <div class="paper card" style="container-type: inline-size">
        <h2>${esc(c.name || (rails.length ? "Sun and shade" : "The sun"))}</h2>
        <div class="times num"><span>Sunrise<b>${hhmm(todayRise)}</b></span><span style="text-align:right">Sunset<b>${hhmm(todaySet)}</b></span></div>
        ${c.map && this._hass.config.latitude != null ? "" : `<svg class="arc" viewBox="0 0 ${W} 146" role="img" aria-label="The sun is ${up ? `up, ${Math.round(sun.attributes.elevation)} degrees` : "down"}">
          <path d="M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy} Z" fill="#34509E"/>
          ${up ? `<path d="M${cx - R},${cy} A${R},${R} 0 0 1 ${sx.toFixed(1)},${sy.toFixed(1)} L${cx},${cy} Z" fill="var(--hc-yellow,#F2B705)"/>` : ""}
          <rect x="${cx - R - 16}" y="${cy}" width="${2 * R + 32}" height="7" fill="var(--hc-black,#141414)"/>
          <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="16" fill="${up ? "var(--hc-red,#D7301F)" : "var(--hc-paper,#F4F0E6)"}" stroke="var(--hc-black,#141414)" stroke-width="2"/>
        </svg>
        <div class="elev num">${up ? `<b>${Math.round(sun.attributes.elevation)}°</b> above the horizon` : "<b>Night</b>"}</div>`}
        ${c.map && this.neighbourhood() ? `<div id="dome"></div>` : ""}
        ${rails.length ? `<div class="shade">
          <div><div id="win"></div><div class="hint">Drag a rail to move it.</div></div>
          <div><h3>${esc(c.shade_name || "Shade")}</h3>
            ${responding ? "" : `<div class="health bad">Not answering${c.ping ? `<button class="wake" data-focus="wake">Wake it</button>` : ""}</div>`}
            ${rails.map((r, i) => `<div class="rail"><div class="st"><b>${esc(r.name)}</b> · ${line(r)}</div>
            <div class="btns"><button data-i="${i}" data-s="up" data-focus="u${i}" aria-label="Raise the ${esc(r.name)}" ${na(r) ? "disabled" : ""}>${icon("arrow-up")}</button><button data-i="${i}" data-s="stop" data-focus="s${i}" aria-label="Stop the ${esc(r.name)}" ${na(r) ? "disabled" : ""}>${icon("stop")}</button><button data-i="${i}" data-s="down" data-focus="d${i}" aria-label="Lower the ${esc(r.name)}" ${na(r) ? "disabled" : ""}>${icon("arrow-down")}</button></div></div>`).join("")}
          </div>
        </div>` : ""}
        ${lights ? `<div class="paper yard press ${lights.state === "on" ? "on" : ""}" role="button" tabindex="0" data-focus="yard" aria-label="${esc(c.lights_name || lights.attributes.friendly_name)}, ${lights.state}. Tap to turn ${lights.state === "on" ? "off" : "on"}.">
          <b>${esc(c.lights_name || lights.attributes.friendly_name)}</b><span>${lights.state === "on" ? "On" : "Off"} · ${ago(new Date(lights.last_changed))}</span></div>` : ""}
      </div>`;
    const sr = this.shadowRoot;
    sr.querySelectorAll(".btns button").forEach((b) => b.addEventListener("click", () => {
      const r = rails[Number(b.dataset.i)], key = this.keyOf(r);
      if (b.dataset.s === "stop") this.stop(key, r);
      else this.aim(key, b.dataset.s === "up" ? 100 : 0);
    }));
    sr.querySelector(".wake")?.addEventListener("click", () =>
      this.run("button", "press", { entity_id: c.ping }, "The shade still isn't answering.").catch(() => {}));
    const yard = sr.querySelector(".yard");
    if (yard) pressable(yard, { tap: () => this.run("homeassistant", "toggle", { entity_id: c.lights }, `${c.lights_name || lights.attributes.friendly_name} didn't answer.`).catch(() => {}), hold: () => this.moreInfo(c.lights) });
    if (rails.length) this.drawWindow();
    const slot = sr.getElementById("dome");
    if (slot) {
      if (!this._dome) {
        this._dome = document.createElement("collage-sun-dome");
        this._dome.onBusy = (b) => (b ? (this._busy = true) : this.release());
      }
      slot.replaceWith(this._dome);
      this._dome.show({ lat: this._hass.config.latitude, lon: this._hass.config.longitude, buildings: this._buildings, lot: this._lot, ours: this._ours });
    }
    if (focusKey) sr.querySelector(`[data-focus="${focusKey}"]`)?.focus();
  }

  // The neighbourhood for the dome: building footprints, fetched once, the lot's outline if the
  // card is given one (map: lot: [[lat, lon], ...]), and which building is ours (the one the
  // home point falls in, or the nearest within 25 m).
  neighbourhood() {
    const { latitude: lat, longitude: lon } = this._hass.config;
    if (lat == null || lon == null) return false;
    const m = typeof this._config.map === "object" ? this._config.map : {};
    if (m.buildings !== false && !this._buildingsAsked) {
      this._buildingsAsked = true;
      buildingsNear(lat, lon).then((w) => { this._buildings = w.filter((x) => x.length > 2); this.update(); }).catch(() => {});
    }
    if (Array.isArray(m.lot) && m.lot !== this._lotFrom) { this._lotFrom = m.lot; this._lot = m.lot.filter((p) => Array.isArray(p) && p.length === 2).map(([a, b]) => [Number(a), Number(b)]); }
    const ways = this._buildings || [];
    if (ways !== this._oursOf) {
      this._oursOf = ways;
      const far = (w) => Math.min(...w.map(([la, lo]) => Math.hypot((lo - lon) * 111320 * Math.cos((lat * Math.PI) / 180), (la - lat) * 110574)));
      this._ours = ways.find((w) => inside([lat, lon], w)) || ways.filter((w) => far(w) < 25).sort((a, b) => far(a) - far(b))[0];
    }
    return true;
  }

  // The window: the fabric hangs between the rails where they really are (solid), and a rail's
  // target, while it has one, is a dashed ghost. Dragging a rail moves its target.
  drawWindow() {
    const host = this.shadowRoot.getElementById("win");
    if (!host) return;
    const m = this.railMap();
    const WW = 150, WH = 200, pad = 12, span = WH - 2 * pad;
    const yFor = (p) => pad + (1 - p / 100) * span;
    const pFor = (yy) => Math.round(Math.max(0, Math.min(100, (1 - (yy - pad) / span) * 100)));
    const drag = this._drag;
    const target = (key) => (drag && drag.key === key ? drag.value : this._want[key]);
    let yT = m.top ? yFor(this.pos(m.top)) : pad, yB = m.bottom ? yFor(this.pos(m.bottom)) : WH - pad;
    if (yT > yB) [yT, yB] = [yB, yT];
    const pleats = [];
    for (let py = yT + 9; py < yB - 3; py += 10) pleats.push(`<rect x="10" y="${py.toFixed(1)}" width="${WW - 20}" height="1.5" fill="#B9481A"/>`);
    const tag = (yy, text, right, up) => `
      <rect x="${right ? WW - 56 : 4}" y="${(up ? yy - 19 : yy + 4).toFixed(1)}" width="52" height="15" fill="var(--hc-black,#141414)"/>
      <text x="${right ? WW - 30 : 30}" y="${(up ? yy - 8 : yy + 15).toFixed(1)}" text-anchor="middle"
        style="font:700 10px var(--hc-display,sans-serif);fill:var(--hc-paper,#F4F0E6);letter-spacing:.04em">${text}</text>`;
    const rail = (key, r, yy) => {
      if (!r) return "";
      const t = target(key), ty = t != null ? yFor(t) : null;
      const label = key === "top" ? "TOP" : "BOTTOM", right = key === "top";
      return `
      <g class="handle nopress" data-rail="${key}" tabindex="0" role="slider" aria-label="${esc(r.name)} target"
         aria-valuemin="0" aria-valuemax="100" aria-valuenow="${t ?? this.pos(r)}">
        <rect x="0" y="${((ty ?? yy) - 13).toFixed(1)}" width="${WW}" height="26" fill="transparent"/>
        ${ty != null ? `<rect x="5" y="${(ty - 4).toFixed(1)}" width="${WW - 10}" height="8" fill="none" stroke="var(--hc-yellow,#F2B705)" stroke-width="2.5" stroke-dasharray="6 4"/>
          ${tag(ty, `→ ${t}%`, right, key === "top" ? ty > WH - 30 : ty > 30)}` : ""}
        <rect class="bar" x="4" y="${(yy - 4).toFixed(1)}" width="${WW - 8}" height="8" fill="var(--hc-black,#141414)"/>
        ${ty == null ? tag(yy, label, right, key === "top" ? yy > 30 : yy > WH - 30) : ""}
      </g>`;
    };
    host.innerHTML = `
      <svg class="win nopress" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}" role="group"
        aria-label="${esc(this._config.shade_name || "Shade")} in its window: the fabric hangs between the top rail and the bottom rail">
        <rect x="2" y="2" width="${WW - 4}" height="${WH - 4}" fill="#26335C" stroke="var(--hc-black,#141414)" stroke-width="4"/>
        <rect x="${WW / 2 - 1}" y="2" width="2" height="${WH - 4}" fill="var(--hc-black,#141414)"/>
        ${yB - yT > 2 ? `<rect x="6" y="${yT.toFixed(1)}" width="${WW - 12}" height="${(yB - yT).toFixed(1)}" fill="var(--hc-orange,#E8632B)"/>${pleats.join("")}`
          : `<rect x="6" y="${(yT - 6).toFixed(1)}" width="${WW - 12}" height="12" fill="var(--hc-orange,#E8632B)"/>`}
        ${rail("top", m.top, m.top ? yFor(this.pos(m.top)) : 0)}
        ${rail("bottom", m.bottom, m.bottom ? yFor(this.pos(m.bottom)) : 0)}
      </svg>`;
    host.querySelectorAll(".handle").forEach((g) => g.addEventListener("keydown", (e) => {
      const step = { ArrowUp: 10, ArrowDown: -10 }[e.key], key = g.dataset.rail, r = m[key];
      if (step == null || !r) return;
      e.preventDefault();
      this.aim(key, (this._want[key] ?? this.pos(r)) + step);
      this.shadowRoot.querySelector(`.handle[data-rail="${key}"]`)?.focus();
    }));
    if (host._wired) return;
    // Pointer capture lives on the container, which survives every redraw of the window.
    host._wired = true;
    const toY = (e) => { const r = host.querySelector("svg").getBoundingClientRect(); return ((e.clientY - r.top) / r.height) * WH; };
    const bound = (key, v) => {
      const mm = this.railMap(), other = key === "top" ? mm.bottom : mm.top;
      if (!other) return v;
      const o = this._want[this.keyOf(other)] ?? this.pos(other);
      return key === "top" ? Math.max(v, o) : Math.min(v, o);
    };
    host.addEventListener("pointerdown", (e) => {
      const g = e.target.closest && e.target.closest(".handle");
      if (!g) return;
      const key = g.dataset.rail, r = this.railMap()[key];
      if (!r || ["unavailable", "unknown"].includes(r.s.state)) return;
      e.stopPropagation(); e.preventDefault();
      host.setPointerCapture(e.pointerId);
      this._busy = true;
      this._drag = { key, value: bound(key, pFor(toY(e))) };
      this.drawWindow();
    });
    host.addEventListener("pointermove", (e) => {
      if (!this._drag || !host.hasPointerCapture(e.pointerId)) return;
      this._drag.value = bound(this._drag.key, pFor(toY(e)));
      this.drawWindow();
    });
    const done = (e) => {
      if (!this._drag || !host.hasPointerCapture(e.pointerId)) return;
      host.releasePointerCapture(e.pointerId);
      const { key, value } = this._drag;
      this._drag = null;
      this._busy = false;
      this.aim(key, value);
    };
    host.addEventListener("pointerup", done);
    host.addEventListener("pointercancel", () => { if (!this._drag) return; this._drag = null; this.release(); this.drawWindow(); });
  }
}

// ---------- upkeep: batteries, devices not answering, the host, backups ----------

class CollageUpkeepCard extends CollageCard {
  validate(c) { return { name: "Upkeep", ...c, batteries: [].concat(c.batteries || []), offline: [].concat(c.offline || []) }; }
  watch() { const c = this._config; return [...c.batteries, ...c.offline, c.cpu, c.memory, c.backup].filter(Boolean); }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  // Every backup and where it is kept, from the backup integration (admins only),
  // asked again after five minutes; a manual backup changes no entity to tell us.
  loadBackups() {
    if (this._backupsAt && Date.now() - this._backupsAt < 5 * 60000) return;
    this._backupsAt = Date.now();
    this._hass.callWS({ type: "backup/info" })
      .then((r) => { this._backups = r.backups; this.update(false); })
      .catch(() => { this._backups = null; });
  }
  update() {
    const c = this._config;
    this.loadBackups();
    const focusKey = this.shadowRoot.activeElement?.dataset?.focus;
    const bats = c.batteries.map((id) => ({ id, s: this.st(id) })).filter((b) => b.s)
      .map((b) => ({ ...b, v: Number(b.s.state), name: (c.names || {})[b.id] || (b.s.attributes.friendly_name || b.id).replace(/ battery( level)?$/i, "") }))
      .sort((a, b) => (isNaN(a.v) ? -1 : isNaN(b.v) ? 1 : a.v - b.v));
    const offline = c.offline.filter((id) => ["unavailable", "unknown"].includes(this.st(id)?.state)).map((id) => (c.names || {})[id] || this.st(id)?.attributes.friendly_name || id);
    const cpu = this.st(c.cpu), mem = this.st(c.memory), backup = this.st(c.backup);
    const backupAge = backup && !isNaN(new Date(backup.state)) ? Date.now() - new Date(backup.state) : null;
    // The newest automatic and manual backups, and where each is kept: "Local, NAS" (rename with locations).
    const newest = (auto) => (this._backups || []).filter((b) => (b.with_automatic_settings === true) === auto)
      .reduce((a, b) => (!a || new Date(b.date) > new Date(a.date) ? b : a), null);
    const where = (b) => b ? ` · ${Object.keys(b.agents || {}).map((id) => esc((c.locations || {})[id] || said(id.replace(/^.*\./, "")))).join(", ")}` : "";
    const auto = newest(true), manual = newest(false);
    // A battery as cut paper: a thick ink outline and a nub, holding four hand-cut cells,
    // as many filled as quarters of charge. No number: the cells say enough.
    const battery = (b) => batteryArt(b.id, b.v);
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}${BATTERY}
        .card { padding: 14px; transform: rotate(.3deg); background: var(--hc-paper, #F4F0E6); }
        h2 { margin: 0 0 12px; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
        h3 { margin: 0 0 2px; font-size: 12px; font-weight: 600; letter-spacing: .04em; color: #4A4740; }
        .bats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; margin-top: 4px; }
        .bat { display: flex; flex-direction: column; align-items: stretch; gap: 10px; min-height: 44px; padding: 14px 10px 10px;
          background: none; text-align: left; }
        .bat:hover { background: #ECE6D8; }
        .bat:active { background: #DDD6C6; }
        .bat .name { display: flex; align-items: center; justify-content: space-between; gap: 4px; font-size: 16px; font-weight: 700; letter-spacing: -.01em; line-height: 1.1; }
        .bat .name ha-icon { flex: none; --mdc-icon-size: 18px; color: #4A4740; }
        .bat .note { display: block; margin-top: -6px; font-size: 13px; font-weight: 600; }
        .bat.low .note { color: var(--hc-red, #D7301F); }
        .bat.na { color: #8C877C; }
        .sys { margin-top: 16px; }
        .row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
        .chip { padding: 8px 10px; font-size: 13px; font-weight: 600; background: var(--hc-black, #141414); color: var(--hc-paper, #F4F0E6); }
        .chip b { font-size: 18px; display: block; letter-spacing: -.02em; }
        .chip.warn { background: var(--hc-pink, #E9A3B8); color: var(--hc-black, #141414); }
      </style>
      ${scatter("upkeep", 7)}
      <div class="paper card">
        <h2>${esc(c.name)}</h2>
        ${bats.length ? `<h3>Batteries</h3>
        <div class="bats">${bats.map((b) => `<button class="bat ${isNaN(b.v) ? "na" : level(b.v)}" data-id="${b.id}" data-focus="b-${b.id}"
          aria-label="${esc(b.name)} battery, ${isNaN(b.v) ? "no signal" : `${Math.round(b.v)} percent`}. Open details.">
          ${battery(b)}<span class="name">${esc(b.name)}${icon("chevron-right")}</span>${isNaN(b.v) ? `<span class="note">No signal</span>` : b.v < 30 ? `<span class="note">Low</span>` : ""}</button>`).join("")}</div>` : ""}
        <div class="sys"><h3>Home Assistant</h3>
        <div class="row num">
          ${offline.length ? `<div class="chip warn"><b>${offline.length === 1 ? esc(offline[0]) : `${offline.length} devices`}</b>${offline.length === 1 ? "not answering" : `not answering: ${esc(offline.join(", "))}`}</div>` : `<div class="chip"><b>All devices</b>answering</div>`}
          ${cpu ? `<div class="chip"><b>${Math.round(cpu.state)}%</b>${c.host ? `${esc(c.host)} CPU` : "CPU"}</div>` : ""}
          ${mem ? `<div class="chip"><b>${Math.round(mem.state)}%</b>${c.host ? `${esc(c.host)} memory` : "Memory"}</div>` : ""}
          ${backupAge != null ? `<div class="chip ${backupAge > 3 * 86400000 ? "warn" : ""}"><b>${ago(Date.now() - backupAge)}</b>last auto backup${where(auto)}</div>` : ""}
          ${manual ? `<div class="chip"><b>${ago(new Date(manual.date))}</b>last manual backup${where(manual)}</div>` : ""}
        </div></div>
      </div>`;
    this.shadowRoot.querySelectorAll(".bat").forEach((el) => el.addEventListener("click", () => this.moreInfo(el.dataset.id)));
    if (focusKey) this.shadowRoot.querySelector(`[data-focus="${focusKey}"]`)?.focus();
  }
}

// ---------- toothbrush: each time it ran, cut out and pinned to the day ----------

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Durations to the second, for things that run for a minute or two.
function brief(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  if (s >= 3600) return duration(ms);
  const m = Math.floor(s / 60), r = s % 60;
  return r ? `${m} m ${r} s` : `${m} m`;
}
const clock = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;

// Its own words for a reading: "daily_clean" becomes "Daily clean".
const said = (v) => String(v).replace(/_/g, " ").replace(/^./, (x) => x.toUpperCase());

class CollageBrushCard extends CollageCard {
  validate(c) {
    if (!c.entity) throw new Error("collage-brush-card needs an entity");
    // The Oral-B integration names its sensors after the brush; any can be overridden.
    const e = c.entity;
    return { color: "pink", form: 3, form_color: "cobalt", tilt: -0.7,
      duration: `${e}_duration`, mode: `${e}_brushing_mode`, pressure: `${e}_pressure`, sector: `${e}_sector`,
      sectors: `${e}_number_of_sectors`, battery: `${e}_battery`, ...c };
  }
  watch() { const c = this._config; return [c.entity, c.duration, c.mode, c.pressure, c.sector, c.sectors, c.battery]; }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  // The brush counts in a mode called "running"; every other state is off.
  isOn(state) { return state === "running"; }

  update(reloadHistory) {
    const c = this._config, s = this.st(c.entity);
    if (!s) { this.shadowRoot.innerHTML = `<style>${MATERIAL}</style><div class="paper">${esc(c.name || c.entity)} is not found</div>`; return; }
    const reading = (id) => this.st(id)?.state;
    const secs = Number(reading(c.duration));
    // While it runs the timer ticks every second: change only the figure, not the card.
    const sig = [s.state, s.last_changed, reading(c.pressure), reading(c.sector), reading(c.sectors), reading(c.mode), reading(c.battery), !!this._back, this._range].join("|");
    if (!reloadHistory && sig === this._sig && this.shadowRoot.querySelector(".card")) {
      const t = this.shadowRoot.getElementById("timer");
      if (t && !isNaN(secs)) t.textContent = clock(secs);
      return;
    }
    this._sig = sig;
    const focusKey = this.shadowRoot.activeElement?.dataset?.focus;
    const on = this.isOn(s.state);
    const away = ["unavailable", "unknown"].includes(s.state);
    const wasOn = this._on;
    this._on = on;
    const name = c.name || s.attributes.friendly_name;
    const paperC = colour(c.color), black = "var(--hc-black, #141414)";
    // Ink for type on the card's colour when it is on: black on light papers, paper on dark ones.
    const ink = ["yellow", "pink", "paper"].includes(c.color) ? black : "var(--hc-paper, #F4F0E6)";
    const back = !!this._back, range = this._range || "day";
    const nSectors = Math.max(1, Number(reading(c.sectors)) || 4);
    const sector = reading(c.sector) || "";
    const atSector = sector === "success" ? nSectors : Number(sector.replace("sector_", "")) || 0;
    const hard = reading(c.pressure) === "high";
    const mode = reading(c.mode), bat = Number(reading(c.battery));
    const known = (v) => v != null && !["unknown", "unavailable", "off"].includes(v);
    const stateLine = on ? "On now" : away ? "Out of range" : "Off";

    const style = `<style>${MATERIAL}${BATTERY}
        .card { padding: 14px 14px 12px; transform: rotate(${c.tilt}deg); overflow: visible; }
        .card.on { background: ${paperC}; color: ${ink}; }
        .band { position: absolute; left: -4px; top: -6px; width: 58%; height: 66px; background: ${paperC};
          box-shadow: 0 1px 1px rgba(0,0,0,.25), 0 6px 12px -6px rgba(0,0,0,.5); transform: rotate(-1deg); }
        .on .band { display: none; }
        .form { width: 150px; right: -46px; top: -54px; z-index: 3; transform: rotate(18deg); filter: drop-shadow(0 6px 8px rgba(0,0,0,.4)); }
        .head { position: relative; z-index: 4; padding-right: 48px; min-height: 52px; }
        h2, h3 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: .95; }
        .sub { margin-top: 5px; font-size: 13px; font-weight: 600; }
        .flip { position: absolute; z-index: 6; top: 8px; right: 8px; width: 40px; height: 40px; display: grid; place-items: center;
          background: ${black}; color: var(--hc-paper, #F4F0E6); --mdc-icon-size: 20px; }
        .live { position: relative; z-index: 4; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin: 12px 0 4px; }
        .timer { font-size: 56px; font-weight: 700; line-height: .82; letter-spacing: -.05em; }
        .sectors { display: flex; gap: 5px; }
        .sectors i { display: block; width: 22px; height: 22px; border: 3px solid ${ink}; }
        .sectors i:nth-child(odd) { transform: rotate(-4deg); }
        .sectors i:nth-child(even) { transform: rotate(3deg); }
        .sectors i.lit { background: ${ink}; }
        .tag { padding: 6px 10px 5px; font-size: 14px; font-weight: 700; background: var(--hc-red, #D7301F); color: var(--hc-paper, #F4F0E6); transform: rotate(-2deg); }
        .today { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: baseline; gap: 8px;
          margin-top: 12px; font-size: 13px; font-weight: 600; }
        .today b { font-size: 18px; letter-spacing: -.02em; }
        /* A stretch of time as a strip of paper; each time it ran is a mark cut out and stuck on. */
        .line { position: relative; height: var(--h, 46px); background: #DDD6C6; border-bottom: 2px solid ${black}; }
        .on .line { background: color-mix(in srgb, ${black} 14%, ${paperC}); }
        .line i { position: absolute; bottom: 0; display: block; min-width: 4px; background: ${black}; transform-origin: bottom center;
          box-shadow: 0 1px 1px rgba(0,0,0,.25); }
        .line i.now { background: ${paperC}; box-shadow: inset 0 0 0 2px ${black}; }
        /* Pressing hard: a red sliver along the bottom of the strip, as long as it lasted. */
        .line b { position: absolute; z-index: 1; display: block; }
        .line b.held { bottom: 0; height: 34%; min-width: 3px; background: var(--hc-red, #D7301F); }
        .key[hidden] { display: none; }
        .key { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 11px; font-weight: 600; }
        .key i { display: block; width: 5px; height: 14px; background: linear-gradient(to top, var(--hc-red, #D7301F) 40%, ${black} 40%); }
        .on .line i.now { background: var(--hc-paper, #F4F0E6); }
        .ticks { position: relative; height: 15px; margin-top: 2px; font-size: 11px; font-weight: 600; }
        .ticks span { position: absolute; top: 0; white-space: nowrap; transform: translateX(-50%); }
        .ticks span.first { transform: none; }
        .ticks span.last { transform: translateX(-100%); }
        .week { display: grid; grid-template-columns: 34px 1fr 24px; gap: 9px 6px; align-items: center; }
        .week .hn { font-size: 12px; font-weight: 700; color: var(--hc-red, #D7301F); text-align: right; }
        .week .day { font-size: 12px; font-weight: 700; }
        .week .line { --h: 24px; }
        .week .ticks { grid-column: 2; }
        .tabs { margin: 12px 0 10px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 10px; margin-top: 12px; font-size: 12px; font-weight: 600; }
        .stats b { display: block; font-size: 18px; letter-spacing: -.02em; }
        .stats.hard { margin-top: 10px; padding-top: 10px; border-top: 2px dotted ${black}; }
        .stats.hard b { color: var(--hc-red, #D7301F); }
        @container (max-width: 380px) { .stats { grid-template-columns: 1fr 1fr; } }
        .brush { margin-top: 16px; padding-top: 12px; border-top: 2px solid ${black}; }
        h4 { margin: 0 0 8px; font-size: 12px; font-weight: 600; letter-spacing: .04em; color: #4A4740; }
        .row { display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; }
        .chip { padding: 8px 10px; font-size: 13px; font-weight: 600; background: ${black}; color: var(--hc-paper, #F4F0E6); }
        .chip b { display: block; font-size: 18px; letter-spacing: -.02em; }
        .batt { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 4px 18px 4px 4px; background: none; font-size: 13px; font-weight: 600; }
        .batt .cell { width: 74px; flex: none; border-width: 3px; padding: 3px; gap: 3px; }
        .batt .cell::after { right: -9px; width: 6px; }
        .batt:hover { background: #ECE6D8; }
        .note { margin-top: 10px; font-size: 12px; font-weight: 500; color: #4A4740; }
        .away { filter: grayscale(1); }
        @media (prefers-reduced-motion: no-preference) {
          .turn { animation: turn .32s cubic-bezier(.16,1,.3,1) both; }
          @keyframes turn { from { transform: rotate(${c.tilt}deg) perspective(900px) rotateY(70deg); } }
        }
      </style>`;

    if (back) {
      this.shadowRoot.innerHTML = `${style}
        ${scatter(c.entity, 6)}
        <div class="paper card ${this._turning ? "turn" : ""}" style="container-type: inline-size">
          <button class="flip nopress" data-focus="flip" aria-label="Back to the front of ${esc(name)}">${icon("close")}</button>
          <div class="head"><h3>${esc(name)}</h3><div class="sub" id="last">${stateLine}</div></div>
          <div class="tabs" role="group" aria-label="Range">
            ${[["hour", "1 h"], ["day", "24 h"], ["week", "7 days"]].map(([k, l]) => `<button data-range="${k}" data-focus="r-${k}" aria-pressed="${range === k}">${l}</button>`).join("")}
          </div>
          <div id="plot" role="img"></div>
          <div class="stats num" id="stats"></div>
          <div class="stats hard num" id="hard"></div>
          <div class="brush"><h4>On the brush</h4>
            <div class="row num">
              <div class="chip"><b>${known(mode) ? esc(said(mode)) : "–"}</b>mode</div>
              <div class="chip"><b>${nSectors} sections</b>timer</div>
              ${this.st(c.battery) ? `<button class="batt" data-focus="batt" aria-label="Battery, ${isNaN(bat) ? "no reading" : `${Math.round(bat)} percent`}. Open details.">
                ${batteryArt(c.battery, bat)}<span>Battery${isNaN(bat) ? ", no reading" : bat < 30 ? ", low" : ""}</span></button>` : ""}
            </div>
            <div class="note">Home Assistant can read the brush but not set it. Mode and timer are changed on the brush.</div>
          </div>
        </div>`;
      this._turning = false;
      const sr = this.shadowRoot;
      sr.querySelector(".flip").addEventListener("click", () => { this._back = false; this._turning = true; this.update(false); this.shadowRoot.querySelector(".flip")?.focus(); });
      sr.querySelectorAll("[data-range]").forEach((b) => b.addEventListener("click", () => { this._range = b.dataset.range; this.update(false); this.shadowRoot.querySelector(`[data-range="${this._range}"]`)?.focus(); }));
      sr.querySelector(".batt")?.addEventListener("click", () => this.moreInfo(c.battery));
    } else {
      this.shadowRoot.innerHTML = `${style}
        ${scatter(c.entity, 6)}
        <div class="paper card ${on ? "on" : ""} ${away ? "away" : ""} ${this._turning ? "turn" : ""}">
          <div class="band"></div>
          ${on ? form(c.form, colour(c.form_color), `form ${wasOn === false ? "lay" : ""}`) : ""}
          <button class="flip nopress" data-focus="flip" aria-label="Turn ${esc(name)} over for its history">${icon("chart-bar")}</button>
          <div class="head"><h2>${esc(name)}</h2><div class="sub" id="last">${stateLine}</div></div>
          ${on ? `<div class="live num" role="status">
              <span class="timer" id="timer" aria-label="Running time">${isNaN(secs) ? "0:00" : clock(secs)}</span>
              <span class="sectors" aria-label="${atSector ? `Section ${atSector} of ${nSectors}` : `${nSectors} sections`}">${Array.from({ length: nSectors }, (_, i) => `<i class="${i < atSector ? "lit" : ""}"></i>`).join("")}</span>
              ${hard ? `<span class="tag">Pressing hard</span>` : ""}
            </div>` : ""}
          <div class="today num"><span>Today</span><b id="today">–</b></div>
          <div id="plot" role="img"></div>
          <div class="key" id="key" hidden><i></i><span id="keytext"></span></div>
        </div>`;
      this._turning = false;
      this.shadowRoot.querySelector(".flip").addEventListener("click", () => { this._back = true; this._turning = true; this.update(false); this.shadowRoot.querySelector(".flip")?.focus(); });
    }
    if (focusKey) this.shadowRoot.querySelector(`[data-focus="${focusKey}"]`)?.focus();
    if (this._history) this.drawHistory();
    this.scheduleHistory(() => this.loadHistory(!reloadHistory));
  }

  loadHistory(force) {
    const c = this._config;
    fetchHistory(this._hass, [c.entity, c.pressure], 24 * 7, false, force)
      .then((h) => { this._history = h[c.entity]; this._pressure = h[c.pressure] || []; this.drawHistory(); }).catch(() => {});
  }

  // A strip for [from, to] with a mark for each span; marks are cut by hand, so each leans a little.
  strip(spans, from, to, seed, h, hard = []) {
    const r = rng(seed), w = to - from;
    const marks = spans.filter(([a, b]) => b > from && a < to).map(([a, b]) => {
      const x = Math.max(a, from), y = Math.min(b, to);
      const live = this._on && b >= Date.now() - 1000;
      return `<i class="${live ? "now" : ""}" title="${hhmm(a)}, ${brief(b - a)}"
        style="left:${(((x - from) / w) * 100).toFixed(2)}%;width:${(((y - x) / w) * 100).toFixed(2)}%;height:${(68 + r() * 32).toFixed(0)}%;transform:rotate(${(r() * 8 - 4).toFixed(1)}deg)"></i>`;
    }).join("");
    const at = (t) => (((t - from) / w) * 100).toFixed(2);
    const held = hard.filter(([a, b]) => b > from && a < to).map(([a, b]) => {
      const x = Math.max(a, from), y = Math.min(b, to);
      return `<b class="held" title="Pressed hard at ${hhmm(a)}, for ${brief(b - a)}" style="left:${at(x)}%;width:${at(from + y - x)}%"></b>`;
    }).join("");
    return `<div class="line" ${h ? `style="--h:${h}px"` : ""}>${marks}${held}</div>`;
  }

  // Each time the pressure sensor went to "high", until it read anything else. The sensor keeps
  // its last reading when the brush stops, so a press still "high" then ends with the run.
  hardSpans(runs, now) {
    const p = this._pressure || [], out = [];
    for (let i = 0; i < p.length; i++) {
      if (p[i].s !== "high" || (i > 0 && p[i - 1].s === "high")) continue;
      let j = i + 1;
      while (j < p.length && p[j].s === "high") j++;
      let end = j < p.length ? p[j].t : now;
      const run = runs.find(([a, b]) => p[i].t >= a - 5000 && p[i].t <= b + 5000);
      if (run && end > run[1]) end = run[1];
      out.push([p[i].t, Math.max(end, p[i].t + 1000)]);
    }
    return out;
  }

  ticks(list) {
    return `<div class="ticks num" aria-hidden="true">${list.map(([p, l], i) =>
      `<span class="${p <= 0.5 && i === 0 ? "first" : p >= 99.5 ? "last" : ""}" style="left:${p.toFixed(2)}%">${l}</span>`).join("")}</div>`;
  }

  drawHistory() {
    const c = this._config, sr = this.shadowRoot, now = Date.now();
    const s = this.st(c.entity);
    const pts = [...(this._history || [])];
    // The history is up to five minutes old; the live state is not.
    const lc = new Date(s.last_changed).getTime();
    if (!pts.length || lc > pts[pts.length - 1].t) pts.push({ t: lc, s: s.state });
    const spans = onSpans(pts, now - 8 * 86400000, now, (x) => this.isOn(x));
    const inside = (from) => spans.map(([a, b]) => [Math.max(a, from), Math.min(b, now)]).filter(([a, b]) => b > a);
    const hard = this.hardSpans(spans, now);
    const hardIn = (a, b) => hard.filter(([x]) => x >= a && x < b);
    const times = (n) => (n === 0 ? "never" : n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    const last = spans[spans.length - 1];
    const lastEl = sr.getElementById("last");
    if (lastEl && last && !this._on && s.state !== "unavailable") {
      const day = new Date(last[0]).toDateString() === new Date().toDateString() ? "" : `, ${DAYS[new Date(last[0]).getDay()]}`;
      lastEl.textContent = `Last on at ${hhmm(last[0])}${day}, for ${brief(last[1] - last[0])}`;
    }
    const plot = sr.getElementById("plot");
    if (!plot) return;
    const range = this._back ? this._range || "day" : "day";
    let from;
    if (range === "week") {
      // One row per day, midnight to midnight, oldest at the top.
      from = midnight.getTime() - 6 * 86400000;
      const rows = Array.from({ length: 7 }, (_, i) => {
        const a = from + i * 86400000, d = new Date(a);
        const n = hardIn(a, a + 86400000).length;
        return `<span class="day">${i === 6 ? "Today" : DAYS[d.getDay()]}</span>${this.strip(spans, a, a + 86400000, `${c.entity}${a}`, 0, hard)}<span class="hn" title="Pressed hard ${times(n)}">${n ? `${n}×` : ""}</span>`;
      }).join("");
      plot.innerHTML = `<div class="week">${rows}${this.ticks([[0, "00"], [25, "06"], [50, "12"], [75, "18"], [100, "24"]])}<span></span></div>`;
    } else {
      const span = range === "hour" ? 3600000 : 86400000;
      from = now - span;
      const marks = [];
      if (range === "hour") {
        for (let m = 0; m <= 60; m += 15) marks.push([(m / 60) * 100, m === 60 ? "now" : hhmm(from + m * 60000)]);
      } else {
        const h = new Date(from); h.setMinutes(0, 0, 0);
        for (let t = h.getTime() + 3600000; t < now - 3600000; t += 3600000) {
          const at = ((t - from) / span) * 100;
          // Leave room for "now" at the end.
          if (new Date(t).getHours() % (this._back ? 3 : 6) === 0 && at < 87) marks.push([at, hhmm(t)]);
        }
        marks.push([100, "now"]);
      }
      plot.innerHTML = this.strip(spans, from, now, `${c.entity}${range}`, this._back ? 64 : 46, hard) + this.ticks(marks);
    }
    const label = { hour: "the last hour", day: "the last 24 hours", week: "the last 7 days" }[range];
    const these = inside(from);
    plot.setAttribute("aria-label", `On ${these.length} ${these.length === 1 ? "time" : "times"} in ${label}`);
    const today = inside(midnight.getTime());
    const total = (list) => list.reduce((t, [a, b]) => t + b - a, 0);
    const todayEl = sr.getElementById("today");
    if (todayEl) todayEl.textContent = today.length ? `${today.length} ${today.length === 1 ? "time" : "times"}, ${brief(total(today))}` : "Not yet";
    const shown = hardIn(from, now + 1);
    const key = sr.getElementById("key");
    if (key) {
      const n = hardIn(midnight.getTime(), now + 1).length, week = hardIn(midnight.getTime() - 6 * 86400000, now + 1).length;
      key.hidden = !week;
      sr.getElementById("keytext").textContent = `Pressed hard ${times(n)} today, ${times(week)} in 7 days`;
    }
    plot.setAttribute("aria-label", `${plot.getAttribute("aria-label")}, pressed hard ${times(shown.length)}`);
    const stats = sr.getElementById("stats");
    if (stats) {
      stats.innerHTML = `
        <span>Turned on<b>${these.length} ${these.length === 1 ? "time" : "times"}</b></span>
        <span>On for<b>${brief(total(these))}</b></span>
        <span>Longest<b>${these.length ? brief(Math.max(...these.map(([a, b]) => b - a))) : "–"}</b></span>
        <span>Average<b>${these.length ? brief(total(these) / these.length) : "–"}</b></span>`;
    }
    const hardEl = sr.getElementById("hard");
    if (hardEl) {
      // Runs with any hard pressing, out of the runs in range.
      const runsHard = these.filter(([a, b]) => hard.some(([x]) => x >= a - 5000 && x <= b + 5000)).length;
      hardEl.innerHTML = `
        <span>Pressed hard<b>${times(shown.length)}</b></span>
        <span>In runs<b>${these.length ? `${runsHard} of ${these.length}` : "–"}</b></span>
        <span>Hard for<b>${shown.length ? brief(total(shown)) : "–"}</b></span>
        <span>Longest press<b>${shown.length ? brief(Math.max(...shown.map(([a, b]) => b - a))) : "–"}</b></span>`;
    }
  }
}

// ---------- dates and durations for the record cards ----------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayName = (t) => { const d = new Date(t), y = d.getFullYear() === new Date().getFullYear() ? "" : ` ${d.getFullYear()}`; return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${y}`; };
const median = (xs) => { const s = xs.filter((x) => x != null && !isNaN(x)).sort((a, b) => a - b); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
// "6 h 52 m" for minutes; "25 m" for a difference.
// Non-breaking, so a duration never splits across lines.
const mins = (m) => duration(Math.abs(m) * 60000).replace(/ /g, "\u00a0");

// ---------- kitchen: the range from above, and the time spent at it ----------

// A GE range on the SmartHQ integration reports each burner on or off, the power of most of them
// (a warmer has no power reading), and each oven's state and cook mode; nothing meters energy, so
// "heat" is power % x hours, a relative measure, never kWh. Every entity is named after the range:
// `appliance` is that prefix (the serial number SmartHQ uses, lower case). Long-term statistics come
// from the sensors in examples/packages/collage_stove.yaml, named `<statistics>_...`; without them
// (statistics: false) the cards read the recorder's raw history, ten days by default.
// The layout is a five-burner cooktop with a warmer in the centre rear and a double oven; `burners`
// and `ovens` replace it: x and y place a ring on the cooktop in %, size is its diameter in %.
const BURNERS = [
  { key: "lf", name: "Left front", sensor: "left_front", x: 25, y: 69, size: 26 },
  { key: "lr", name: "Left rear", sensor: "left_rear", x: 27, y: 29, size: 20 },
  { key: "warm", name: "Warmer", sensor: "center_rear", x: 50, y: 30, size: 12, warmer: true },
  { key: "rf", name: "Right front", sensor: "right_front", x: 75, y: 69, size: 26 },
  { key: "rr", name: "Right rear", sensor: "right_rear", x: 73, y: 29, size: 20 },
];
const OVENS = [{ key: "upper", name: "Upper oven", control: "oven" }, { key: "lower", name: "Lower oven", control: "lower_oven" }];
function kitchenOf(c) {
  const P = c.appliance, S = c.statistics === false ? null : typeof c.statistics === "string" ? c.statistics : "kitchen";
  for (const b of c.burners || []) if (!b.sensor) throw new Error("each burner needs sensor: its part of the entity id, such as left_front");
  const stat = (name) => (S ? `sensor.${S}_${name}` : null);
  return {
    key: `${P}|${S}`,
    cooktop: `binary_sensor.${P}_cooktop_status`,
    burners: (c.burners || BURNERS).map((b, i) => {
      const key = b.key || b.sensor || `b${i}`, warm = !!b.warmer;
      return { key, name: b.name || said(b.sensor || key), x: b.x, y: b.y, r: (b.size || 20) / 2, warm,
        on: `binary_sensor.${P}_cooktop_status_${b.sensor}_on`, pct: warm ? null : `sensor.${P}_cooktop_status_${b.sensor}_power_pct`,
        today: stat(`${warm ? "warmer" : b.sensor}_today`), heat: warm ? null : stat(`${b.sensor}_heat`) };
    }),
    ovens: (c.ovens || OVENS).map((o) => ({ key: o.key, name: o.name || `${said(o.key)} oven`,
      state: `sensor.${P}_${o.key}_oven_current_state`, mode: `sensor.${P}_${o.key}_oven_cook_mode`, control: `water_heater.${P}_${o.control || `${o.key}_oven`}`,
      light: `select.${P}_${o.key}_oven_light`, remain: `sensor.${P}_${o.key}_oven_cook_time_remaining`, timer: `sensor.${P}_${o.key}_oven_kitchen_timer`,
      today: stat(`${o.key}_oven_today`) })),
    stove: stat("stove_today"), cooktopToday: stat("cooktop_today"), sessions: stat("stove_sessions_today"),
  };
}
// The range speaks Fahrenheit for its ovens, whatever the house uses.
const OFF = ["Off", "off", "unavailable", "unknown", undefined];
const ovenOn = (s) => !OFF.includes(s);
// "Bake (350°C)": the range sends its own Fahrenheit number with a Celsius sign.
const cookMode = (s) => { const m = /^(.*?)\s*\((\d+)/.exec(s || ""); return m ? { mode: m[1], set: Number(m[2]) } : OFF.includes(s) ? null : { mode: s, set: null }; };
// "Air Fry 425 then 400°F": each mode once, its temperatures in order.
const modesSaid = (ms) => {
  if (!ms.length) return "on";
  const by = new Map();
  for (const m of ms) { const t = by.get(m.mode) || []; if (m.set && t[t.length - 1] !== m.set) t.push(m.set); by.set(m.mode, t); }
  return [...by].map(([mode, t]) => `${mode}${t.length ? ` ${t.join(" then ")}°F` : ""}`).join(", ");
};
const ovenSaid = (m) => (m ? `${m.mode}${m.set ? ` ${m.set}°F` : ""}` : "");
// [days, tab, "in 30 days", "the 30 days before"]: rolling spans, so never "this month".
const KSPANS = { week: [7, "Week", "in 7 days", "the 7 days before"], month: [30, "Month", "in 30 days", "the 30 days before"], quarter: [91, "3 mo", "in 3 months", "the 3 months before"],
  half: [182, "6 mo", "in 6 months", "the 6 months before"], year: [364, "Year", "in a year", "the year before"] };
const kspanDays = (k) => KSPANS[k][0];
// The span is shared by the kitchen cards on a page: choose it on one, the others follow.
let kitchenSpan = "month";
const setKitchenSpan = (k) => { kitchenSpan = k; window.dispatchEvent(new CustomEvent("collage-kitchen-span", { detail: k })); };

// Spans [a, b] merged when the gap between them is under `gap` ms.
function mergeSpans(spans, gap = 0) {
  const s = [...spans].sort((x, y) => x[0] - y[0]), out = [];
  for (const [a, b] of s) { const last = out[out.length - 1]; if (last && a - last[1] < gap) last[1] = Math.max(last[1], b); else out.push([a, b]); }
  return out;
}

// The kitchen's record for the last `days` days: one row per day, the stove's sessions (raw history,
// ten days), and minutes at the stove by weekday and hour.
const kitchenCache = new Map();
function kitchenRecord(hass, K, days) {
  const key = `${K.key}|${days}`;
  const hit = kitchenCache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60000) return hit.promise;
  const now = Date.now(), today = startOfDay(now), from = today - (days - 1) * 86400000;
  const statIds = [K.stove, K.cooktopToday, K.sessions, ...K.ovens.map((o) => o.today), ...K.burners.map((b) => b.today), ...K.burners.map((b) => b.heat)].filter(Boolean);
  const stats = statIds.length ? hass.callWS({ type: "recorder/statistics_during_period", start_time: new Date(from).toISOString(), period: "day", statistic_ids: statIds, types: ["max", "change"] }).catch(() => ({})) : Promise.resolve({});
  const hourly = K.stove ? hass.callWS({ type: "recorder/statistics_during_period", start_time: new Date(from).toISOString(), period: "hour", statistic_ids: [K.stove], types: ["max"] }).catch(() => ({})) : Promise.resolve({});
  const rawIds = [K.cooktop, ...K.burners.map((b) => b.on), ...K.burners.map((b) => b.pct).filter(Boolean), ...K.ovens.map((o) => o.state), ...K.ovens.map((o) => o.mode)];
  const raw = fetchHistory(hass, rawIds, 240).catch(() => ({}));
  const promise = Promise.all([stats, hourly, raw]).then(([s, hr, h]) => {
    const rows = Array.from({ length: days }, (_, i) => ({ t: from + i * 86400000, burners: {}, heat: {} }));
    const at = (t) => rows[Math.round((startOfDay(t) - from) / 86400000)];
    // Raw history: who was on when.
    const pts = (id) => (h[id] || []).filter((p) => p.s !== "unavailable");
    const rawFrom = Math.min(...rawIds.map((id) => (h[id] && h[id][0] ? h[id][0].t : now)));
    const spansOf = (id, isOn) => onSpans(pts(id), rawFrom, now, isOn);
    const cook = spansOf(K.cooktop);
    const ovens = Object.fromEntries(K.ovens.map((o) => [o.key, spansOf(o.state, ovenOn)]));
    const burners = Object.fromEntries(K.burners.map((b) => [b.key, spansOf(b.on)]));
    const stove = mergeSpans([...cook, ...K.ovens.flatMap((o) => ovens[o.key])]);
    // Heat: power % x hours, each reading held until the next.
    const heatSpans = Object.fromEntries(K.burners.filter((b) => b.pct).map((b) => {
      const p = pts(b.pct);
      return [b.key, p.map((x, i) => [x.t, i + 1 < p.length ? p[i + 1].t : now, Number(x.s) || 0]).filter(([, , v]) => v > 0)];
    }));
    const heatIn = (k, a, b) => (heatSpans[k] || []).reduce((sum, [x, y, v]) => sum + (v * Math.max(0, Math.min(y, b) - Math.max(x, a))) / 3600000, 0);
    const firstFull = startOfDay(rawFrom) + (rawFrom > startOfDay(rawFrom) ? 86400000 : 0);
    // Sessions: any use of the stove, breaks under 20 minutes joined.
    const modes = Object.fromEntries(K.ovens.map((o) => [o.key, pts(o.mode)]));
    const sessions = mergeSpans(stove, 20 * 60000).map(([a, b]) => {
      const on = overlap(stove, a, b);
      const used = K.burners.map((x) => ({ ...x, min: overlap(burners[x.key], a, b) / 60000, heat: heatIn(x.key, a, b) })).filter((x) => x.min > 0.5);
      const ov = K.ovens.map((o) => {
        const min = overlap(ovens[o.key], a, b) / 60000;
        const seen = modes[o.key].filter((p) => p.t <= b && (p.t >= a - 60000 || true)).map((p) => ({ t: p.t, m: cookMode(p.s) }));
        const during = seen.filter((p, i) => p.m && (p.t >= a - 60000 || (seen[i + 1] ? seen[i + 1].t > a : true)) && p.t <= b).map((p) => p.m);
        return { ...o, min, modes: during };
      }).filter((o) => o.min > 0.5);
      const hottest = Math.max(0, ...ov.flatMap((o) => o.modes.map((m) => m.set || 0)));
      // A low bake (300°F or less) with nothing on the cooktop.
      const lowBake = !used.length && ov.length && hottest > 0 && hottest <= 300;
      return { a, b, on, burners: used, ovens: ov, lowBake, warmOnly: used.length === 1 && used[0].warm && !ov.length };
    });
    // Each day: statistics where they exist (days before today), raw history otherwise.
    const statRows = (id) => s[id] || [];
    const take = (id, f) => statRows(id).forEach((r) => { const row = at(typeof r.start === "number" ? r.start : Date.parse(r.start)); if (row && row.t < today) f(row, r); });
    if (K.stove) take(K.stove, (row, r) => { if (r.max != null) { row.stove = r.max * 60; row.fromStats = true; } });
    if (K.cooktopToday) take(K.cooktopToday, (row, r) => { if (r.max != null) row.cooktop = r.max * 60; });
    if (K.sessions) take(K.sessions, (row, r) => { if (r.max != null) row.sessions = r.max; });
    K.ovens.filter((o) => o.today).forEach((o) => take(o.today, (row, r) => { if (r.max != null) row[o.key] = r.max * 60; }));
    K.burners.filter((b) => b.today).forEach((b) => take(b.today, (row, r) => { if (r.max != null) row.burners[b.key] = r.max * 60; }));
    K.burners.filter((b) => b.heat).forEach((b) => take(b.heat, (row, r) => { if (r.change != null) row.heat[b.key] = r.change; }));
    for (const row of rows) {
      if (row.fromStats || row.t < firstFull) continue;
      const a = row.t, b = Math.min(row.t + 86400000, now);
      row.stove = overlap(stove, a, b) / 60000;
      row.cooktop = overlap(cook, a, b) / 60000;
      K.ovens.forEach((o) => { row[o.key] = overlap(ovens[o.key], a, b) / 60000; });
      K.burners.forEach((x) => { row.burners[x.key] = overlap(burners[x.key], a, b) / 60000; if (x.pct) row.heat[x.key] = heatIn(x.key, a, b); });
      row.sessions = sessions.filter((x) => x.a >= a && x.a < b).length;
    }
    // Minutes at the stove by weekday and hour: raw spans where there are any, hourly statistics before.
    const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
    const add = (t, m) => { const d = new Date(t); grid[d.getDay()][d.getHours()] += m; };
    for (const [a, b] of stove) for (let t = Math.max(a, from); t < b; t = Math.min(b, startOfHour(t) + 3600000)) add(t, (Math.min(b, startOfHour(t) + 3600000) - t) / 60000);
    let prev = null;
    for (const r of (hr[K.stove] || [])) {
      const t = typeof r.start === "number" ? r.start : Date.parse(r.start);
      if (t >= firstFull || r.max == null) { prev = null; continue; }
      const d = new Date(t), base = prev && startOfDay(prev.t) === startOfDay(t) ? prev.v : 0;
      add(t, Math.max(0, r.max - base) * 60); prev = { t, v: r.max };
      void d;
    }
    const first = rows.find((r) => r.stove != null);
    return { rows, sessions: sessions.reverse(), grid, first: first ? first.t : null, rawFrom: firstFull };
  });
  kitchenCache.set(key, { at: Date.now(), promise });
  promise.catch(() => kitchenCache.delete(key));
  return promise;
}
const startOfHour = (t) => { const d = new Date(t); d.setMinutes(0, 0, 0); return d.getTime(); };
const sum = (xs) => xs.reduce((a, b) => a + (b || 0), 0);
// "4 h 10 m", or "0 m" for nothing.
const minsSaid = (m) => (m >= 0.5 ? mins(m) : "0 m");

// The range from above: the cooktop as an ink sheet with its five rings, the ovens as two doors
// below. A burner that is on is a vermilion disc, its yellow heart as wide as its power; each ring
// carries its share of the chosen span. Tap a door for the oven's own controls.
class CollageRangeCard extends CollageCard {
  validate(c) { if (!c.appliance) throw new Error("collage-range-card needs appliance: the prefix of the range's entity ids"); this._K = kitchenOf(c); return c; }
  watch() { const K = this._K; return [K.cooktop, ...K.burners.flatMap((b) => [b.on, b.pct]), ...K.ovens.flatMap((o) => [o.state, o.mode, o.light, o.remain, o.timer, o.control])].filter(Boolean); }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  connectedCallback() {
    super.connectedCallback();
    this._onSpan = () => this.load();
    window.addEventListener("collage-kitchen-span", this._onSpan);
  }
  disconnectedCallback() { super.disconnectedCallback(); window.removeEventListener("collage-kitchen-span", this._onSpan); }

  update() { this.draw(); this.load(); }
  getCardSize() { return 9; }
  load() {
    const span = kitchenSpan;
    kitchenRecord(this._hass, this._K, kspanDays(span)).then((rec) => { if (span === kitchenSpan) { this._rec = rec; this._span = span; this.draw(); } }).catch(() => {});
  }

  draw() {
    const K = this._K, focusKey = this.shadowRoot.activeElement?.dataset?.focus;
    const st = (id) => this.st(id)?.state;
    const live = K.burners.map((b) => ({ ...b, on: st(b.on) === "on", pct: b.pct ? Number(st(b.pct)) || 0 : null }));
    const doors = K.ovens.map((o) => ({ ...o, s: st(o.state), m: cookMode(st(o.mode)), light: st(o.light), remain: Number(st(o.remain)) || 0, timer: Number(st(o.timer)) || 0 }));
    const lit = live.filter((b) => b.on), hot = doors.filter((o) => ovenOn(o.s));
    const away = st(K.cooktop) === "unavailable";
    const line = away ? "The range isn't answering" : !lit.length && !hot.length ? "All off"
      : (() => {
        // "Right front at 60%, the warmer and the upper oven on", powered burners first.
        const parts = [...lit.filter((b) => b.pct).map((b) => `${b.name.toLowerCase()} at ${b.pct}%`), ...lit.filter((b) => !b.pct).map((b) => `the ${b.name.toLowerCase()}`),
          ...hot.map((o) => `the ${o.name.toLowerCase()}${o.s === "Preheat" ? " preheating" : ""}`)];
        const said = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
        return `${said.replace(/^the /, "").replace(/^./, (x) => x.toUpperCase())} on`;
      })();
    // The span's share per burner: minutes, and heat as a share of the cooktop's.
    const rows = this._rec ? this._rec.rows.filter((r) => r.stove != null) : [];
    const minOf = (k) => sum(rows.map((r) => r.burners[k]));
    const heatOf = (k) => sum(rows.map((r) => r.heat[k]));
    const heatAll = sum(K.burners.map((b) => heatOf(b.key)));
    const spanSaid = this._span ? KSPANS[this._span][2] : "";
    const pick = this._pick && K.burners.find((b) => b.key === this._pick);
    const top = [...K.burners].filter((b) => b.pct).sort((a, b) => heatOf(b.key) - heatOf(a.key))[0];
    const say = (b) => {
      const m = minOf(b.key), share = heatAll ? Math.round((heatOf(b.key) / heatAll) * 100) : 0;
      return `${b.name}: ${minsSaid(m)} ${spanSaid}${b.pct && heatAll ? `, ${share}% of the cooktop's heat` : b.pct ? "" : ", a warmer with no power reading"}.`;
    };
    const note = !rows.length ? "Reading the range's record…" : pick ? say(pick) : heatAll ? `${top.name} does the most work: ${Math.round((heatOf(top.key) / heatAll) * 100)}% of the cooktop's heat ${spanSaid}.` : `No cooking on the record ${spanSaid}.`;
    const ring = (b) => {
      const m = minOf(b.key), size = b.r * 2;
      const fill = b.on ? `<i class="disc"></i>${b.pct ? `<i class="core" style="width:${Math.max(18, b.pct)}%;height:${Math.max(18, b.pct)}%"></i>` : ""}` : "";
      return `<button class="ring ${b.on ? "on" : ""} ${b.warm ? "warm" : ""} ${this._pick === b.key ? "sel" : ""} nopress" data-k="${b.key}" data-focus="b-${b.key}"
        style="left:${b.x}%;top:${b.y}%;width:${size}%;" aria-pressed="${this._pick === b.key}"
        aria-label="${esc(b.name)}${b.on ? `, on${b.pct ? ` at ${b.pct} percent` : ""}` : ", off"}. ${esc(minsSaid(m))} ${spanSaid}.">${fill}
        ${rows.length ? `<span class="m num ${b.warm ? "small" : ""}">${m >= 60 ? `${Math.floor(m / 60)}<small>h</small>${pad(Math.round(m % 60))}` : `${Math.round(m)}<small>m</small>`}</span>` : ""}</button>`;
    };
    const door = (o, i) => {
      const on = ovenOn(o.s), clock = (h) => mins(h * 60);
      return `<div class="door ${on ? "on" : ""} ${i ? "low" : ""}">
        <button class="open" data-more="${o.control}" data-focus="d-${o.key}" aria-label="${esc(o.name)}, ${on ? esc(`${o.s}${o.m ? `, ${ovenSaid(o.m)}` : ""}`) : "off"}. Open its controls.">
          <span class="name">${esc(o.name)}</span>
          <span class="window num">${on ? `<b>${esc(o.s === "Preheat" ? "Preheating" : o.m ? o.m.mode : o.s)}</b>${o.m && o.m.set ? `${o.m.set}°F` : ""}${o.remain ? ` · ${clock(o.remain)} left` : ""}` : "Off"}</span>
          ${o.timer ? `<span class="timer num">Timer ${clock(o.timer)}</span>` : ""}
        </button>
        <button class="lamp ${o.light && o.light !== "Off" ? "lit" : ""}" data-light="${o.light}" data-focus="l-${o.key}" aria-pressed="${o.light && o.light !== "Off"}" aria-label="${esc(o.name)} light">${icon(o.light && o.light !== "Off" ? "lightbulb-on" : "lightbulb-outline")}</button>
      </div>`;
    };
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .card { padding: 14px 14px 16px; transform: rotate(.4deg); overflow: visible; }
        .form { width: 120px; right: -36px; top: -44px; z-index: 3; transform: rotate(-16deg); filter: drop-shadow(0 6px 8px rgba(0,0,0,.4)); }
        h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
        .sub { margin-top: 5px; font-size: 13px; font-weight: 600; min-height: 16px; }
        .top { position: relative; margin: 14px 2px 0; aspect-ratio: 1.55; background: var(--hc-black, #141414); transform: rotate(-.8deg);
          box-shadow: 0 1px 1px rgba(0,0,0,.3), 0 8px 16px -8px rgba(0,0,0,.6); }
        .ring { position: absolute; aspect-ratio: 1; padding: 0; transform: translate(-50%, -50%); border-radius: 50%; background: none;
          box-shadow: inset 0 0 0 3px var(--hc-paper, #F4F0E6); display: grid; place-items: center; color: var(--hc-paper, #F4F0E6); }
        .ring.warm { box-shadow: inset 0 0 0 2px #8C877C; }
        .ring.sel { outline: 3px solid var(--hc-yellow, #F2B705); outline-offset: 3px; }
        .ring .disc { position: absolute; inset: 0; border-radius: 50%; background: var(--hc-red, #D7301F); }
        .ring.warm .disc { background: var(--hc-orange, #E8632B); }
        .ring .core { position: absolute; border-radius: 50%; background: var(--hc-yellow, #F2B705); }
        .ring .m { position: relative; font-size: 17px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
        .ring .m small { font-size: 11px; margin: 0 1px; }
        .ring .m.small { font-size: 12px; }
        .ring .m.small small { font-size: 9px; }
        .ring.on .m { color: var(--hc-black, #141414); }
        .note { margin: 12px 0 0; font-size: 14px; font-weight: 600; min-height: 34px; }
        .front { display: grid; gap: 8px; margin-top: 12px; padding: 10px; background: #DDD6C6; }
        .door { position: relative; display: flex; align-items: stretch; gap: 8px; }
        .open { flex: 1; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 4px 10px; min-height: 64px; padding: 8px 10px;
          text-align: left; background: var(--hc-paper, #F4F0E6); box-shadow: 0 1px 1px rgba(0,0,0,.25), 0 4px 8px -4px rgba(0,0,0,.45); }
        .door.low .open { min-height: 86px; }
        .open .name { font-size: 16px; font-weight: 700; letter-spacing: -.01em; }
        /* A door's handle: an ink bar along its top edge. */
        .open { position: relative; padding-top: 16px; }
        .open::before { content: ""; position: absolute; left: 22%; right: 22%; top: 5px; height: 5px; background: var(--hc-black, #141414); }
        .door.on .open::before { background: var(--hc-paper, #F4F0E6); }
        .open .window { grid-row: 2; grid-column: 1 / -1; padding: 6px 9px; font-size: 13px; font-weight: 600; background: #4A4740; color: var(--hc-paper, #F4F0E6); }
        .open .window b { font-size: 16px; margin-right: 6px; letter-spacing: -.01em; }
        .open .timer { font-size: 13px; font-weight: 700; }
        .door.on .open { background: var(--hc-orange, #E8632B); color: var(--hc-paper, #F4F0E6); }
        .door.on .open .window { background: var(--hc-black, #141414); }
        .open:hover { filter: brightness(.97); }
        .lamp { width: 44px; flex: none; display: grid; place-items: center; background: var(--hc-black, #141414); color: var(--hc-paper, #F4F0E6); --mdc-icon-size: 22px; }
        .lamp.lit { background: var(--hc-yellow, #F2B705); color: var(--hc-black, #141414); }
        .away { filter: grayscale(1); }
      </style>
      ${scatter("range", 6)}
      <div class="paper card ${away ? "away" : ""}">
        ${lit.length || hot.length ? form(5, colour("yellow"), `form ${this._wasOn === false ? "lay" : ""}`) : ""}
        <h2>The range</h2><div class="sub" role="status">${esc(line)}</div>
        <div class="top" role="group" aria-label="Cooktop, from above">${live.map(ring).join("")}</div>
        <p class="note num">${esc(note)}</p>
        <div class="front">${doors.map(door).join("")}</div>
      </div>`;
    this._wasOn = !!(lit.length || hot.length);
    const sr = this.shadowRoot;
    sr.querySelectorAll(".ring").forEach((b) => b.addEventListener("click", () => { this._pick = this._pick === b.dataset.k ? null : b.dataset.k; this.draw(); this.shadowRoot.querySelector(`[data-k="${b.dataset.k}"]`)?.focus(); }));
    sr.querySelectorAll("[data-more]").forEach((b) => b.addEventListener("click", () => this.moreInfo(b.dataset.more)));
    sr.querySelectorAll("[data-light]").forEach((b) => b.addEventListener("click", () => {
      const on = this.st(b.dataset.light)?.state !== "Off";
      this.run("select", "select_option", { entity_id: b.dataset.light, option: on ? "Off" : "High" }, "The oven didn't answer.").catch(() => {});
    }));
    if (focusKey) sr.querySelector(`[data-focus="${focusKey}"]`)?.focus();
  }
}

// At the stove: how much time the stove is on, over a week to a year, against the usual; when in
// the week and the day it happens; and the latest sessions, each a slip with its burners and ovens.
class CollageStoveCard extends CollageCard {
  validate(c) { if (!c.appliance) throw new Error("collage-stove-card needs appliance: the prefix of the range's entity ids"); this._K = kitchenOf(c); return c; }
  watch() { return [this._K.cooktop, ...this._K.ovens.map((o) => o.state)]; }
  getCardSize() { return 14; }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  connectedCallback() {
    super.connectedCallback();
    this._onSpan = () => { if (this.shadowRoot.querySelector(".card")) this.syncTabs(); this.load(); };
    window.addEventListener("collage-kitchen-span", this._onSpan);
  }
  disconnectedCallback() { super.disconnectedCallback(); window.removeEventListener("collage-kitchen-span", this._onSpan); }

  update() {
    if (!this.shadowRoot.querySelector(".card")) this.frame();
    this.load();
  }
  syncTabs() { this.shadowRoot.querySelectorAll("[data-span]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.span === kitchenSpan)); }
  load() {
    const span = kitchenSpan, days = kspanDays(span);
    // The span and the one before it, so a span can be read against its predecessor.
    kitchenRecord(this._hass, this._K, Math.min(days * 2, 728)).then((rec) => { if (span !== kitchenSpan) return; this._rec = rec; this._span = span; this._sel = null; this.draw(); }).catch(() => {});
  }

  frame() {
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .card { padding: 14px 14px 16px; transform: rotate(-.3deg); }
        .head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 10px 12px; }
        h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
        .tabs button { padding: 7px 10px; }
        .lead { margin: 14px 0 0; font-size: 16px; font-weight: 600; line-height: 1.25; }
        .lead b { display: block; font-size: 42px; line-height: .9; letter-spacing: -.04em; margin-bottom: 4px; }
        .vs { margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #4A4740; }
        .read { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 12px; min-height: 52px; margin: 12px -4px 10px; padding: 8px 12px;
          background: var(--hc-black, #141414); color: var(--hc-paper, #F4F0E6); transform: rotate(.5deg);
          box-shadow: 0 1px 1px rgba(0,0,0,.25), 0 6px 12px -6px rgba(0,0,0,.55); font-size: 13px; font-weight: 600; }
        .read .day { flex-basis: 100%; font-size: 14px; font-weight: 700; }
        .read b { font-size: 18px; letter-spacing: -.02em; margin-right: 3px; }
        .bars:focus-visible { outline: 3px solid var(--hc-yellow, #F2B705); outline-offset: 4px; }
        .bars { position: relative; height: 128px; display: flex; align-items: flex-end; gap: var(--g); border-bottom: 2px solid var(--hc-black, #141414); touch-action: pan-y; }
        .bars .b { position: relative; flex: 1; height: 100%; display: flex; align-items: flex-end; gap: 1px; }
        .bars .b i { flex: 1; display: block; transform-origin: bottom center; }
        .bars .b i.c { background: var(--hc-red, #D7301F); }
        .bars .b i.o { background: var(--hc-orange, #E8632B); }
        .bars .b s { position: absolute; z-index: 0; left: 0; right: 0; bottom: 0; background: #D9D2C1; }
        .bars .b i { position: relative; z-index: 1; }
        .bars .b.sel::after { content: ""; position: absolute; inset: -4px -2px -2px; border: 2px solid var(--hc-black, #141414); pointer-events: none; }
        .bars .b.none i { display: none; }
        .bars .b.none::before { content: ""; position: absolute; left: 0; right: 0; bottom: 3px; border-top: 2px dotted #B9B3A5; }
        .bars .usual { position: absolute; left: 0; right: 0; border-top: 2px dashed var(--hc-black, #141414); pointer-events: none; }
        .ticks { position: relative; height: 15px; margin-top: 3px; font-size: 11px; font-weight: 600; color: #4A4740; }
        .ticks span { position: absolute; top: 0; white-space: nowrap; transform: translateX(-50%); }
        .ticks span.first { transform: none; } .ticks span.last { transform: translateX(-100%); }
        .key { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 8px; font-size: 12px; font-weight: 600; }
        .key i { display: inline-block; width: 14px; height: 8px; margin-right: 5px; }
        .key i.dash { height: 0; border-top: 2px dashed var(--hc-black, #141414); vertical-align: 3px; }
        .key i.dot { height: 0; border-top: 2px dotted #8C877C; vertical-align: 3px; }
        h3 { margin: 18px 0 2px; font-size: 18px; font-weight: 700; letter-spacing: -.01em; }
        .say { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #4A4740; text-wrap: pretty; }
        .grid { display: grid; grid-template-columns: 28px repeat(24, 1fr); gap: 2px; align-items: center; }
        .grid .d { font-size: 11px; font-weight: 700; }
        .grid i { display: block; aspect-ratio: 1; background: radial-gradient(#CFC7B4 32%, transparent 36%) center / 100% 100%; position: relative; }
        .grid i b { position: absolute; inset: calc(50% - var(--s) / 2); background: var(--hc-red, #D7301F); }
        .grid .hrs { grid-column: 2 / -1; position: relative; height: 14px; font-size: 11px; font-weight: 600; color: #4A4740; }
        .grid .hrs span { position: absolute; top: 0; transform: translateX(-50%); }
        .finds { display: grid; gap: 6px; margin: 14px 0 0; padding: 0; list-style: none; }
        .finds li { padding: 8px 10px; font-size: 14px; font-weight: 600; background: var(--hc-pink, #E9A3B8); transform: rotate(-.6deg);
          box-shadow: 0 1px 1px rgba(0,0,0,.2), 0 4px 8px -5px rgba(0,0,0,.45); }
        .finds li:nth-child(even) { transform: rotate(.5deg); background: var(--hc-yellow, #F2B705); }
        .slips { margin-top: 4px; }
        .slip { display: grid; grid-template-columns: 104px 34px 1fr; gap: 4px 10px; align-items: center; padding: 9px 0; border-top: 2px dotted #B9B3A5; }
        .slip:first-child { border-top: 0; }
        .slip .when { font-size: 13px; font-weight: 700; line-height: 1.15; }
        .slip .when span { display: block; font-weight: 500; color: #4A4740; white-space: nowrap; }
        .mini { position: relative; width: 34px; aspect-ratio: 1.55; background: var(--hc-black, #141414); }
        .mini i { position: absolute; aspect-ratio: 1; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #8C877C; transform: translate(-50%, -50%); }
        .mini i.on { background: var(--hc-red, #D7301F); box-shadow: none; }
        .slip .what { font-size: 13px; font-weight: 600; line-height: 1.3; }
        .slip .what b { font-size: 15px; letter-spacing: -.01em; margin-right: 4px; }
        .slip .tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
        .slip .tag { display: inline-block; padding: 1px 6px; font-size: 12px; font-weight: 700; background: var(--hc-pink, #E9A3B8); }
        .slip .oven { display: inline-block; padding: 1px 6px; font-size: 12px; font-weight: 700; background: var(--hc-orange, #E8632B); color: var(--hc-paper, #F4F0E6); }
        .foot { margin-top: 10px; font-size: 12px; font-weight: 500; color: #4A4740; }
        .wait { padding: 24px 0; font-size: 14px; font-weight: 600; color: #4A4740; }
      </style>
      ${scatter("stove", 7)}
      <div class="paper card" style="container-type: inline-size">
        <div class="head"><h2>At the stove</h2>
          <div class="tabs" role="group" aria-label="Span">${Object.entries(KSPANS).map(([k, [, l]]) => `<button data-span="${k}" aria-pressed="${k === kitchenSpan}">${l}</button>`).join("")}</div>
        </div>
        <div id="body"><div class="wait">Reading the stove's record…</div></div>
      </div>`;
    this.shadowRoot.querySelectorAll("[data-span]").forEach((b) => b.addEventListener("click", () => { setKitchenSpan(b.dataset.span); this.syncTabs(); }));
  }

  draw() {
    const body = this.shadowRoot.getElementById("body");
    if (!body || !this._rec) return;
    const { rows: all, sessions, grid, first, rawFrom } = this._rec, span = this._span, days = kspanDays(span);
    const today = startOfDay(Date.now());
    const rows = all.slice(-days), before = all.slice(-days * 2, -days);
    const known = (rs) => rs.filter((r) => r.stove != null);
    const tot = (rs, f) => sum(known(rs).map(f));
    const total = tot(rows, (r) => r.stove), prevTotal = tot(before, (r) => r.stove);
    const prevFull = first != null && first <= (before[0] || {}).t;
    const nSessions = tot(rows, (r) => r.sessions);
    const ovensOf = (r) => sum(this._K.ovens.map((o) => r[o.key]));
    const cookMin = tot(rows, (r) => r.cooktop), ovenMin = tot(rows, ovensOf);
    // Buckets: days up to a month, weeks beyond.
    const byWeek = days > 31;
    const buckets = [];
    for (let i = byWeek ? rows.length % 7 : 0; i < rows.length; i += byWeek ? 7 : 1) {
      const part = rows.slice(i, i + (byWeek ? 7 : 1)), k = known(part);
      buckets.push({ t: part[0].t, end: part[part.length - 1].t, none: !k.length, cook: sum(k.map((r) => r.cooktop)), oven: sum(k.map(ovensOf)),
        stove: sum(k.map((r) => r.stove)), sessions: sum(k.map((r) => r.sessions)), heat: sum(k.map((r) => sum(Object.values(r.heat || {})))), partial: part.some((r) => r.t === today) });
    }
    // Cooktop and ovens side by side, over a paper column as tall as the bucket's time at the stove
    // (the two overlap when both are on), and the usual drawn against that column.
    const peak = Math.max(30, ...buckets.map((b) => b.stove));
    const done = buckets.filter((b) => !b.none && !b.partial);
    const usual = done.length >= 3 ? median(done.map((b) => b.stove)) : null;
    const usualHeat = done.length >= 3 ? median(done.map((b) => b.heat)) : null;
    const unit = byWeek ? "a week" : "a day";
    const g = buckets.length > 40 ? 2 : buckets.length > 20 ? 3 : 6;
    const bars = buckets.map((b, i) => `<div class="b ${b.none ? "none" : ""} ${this._sel === i ? "sel" : ""}" data-i="${i}">
      <i class="c" style="height:${((b.cook / peak) * 100).toFixed(1)}%"></i><i class="o" style="height:${((b.oven / peak) * 100).toFixed(1)}%"></i>${b.none ? "" : `<s style="height:${((b.stove / peak) * 100).toFixed(1)}%"></s>`}</div>`).join("");
    const usualLine = usual != null ? `<i class="usual" style="bottom:${Math.min(100, (Math.max(usual, 0) / peak) * 100).toFixed(1)}%"></i>` : "";
    // Ticks: weekdays for a week, dates for a month, months beyond.
    const ticks = [];
    buckets.forEach((b, i) => {
      const d = new Date(b.t), p = ((i + 0.5) / buckets.length) * 100;
      if (span === "week") ticks.push([p, DAYS[d.getDay()]]);
      else if (span === "month" && (i % 7 === 0)) ticks.push([p, `${d.getDate()} ${MONTHS[d.getMonth()]}`]);
      else if (byWeek && (i === 0 || new Date(buckets[i - 1].t).getMonth() !== d.getMonth()) && (span !== "year" || d.getMonth() % 2 === 0)) ticks.push([p, MONTHS[d.getMonth()]]);
    });
    // Rhythm: the busiest three hours, and weekend days against weekdays.
    const hours = Array.from({ length: 24 }, (_, h) => sum(grid.map((d) => d[h])));
    let bestH = 0, best = -1;
    for (let h = 0; h < 24; h++) { const v = hours[h] + hours[(h + 1) % 24] + hours[(h + 2) % 24]; if (v > best) { best = v; bestH = h; } }
    const gridTotal = sum(hours);
    const cellMax = Math.max(1, ...grid.flat());
    const dayRows = known(rows).filter((r) => r.t < today || r.t === today);
    const wk = (r) => [0, 6].includes(new Date(r.t).getDay());
    const avg = (rs) => (rs.length ? sum(rs.map((r) => r.stove)) / rs.length : null);
    const wkEnd = avg(dayRows.filter(wk)), wkDay = avg(dayRows.filter((r) => !wk(r)));
    // Findings, only those the record can back.
    const finds = [];
    const inSpan = sessions.filter((x) => x.a >= rows[0].t);
    if (gridTotal > 30) finds.push(`Most cooking happens between ${pad(bestH)}:00 and ${pad((bestH + 3) % 24)}:00 (${Math.round((best / gridTotal) * 100)}% of the time).`);
    if (wkEnd != null && wkDay != null && dayRows.filter(wk).length >= 2 && dayRows.filter((r) => !wk(r)).length >= 3 && Math.abs(wkEnd - wkDay) >= 10)
      finds.push(`Weekends ${mins(wkEnd)} a day at the stove, weekdays ${mins(wkDay)}.`);
    if (inSpan.length >= 3) {
      const withOven = inSpan.filter((x) => x.ovens.length).length;
      finds.push(`An oven joined ${withOven} of the last ${inSpan.length} sessions.`);
    }
    const lowBakes = inSpan.filter((x) => x.lowBake).length;
    if (lowBakes) finds.push(`${lowBakes === 1 ? "One low bake" : `${lowBakes} low bakes`} with nothing on the cooktop.`);
    const s0 = (x) => { const d = new Date(x.a); return d.toDateString() === new Date().toDateString() ? "Today" : `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
    const slip = (x) => `<div class="slip">
        <div class="when num">${s0(x)}<span>${hhmm(x.a)} · ${mins(x.on / 60000)}</span></div>
        <div class="mini" aria-hidden="true">${this._K.burners.map((b) => `<i class="${x.burners.some((u) => u.key === b.key) ? "on" : ""}" style="left:${b.x}%;top:${b.y}%;width:${b.r * 2}%"></i>`).join("")}</div>
        <div class="what num">${x.burners.length ? `<b>${x.burners.length === 1 ? x.burners[0].name : `${x.burners.length} burners`}</b>${x.burners.length > 1 ? esc(x.burners.map((u) => u.name.toLowerCase()).join(", ")) : ""}` : x.ovens.length ? "<b>Oven only</b>" : ""}
          ${x.ovens.length || x.lowBake || x.warmOnly ? `<span class="tags">${x.ovens.map((o) => `<span class="oven">${esc(o.name.replace(" oven", ""))} · ${esc(modesSaid(o.modes))} · ${mins(o.min)}</span>`).join("")}${x.lowBake ? `<span class="tag">Low bake</span>` : x.warmOnly ? `<span class="tag">Keeping warm</span>` : ""}</span>` : ""}</div>
      </div>`;
    const vs = prevFull && total + prevTotal > 0
      ? (Math.abs(total - prevTotal) < Math.max(10, prevTotal * 0.1) ? `About the same as ${KSPANS[span][3]}.` : `${mins(total - prevTotal)} ${total > prevTotal ? "more" : "less"} than ${KSPANS[span][3]}.`)
      : first ? `The record began ${dayName(first)}; it fills in from here.` : "";
    body.innerHTML = `
      <p class="lead num"><b>${minsSaid(total)}</b>at the stove ${KSPANS[span][2]}, over ${nSessions} ${nSessions === 1 ? "session" : "sessions"}: ${minsSaid(cookMin)} on the cooktop, ${minsSaid(ovenMin)} in the ovens.</p>
      ${vs ? `<p class="vs num">${esc(vs)}</p>` : ""}
      <div class="read num" id="read" role="status" aria-live="polite"></div>
      <div class="bars" id="bars" style="--g:${g}px" tabindex="0" role="group" aria-label="Time at the stove ${unit}, cooktop and ovens. Use the left and right arrow keys to read each ${byWeek ? "week" : "day"}.">${bars}${usualLine}</div>
      <div class="ticks num" aria-hidden="true">${ticks.map(([p, l], i) => `<span class="${p < 6 && i === 0 ? "first" : p > 94 ? "last" : ""}" style="left:${p.toFixed(1)}%">${l}</span>`).join("")}</div>
      <div class="key"><span><i style="background:var(--hc-red,#D7301F)"></i>Cooktop</span><span><i style="background:var(--hc-orange,#E8632B)"></i>Ovens</span><span><i style="background:#D9D2C1"></i>At the stove, either</span>
        ${usual != null ? `<span><i class="dash"></i>Usual, ${mins(usual)} ${unit}</span>` : ""}<span><i class="dot"></i>No record</span></div>
      <h3>When we cook</h3>
      <p class="say">${gridTotal ? "Each square is an hour of the week, sized by time at the stove." : "Nothing cooked yet in this span."}</p>
      <div class="grid num" role="img" aria-label="Minutes at the stove by weekday and hour">
        ${[1, 2, 3, 4, 5, 6, 0].map((d) => `<span class="d">${DAYS[d].slice(0, 2)}</span>${grid[d].map((m) => `<i>${m > 0.5 ? `<b style="--s:${(30 + 70 * Math.sqrt(m / cellMax)).toFixed(0)}%"></b>` : ""}</i>`).join("")}`).join("")}
        <span></span><div class="hrs">${[0, 6, 12, 18].map((h) => `<span style="left:${((h + 0.5) / 24) * 100}%">${pad(h)}</span>`).join("")}</div>
      </div>
      ${finds.length ? `<ul class="finds num">${finds.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
      <h3>Latest sessions</h3>
      <div class="slips">${sessions.slice(0, 8).map(slip).join("") || `<p class="say">No sessions in the last ten days.</p>`}</div>
      <p class="foot">A session is any use of the stove; breaks under 20 minutes don't split it. Sessions are kept for ten days (since ${dayName(rawFrom)}), the totals for good. Heat is the burners' power multiplied by time: good for comparing days, not a kWh reading.</p>`;
    this._usualHeat = usualHeat > 0 ? usualHeat : null;
    this.bindBars(buckets);
    this.readout(buckets[this._sel ?? buckets.length - 1], byWeek);
  }

  readout(b, byWeek) {
    const el = this.shadowRoot.getElementById("read");
    if (!el || !b) return;
    const today = startOfDay(Date.now());
    const day = byWeek ? `Week from ${dayName(b.t)}` : b.t === today ? `Today, ${dayName(b.t)}` : dayName(b.t);
    el.innerHTML = b.none ? `<span class="day">${day}</span><span>No record for these days.</span>`
      : `<span class="day">${day}</span><span><b>${minsSaid(b.stove)}</b>at the stove</span><span><b>${minsSaid(b.cook)}</b>cooktop</span><span><b>${minsSaid(b.oven)}</b>ovens</span><span><b>${b.sessions}</b>${b.sessions === 1 ? "session" : "sessions"}</span>${this._usualHeat ? `<span><b>${(b.heat / this._usualHeat).toFixed(1)}×</b>a usual ${byWeek ? "week" : "day"}'s cooktop heat</span>` : ""}`;
  }

  bindBars(buckets) {
    const bars = this.shadowRoot.getElementById("bars");
    const show = (i) => {
      this._sel = i;
      bars.querySelectorAll(".b.sel").forEach((x) => x.classList.remove("sel"));
      bars.querySelector(`.b[data-i="${i}"]`)?.classList.add("sel");
      this.readout(buckets[i], kspanDays(this._span) > 31);
    };
    const pick = (e) => { const r = bars.getBoundingClientRect(); show(Math.min(buckets.length - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * buckets.length)))); };
    bars.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") pick(e); });
    bars.addEventListener("pointerdown", pick);
    bars.addEventListener("keydown", (e) => {
      const i = this._sel ?? buckets.length - 1, to = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: buckets.length - 1 }[e.key];
      if (to == null) return;
      e.preventDefault(); show(Math.min(buckets.length - 1, Math.max(0, to)));
    });
  }
}

// ---------- doors: the doors' openings, hung under the weather ----------

// Door contacts (any binary_sensor that is "on" while open), the alarm's mode and the outside
// temperature. Each door has a colour and a limit: how many minutes it may stand open before its
// openings are marked (15 unless set). Ten days of raw history (the recorder's default) give each
// opening; for longer spans, the template sensors in examples/packages/collage_doors.yaml keep
// long-term statistics per door, named after its contact (binary_sensor.front_door gives
// sensor.front_door_open, sensor.front_door_opening_length and sensor.front_door_openings).
// Without them (statistics: false, or not installed) the record simply begins ten days back.
const DOOR_HUES = ["orange", "yellow", "red", "olive", "cobalt", "pink"];
function doorsOf(c) {
  const doors = (c.doors || []).map((x, i) => {
    const d = typeof x === "string" ? { entity: x } : x, obj = d.entity.split(".")[1];
    return { key: obj, name: d.name || null, hue: d.color || DOOR_HUES[i % DOOR_HUES.length], limit: d.limit ?? 15, i, id: d.entity,
      open: c.statistics === false ? null : `sensor.${obj}_open`, length: c.statistics === false ? null : `sensor.${obj}_opening_length`,
      count: c.statistics === false ? null : `sensor.${obj}_openings` };
  });
  // A weather entity as `outside` is read from its temperature attribute.
  const weather = c.weather || (c.outside && c.outside.startsWith("weather.") ? c.outside : null);
  const outside = c.outside && !c.outside.startsWith("weather.") ? c.outside : null;
  return { key: [...doors.map((d) => `${d.id}:${d.limit}`), outside, weather, c.alarm, c.armed, c.cold, c.statistics].join(","), doors, outside, weather,
    alarm: c.alarm || null, armed: c.armed || null, cold: c.cold,
    sensors: [].concat(c.sensors || []).map((x) => (typeof x === "string" ? { entity: x } : x)) };
}
// Names come from Home Assistant when the card doesn't give one.
const nameDoors = (D, hass) => D.doors.forEach((d) => { d.name = d.name || hass.states[d.id]?.attributes.friendly_name || said(d.key); });
// The house's temperature unit, and "cold" in it unless the card says: 12 °C or 54 °F.
let tempUnit = "°C";
const coldOf = (D) => D.cold ?? (tempUnit === "°F" ? 54 : 12);
// [days, tab, "in 7 days", "the 7 days before", bucket]: rolling spans, read in hours, days or weeks.
const DSPANS = { day: [1, "24 h", "in 24 hours", "the 24 hours before", "hour"], week: [7, "Week", "in 7 days", "the 7 days before", "day"],
  month: [30, "Month", "in 30 days", "the 30 days before", "day"], quarter: [91, "3 mo", "in 3 months", "the 3 months before", "week"],
  year: [364, "Year", "in a year", "the year before", "week"] };
// The span is shared by the door cards on a page: choose it on one, the others follow.
let doorSpan = "week";
const setDoorSpan = (k) => { doorSpan = k; window.dispatchEvent(new CustomEvent("collage-door-span", { detail: k })); };
// Days of record a span needs: itself and the span before, for the comparison.
const doorDays = (k) => (k === "day" ? 3 : Math.min(DSPANS[k][0] * 2, 728));
// "9 s" under a minute, "4 m", "1 h 12 m"; never split across lines.
const opened = (m) => (m <= 0 ? "0 m" : m < 1 ? `${Math.max(1, Math.round(m * 60))} s` : mins(m));
const doorWord = (d) => d.name.toLowerCase();
const tempSaid = (v) => `${Math.round(v)} ${tempUnit}`;

// The doors' record for the last `days` days: one row per day (openings, minutes open, the longest,
// per door; the outside temperature's low, mean and high; the share of the day armed), each
// opening in the raw history, and the outside temperature as a series of [t, degrees].
const doorCache = new Map();
function doorsRecord(hass, D, days) {
  const { doors: DOORS, outside: OUTSIDE, weather: WEATHER, alarm: ALARM, armed: ARMED } = D, COLD = coldOf(D);
  const key = `${D.key}|${days}`, hit = doorCache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60000) return hit.promise;
  const now = Date.now(), today = startOfDay(now), from = today - (days - 1) * 86400000, fromIso = new Date(from).toISOString();
  const statIds = [...DOORS.flatMap((d) => [d.open, d.length, d.count]), OUTSIDE, ARMED].filter(Boolean);
  const daily = statIds.length ? hass.callWS({ type: "recorder/statistics_during_period", start_time: fromIso, period: "day",
    statistic_ids: statIds, types: ["mean", "min", "max", "change"] }).catch(() => ({})) : Promise.resolve({});
  const hourly = days <= 62 && OUTSIDE ? hass.callWS({ type: "recorder/statistics_during_period", start_time: fromIso, period: "hour",
    statistic_ids: [OUTSIDE], types: ["mean"] }).catch(() => ({})) : Promise.resolve({});
  const raw = fetchHistory(hass, [...DOORS.map((d) => d.id), OUTSIDE, ALARM].filter(Boolean), 240).catch(() => ({}));
  const weather = WEATHER ? fetchHistory(hass, [WEATHER], 240, true).catch(() => ({})) : Promise.resolve({});
  const promise = Promise.all([daily, hourly, raw, weather]).then(([s, hs, h, w]) => {
    const tOf = (r) => (typeof r.start === "number" ? r.start : Date.parse(r.start));
    // The temperature: the weather entity's own history first (it may reach back further), then the sensor.
    const rawTemps = [...(w[WEATHER] || []).map((p) => [p.t, Number(p.a.temperature)]), ...(h[OUTSIDE] || []).map((p) => [p.t, Number(p.s)])]
      .filter(([, v]) => !isNaN(v)).sort((a, b) => a[0] - b[0]);
    const rawTempFrom = rawTemps.length ? rawTemps[0][0] : now;
    const statTemps = (hs[OUTSIDE] || []).map((r) => [tOf(r) + 1800000, r.mean]).filter(([t, v]) => v != null && t < rawTempFrom);
    const dayTemps = (s[OUTSIDE] || []).map((r) => [tOf(r) + 43200000, r.mean]).filter(([t, v]) => v != null && t < rawTempFrom);
    const temps = [...(days <= 62 ? statTemps : dayTemps), ...rawTemps];
    const tempAt = (t) => { let v = null; for (const [x, y] of temps) { if (x > t) break; v = y; } return v; };
    // Each opening: when, how long, still open, the temperature as it opened, past its limit.
    const firstAt = (id) => (h[id] && h[id][0] ? h[id][0].t : now);
    const rawFrom = Math.min(...DOORS.map((d) => firstAt(d.id)));
    const openings = [];
    for (const d of DOORS) {
      const p = h[d.id] || [];
      p.forEach((x, i) => {
        if (x.s !== "on" || (i && p[i - 1].s === "on")) return;
        let j = i + 1;
        while (j < p.length && p[j].s === "on") j++;
        const b = j < p.length ? p[j].t : now, min = (b - x.t) / 60000, temp = tempAt(x.t);
        openings.push({ door: d, a: x.t, b, min, now: j >= p.length, temp, cold: temp != null && temp < COLD, over: min >= d.limit });
      });
    }
    openings.sort((x, y) => x.a - y.a);
    // Each day: statistics, and raw history wherever it covers the day.
    const rows = Array.from({ length: days }, (_, i) => ({ t: from + i * 86400000, doors: null }));
    const at = (t) => rows[Math.round((startOfDay(t) - from) / 86400000)];
    const cell = (row) => (row.doors ||= Object.fromEntries(DOORS.map((d) => [d.key, { n: 0, min: 0, longest: 0 }])));
    for (const d of DOORS) {
      (s[d.count] || []).forEach((r) => { const row = at(tOf(r)); if (row && r.change != null) cell(row)[d.key].n = r.change; });
      (s[d.open] || []).forEach((r) => { const row = at(tOf(r)); if (row && r.mean != null) cell(row)[d.key].min = r.mean * 1440; });
      (s[d.length] || []).forEach((r) => { const row = at(tOf(r)); if (row && r.max != null) cell(row)[d.key].longest = r.max; });
    }
    (s[OUTSIDE] || []).forEach((r) => { const row = at(tOf(r)); if (row) Object.assign(row, { lo: r.min, hi: r.max }); });
    (s[ARMED] || []).forEach((r) => { const row = at(tOf(r)); if (row && r.mean != null) row.armed = r.mean; });
    const armedSpans = onSpans((h[ALARM] || []).filter((p) => !["unavailable", "unknown"].includes(p.s)), rawFrom, now, (x) => x.startsWith("armed") || x === "triggered");
    const alarmKnown = (h[ALARM] || []).some((p) => !["unavailable", "unknown"].includes(p.s));
    for (const row of rows) {
      if (row.t + 86400000 <= startOfDay(rawFrom)) continue;
      const a = Math.max(row.t, rawFrom), b = Math.min(row.t + 86400000, now);
      if (b <= a) continue;
      const doors = cell(row);
      for (const d of DOORS) {
        const mine = openings.filter((o) => o.door === d && o.b > a && o.a < b);
        doors[d.key] = { n: mine.filter((o) => o.a >= a).length, min: sum(mine.map((o) => (Math.min(o.b, b) - Math.max(o.a, a)) / 60000)), longest: Math.max(0, ...mine.map((o) => o.min)) };
      }
      const ts = rawTemps.filter(([t]) => t >= a && t < b).map(([, v]) => v);
      const start = tempAt(a);
      if (start != null) ts.push(start);
      if (ts.length) Object.assign(row, { lo: Math.min(...ts), hi: Math.max(...ts) });
      if (alarmKnown) row.armed = overlap(armedSpans, a, b) / (b - a);
      row.raw = true;
    }
    const first = rows.find((r) => r.doors);
    return { D, rows, openings, temps, rawFrom, first: first ? first.t : null };
  });
  doorCache.set(key, { at: Date.now(), promise });
  promise.catch(() => doorCache.delete(key));
  return promise;
}

// The buckets a span is read in: hours for 24 h, days up to a month, weeks beyond; each with its
// openings, minutes open and longest opening, per door and in all, and its temperatures.
function doorBuckets(rec, span) {
  const DOORS = rec.D.doors, now = Date.now(), unit = DSPANS[span][4];
  const out = [];
  const total = (b) => { b.n = sum(DOORS.map((d) => b.doors[d.key].n)); b.min = sum(DOORS.map((d) => b.doors[d.key].min)); b.top = DOORS.map((d) => ({ d, m: b.doors[d.key].longest })).sort((x, y) => y.m - x.m)[0]; return b; };
  if (unit === "hour") {
    const end = startOfHour(now) + 3600000;
    for (let a = end - 24 * 3600000; a < end; a += 3600000) {
      const b = a + 3600000, none = b <= rec.rawFrom;
      const doors = Object.fromEntries(DOORS.map((d) => {
        const mine = rec.openings.filter((o) => o.door === d && o.b > a && o.a < b);
        return [d.key, { n: mine.filter((o) => o.a >= a).length, min: sum(mine.map((o) => (Math.min(o.b, b) - Math.max(o.a, a)) / 60000)), longest: Math.max(0, ...mine.map((o) => o.min)) }];
      }));
      const ts = rec.temps.filter(([t]) => t >= a && t < b).map(([, v]) => v);
      out.push(total({ a, b, none, doors, lo: ts.length ? Math.min(...ts) : null, hi: ts.length ? Math.max(...ts) : null, partial: b > now }));
    }
    return out;
  }
  const days = DSPANS[span][0], rows = rec.rows.slice(-days), step = unit === "week" ? 7 : 1;
  for (let i = step === 7 ? rows.length % 7 : 0; i < rows.length; i += step) {
    const part = rows.slice(i, i + step), k = part.filter((r) => r.doors);
    const doors = Object.fromEntries(DOORS.map((d) => [d.key, { n: sum(k.map((r) => r.doors[d.key].n)), min: sum(k.map((r) => r.doors[d.key].min)), longest: Math.max(0, ...k.map((r) => r.doors[d.key].longest)) }]));
    const lo = k.map((r) => r.lo).filter((v) => v != null), hi = k.map((r) => r.hi).filter((v) => v != null);
    out.push(total({ a: part[0].t, b: part[part.length - 1].t + 86400000, none: !k.length, doors, lo: lo.length ? Math.min(...lo) : null, hi: hi.length ? Math.max(...hi) : null,
      partial: part[part.length - 1].t + 86400000 > now }));
  }
  return out;
}

// Doors: the outside temperature as one cobalt form along the top, a washing line under it, and
// every opening hanging from the line as a paper tab in its door's colour, as long as it stood open.
class CollageDoorsCard extends CollageCard {
  validate(c) { if (!c.doors || !c.doors.length) throw new Error("collage-doors-card needs doors: a list of door contacts"); this._D = doorsOf(c); return c; }
  watch() { return this._D.doors.map((d) => d.id); }
  getCardSize() { return this._config.log ? 8 : 10; }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  connectedCallback() {
    super.connectedCallback();
    this._onSpan = () => { if (this.shadowRoot.querySelector(".card")) this.syncTabs(); this._sel = null; this.load(); };
    window.addEventListener("collage-door-span", this._onSpan);
    this._ro = this._ro || new ResizeObserver(() => { if (this._rec) this.draw(); });
    this._ro.observe(this);
  }
  disconnectedCallback() { super.disconnectedCallback(); window.removeEventListener("collage-door-span", this._onSpan); this._ro && this._ro.disconnect(); }

  update(first) {
    tempUnit = this._hass.config.unit_system?.temperature || "°C";
    nameDoors(this._D, this._hass);
    if (!this.shadowRoot.querySelector(".card")) this.frame();
    if (!first) doorCache.clear();
    this.load();
  }
  syncTabs() { this.shadowRoot.querySelectorAll("[data-span]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.span === doorSpan)); }
  load() {
    const span = doorSpan;
    doorsRecord(this._hass, this._D, doorDays(span)).then((rec) => { if (span !== doorSpan) return; this._rec = rec; this._span = span; this.draw(); }).catch(() => {});
  }

  frame() {
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .card { padding: 14px 14px 16px; transform: rotate(-.3deg); }
        .head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 10px 12px; }
        h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
        .tabs button { padding: 7px 10px; }
        .lead { margin: 14px 0 0; font-size: 16px; font-weight: 600; line-height: 1.25; text-wrap: pretty; }
        .lead b { display: block; font-size: 42px; line-height: .9; letter-spacing: -.04em; margin-bottom: 4px; }
        .vs { margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #4A4740; }
        .read { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 12px; min-height: 52px; margin: 12px -4px 8px; padding: 8px 12px;
          background: var(--hc-black, #141414); color: var(--hc-paper, #F4F0E6); transform: rotate(.5deg);
          box-shadow: 0 1px 1px rgba(0,0,0,.25), 0 6px 12px -6px rgba(0,0,0,.55); font-size: 13px; font-weight: 600; }
        .read .day { flex-basis: 100%; font-size: 14px; font-weight: 700; }
        .read b { font-size: 18px; letter-spacing: -.02em; margin-right: 3px; }
        .plot { position: relative; touch-action: pan-y; outline: none; }
        .plot:focus-visible { outline: 3px solid var(--hc-yellow, #F2B705); outline-offset: 4px; }
        svg { display: block; overflow: visible; }
        .axis { font: 600 11px var(--hc-display, sans-serif); fill: #4A4740; }
        .axis.cold { font-weight: 700; fill: var(--hc-cobalt, #1F3D8C); }
        .sky { filter: drop-shadow(0 6px 6px rgba(0,0,0,.28)); }
        .tab { filter: drop-shadow(0 1px 1px rgba(0,0,0,.3)); }
        .key { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 8px; font-size: 12px; font-weight: 600; }
        .key i { display: inline-block; width: 14px; height: 8px; margin-right: 5px; }
        .key i.tab-k { width: 6px; height: 14px; vertical-align: -3px; }
        .key i.over { width: 6px; height: 14px; vertical-align: -3px; background: linear-gradient(var(--hc-orange, #E8632B) 60%, var(--hc-pink, #E9A3B8) 60%); }
        .key i.hollow { width: 6px; height: 14px; vertical-align: -3px; box-shadow: inset 0 0 0 2px var(--hc-black, #141414); }
        .key i.cold { height: 0; border-top: 2px dashed var(--hc-cobalt, #1F3D8C); vertical-align: 3px; }
        .key i.dot { height: 0; border-top: 2px dotted #8C877C; vertical-align: 3px; }
        h3 { margin: 18px 0 4px; font-size: 18px; font-weight: 700; letter-spacing: -.01em; }
        .say { margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #4A4740; text-wrap: pretty; }
        .finds { display: grid; gap: 6px; margin: 14px 0 0; padding: 0; list-style: none; }
        .finds li { padding: 8px 10px; font-size: 14px; font-weight: 600; background: var(--hc-pink, #E9A3B8); transform: rotate(-.6deg);
          box-shadow: 0 1px 1px rgba(0,0,0,.2), 0 4px 8px -5px rgba(0,0,0,.45); text-wrap: pretty; }
        .finds li:nth-child(even) { transform: rotate(.5deg); background: var(--hc-yellow, #F2B705); }
        .slip { display: grid; grid-template-columns: 92px 1fr auto; gap: 2px 10px; align-items: center; padding: 9px 0; border-top: 2px dotted #B9B3A5; }
        .slip:first-child { border-top: 0; }
        .slip .when { font-size: 13px; font-weight: 700; line-height: 1.15; }
        .slip .when span { display: block; font-weight: 500; color: #4A4740; white-space: nowrap; }
        .slip .who { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; letter-spacing: -.01em; }
        .slip .who i { flex: none; width: 8px; height: 26px; transform: rotate(-4deg); box-shadow: 0 1px 1px rgba(0,0,0,.3); }
        .slip .who i.now { background: transparent !important; box-shadow: inset 0 0 0 2px var(--c); }
        .slip .long { font-size: 16px; font-weight: 700; letter-spacing: -.02em; text-align: right; white-space: nowrap; }
        .slip .tags { grid-column: 2 / -1; display: flex; flex-wrap: wrap; gap: 4px; }
        .slip .tag { display: inline-block; padding: 1px 6px; font-size: 12px; font-weight: 700; background: #DDD6C6; }
        .slip .tag.cold { background: var(--hc-cobalt, #1F3D8C); color: var(--hc-paper, #F4F0E6); }
        .slip .tag.over { background: var(--hc-pink, #E9A3B8); }
        .foot { margin-top: 10px; font-size: 12px; font-weight: 500; color: #4A4740; text-wrap: pretty; }
        .wait { padding: 24px 0; font-size: 14px; font-weight: 600; color: #4A4740; }
      </style>
      ${scatter(this._config.log ? "door-log" : "doors", this._config.log ? 5 : 7, ["right", "bottom", "left"])}
      <div class="paper card" ${this._config.log ? 'style="transform: rotate(.5deg)"' : ""}>
        ${this._config.log ? `<h2>Latest openings</h2>` : `<div class="head"><h2>Doors</h2>
          <div class="tabs" role="group" aria-label="Span">${Object.entries(DSPANS).map(([k, [, l]]) => `<button data-span="${k}" aria-pressed="${k === doorSpan}">${l}</button>`).join("")}</div>
        </div>`}
  <div id="body"><div class="wait">Reading the doors' record…</div></div>
      </div>`;
    this.shadowRoot.querySelectorAll("[data-span]").forEach((b) => b.addEventListener("click", () => { setDoorSpan(b.dataset.span); this.syncTabs(); }));
  }

  draw() {
    const body = this.shadowRoot.getElementById("body");
    if (!body || !this._rec) return;
    const rec = this._rec, span = this._span, [days, , inSpan, before, unit] = DSPANS[span];
    const DOORS = this._D.doors, COLD = coldOf(this._D), hasTemp = rec.temps.length > 0;
    const buckets = doorBuckets(rec, span);
    const X0 = buckets[0].a, X1 = buckets[buckets.length - 1].b, now = Date.now();
    const raw = rec.openings.filter((o) => o.b > X0 && o.a < X1);
    const n = sum(buckets.map((b) => b.n)), open = sum(buckets.map((b) => b.min));
    // The span before, when the record covers all of it.
    let vs = "";
    if (span !== "day") {
      const prev = rec.rows.slice(-days * 2, -days), full = prev.length === days && prev.every((r) => r.doors);
      const pn = sum(prev.filter((r) => r.doors).map((r) => sum(DOORS.map((d) => r.doors[d.key].n))));
      if (full) vs = Math.abs(n - pn) <= Math.max(2, pn * 0.1) ? `About as many as ${before}.` : `${Math.abs(n - pn)} ${n > pn ? "more" : "fewer"} than ${before}.`;
    } else {
      const pn = rec.openings.filter((o) => o.a >= X0 - 86400000 && o.a < X0).length;
      if (rec.rawFrom <= X0 - 86400000) vs = Math.abs(n - pn) <= Math.max(2, pn * 0.1) ? `About as many as ${before}.` : `${Math.abs(n - pn)} ${n > pn ? "more" : "fewer"} than ${before}.`;
    }
    if (!vs && rec.first) vs = `The record began ${dayName(rec.first)}; it fills in from here.`;
    // The longest opening: from the raw record where it reaches, the daily maxima beyond.
    const rawTop = [...raw].sort((x, y) => y.min - x.min)[0];
    const bTop = buckets.filter((b) => b.top && b.top.m > 0).sort((x, y) => y.top.m - x.top.m)[0];
    const longest = rawTop && (!bTop || rawTop.min >= bTop.top.m - 0.05)
      ? `The longest: the ${doorWord(rawTop.door)}, ${opened(rawTop.min)}${rawTop.now ? " so far" : ""}, ${startOfDay(rawTop.a) === startOfDay(now) ? "today" : dayName(rawTop.a)} at ${hhmm(rawTop.a)}${rawTop.temp != null ? ` (${tempSaid(rawTop.temp)} outside)` : ""}.`
      : bTop ? `The longest: the ${doorWord(bTop.top.d)}, ${opened(bTop.top.m)}, ${unit === "week" ? `the week from ${dayName(bTop.a)}` : dayName(bTop.a)}.` : "";
    const lead = n ? `<b>${n} ${n === 1 ? "opening" : "openings"}</b>${inSpan}, open ${opened(open)} in all. ${esc(longest)}`
      : buckets.every((b) => b.none) ? `<b>No record</b>${inSpan} yet.` : `<b>No openings</b>${inSpan}. Every door stayed shut.`;

    // The picture, drawn at the measured width.
    const plotEl = this.shadowRoot.getElementById("plot");
    const W = Math.max(260, Math.round((plotEl ? plotEl.clientWidth : 0) || this.clientWidth - 28 || 320));
    const G = 30, TOP = 8, LINE = 104, DROP = 84, H = LINE + DROP + 30;
    const x = (t) => G + ((Math.min(Math.max(t, X0), X1) - X0) / (X1 - X0)) * (W - G);
    // The weather: the temperature as one form standing on the line, with a dashed cold line at 12 °C.
    const pts = rec.temps.filter(([t], i, a) => (t >= X0 || (a[i + 1] && a[i + 1][0] > X0)) && t <= X1);
    if (pts.length) pts.push([Math.min(now, X1), pts[pts.length - 1][1]]);
    const vals = pts.map(([, v]) => v);
    const lo = Math.floor(Math.min(COLD, ...vals) - 1), hi = Math.ceil(Math.max(COLD, ...vals) + 1);
    const y = (v) => TOP + (1 - (v - lo) / (hi - lo)) * (LINE - 10 - TOP);
    let sky = "";
    if (pts.length >= 2) {
      const t0 = Math.max(X0, pts[0][0]), t1 = Math.min(now, X1), stepT = Math.max((X1 - X0) / 60, 1800000);
      const samples = [[x(t0), LINE]];
      for (let t = t0, i = 0; t <= t1; t += stepT) {
        while (i + 1 < pts.length && pts[i + 1][0] <= t) i++;
        samples.push([x(t), y(pts[i][1])]);
      }
      samples.push([x(t1), y(pts[pts.length - 1][1])], [x(t1), LINE]);
      sky = `<path class="sky" d="${smoothPath(samples)} Z" fill="var(--hc-cobalt, #1F3D8C)"/>`;
    }
    const yc = y(COLD);
    // The tabs: each opening for a day or a week; beyond, each door's longest per day or week.
    const r = rng(`doors-${span}`);
    // Square-root scale, an hour or more at full length, so a 3-minute opening still reads.
    const len = (m) => 8 + (DROP - 12) * Math.sqrt(Math.min(m, 60) / 60);
    const fill = (d) => colour(d.hue);
    let tabs = [];
    if (span === "day" || span === "week") {
      const w = span === "day" ? Math.max(4, (W - G) / 120) : Math.max(3, (W - G) / 220);
      tabs = raw.map((o) => ({ d: o.door, cx: x(o.a) + w / 2, w, m: o.min, now: o.now, over: o.over }));
    } else {
      const bw = (W - G) / buckets.length, slots = DOORS.length + 1, w = Math.max(2, Math.min(9, bw / slots));
      buckets.forEach((b) => DOORS.forEach((d) => {
        const c = b.doors[d.key];
        if (c.n || c.longest) tabs.push({ d, cx: x(b.a) + bw * ((d.i + 0.75) / slots), w, m: c.longest, now: false, over: c.longest >= d.limit });
      }));
    }
    const tabSvg = tabs.map((t) => {
      const l = len(t.m), rot = (r() * 6 - 3).toFixed(1), xL = (t.cx - t.w / 2).toFixed(1);
      const body = t.now
        ? `<rect x="${(t.cx - t.w / 2 + 1).toFixed(1)}" y="${LINE + 3}" width="${Math.max(1, t.w - 2).toFixed(1)}" height="${(l - 1).toFixed(1)}" fill="var(--hc-paper,#F4F0E6)" stroke="${fill(t.d)}" stroke-width="2"/>`
        : `<rect x="${xL}" y="${LINE + 2}" width="${t.w.toFixed(1)}" height="${l.toFixed(1)}" fill="${fill(t.d)}"/>`;
      const tip = t.over ? `<rect x="${xL}" y="${(LINE + 2 + l - Math.min(10, l * 0.4)).toFixed(1)}" width="${t.w.toFixed(1)}" height="${Math.min(10, l * 0.4).toFixed(1)}" fill="var(--hc-pink,#E9A3B8)"/>` : "";
      return `<g class="tab" transform="rotate(${rot} ${t.cx.toFixed(1)} ${LINE + 2})">${body}${tip}</g>`;
    }).join("");
    // No record: a dotted line where the tabs would hang.
    const gaps = buckets.filter((b) => b.none).map((b) => `<line x1="${x(b.a).toFixed(1)}" x2="${x(b.b).toFixed(1)}" y1="${LINE + 14}" y2="${LINE + 14}" stroke="#B9B3A5" stroke-width="2" stroke-dasharray="2 4"/>`).join("");
    // Ticks: every six hours for a day, weekdays for a week, dates for a month, months beyond.
    const ticks = [];
    buckets.forEach((b, i) => {
      const d = new Date(b.a), p = x(b.a + (b.b - b.a) / 2);
      if (span === "day" && d.getHours() % 6 === 0) ticks.push([x(b.a), `${pad(d.getHours())}:00`]);
      else if (span === "week") ticks.push([p, i === buckets.length - 1 ? "Today" : DAYS[d.getDay()]]);
      else if (span === "month" && i % 7 === buckets.length % 7) ticks.push([p, `${d.getDate()} ${MONTHS[d.getMonth()]}`]);
      else if (unit === "week" && (i === 0 || new Date(buckets[i - 1].a).getMonth() !== d.getMonth()) && (span !== "year" || d.getMonth() % 2 === 0)) ticks.push([p, MONTHS[d.getMonth()]]);
    });
    if (span === "day") ticks.push([x(now), "now"]);
    const tickSvg = ticks.map(([p, l]) => `<text class="axis" x="${p.toFixed(1)}" y="${H - 4}" text-anchor="${p < G + 14 ? "start" : p > W - 14 ? "end" : "middle"}">${l}</text>`).join("");
    const sel = this._sel ?? buckets.length - 1;
    const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" class="num" aria-hidden="true">
      ${sky}
      ${hasTemp ? `<line x1="${G}" x2="${W}" y1="${yc.toFixed(1)}" y2="${yc.toFixed(1)}" stroke="var(--hc-paper,#F4F0E6)" stroke-width="2"/>
      <line x1="${G}" x2="${W}" y1="${yc.toFixed(1)}" y2="${yc.toFixed(1)}" stroke="var(--hc-cobalt,#1F3D8C)" stroke-width="2" stroke-dasharray="5 4"/>
      <text class="axis cold" x="0" y="${(yc + 4).toFixed(1)}">${COLD}°</text>
      ${Math.abs(y(hi) - yc) > 14 ? `<text class="axis" x="0" y="${(y(hi) + 4).toFixed(1)}">${hi}°</text>` : ""}
      ${Math.abs(y(lo) - yc) > 14 ? `<text class="axis" x="0" y="${(y(lo) + 4).toFixed(1)}">${lo}°</text>` : ""}` : ""}
      ${gaps}${tabSvg}
      <rect x="${G - 4}" y="${LINE - 2}" width="${W - G + 8}" height="5" fill="var(--hc-black,#141414)" transform="rotate(-.3 ${W / 2} ${LINE})"/>
      <rect id="hl" x="${x(buckets[sel].a).toFixed(1)}" y="${TOP - 4}" width="${Math.max(3, x(buckets[sel].b) - x(buckets[sel].a)).toFixed(1)}" height="${LINE + DROP - TOP + 6}" fill="none" stroke="var(--hc-black,#141414)" stroke-width="2"/>
      ${tickSvg}
    </svg>`;

    // Findings, only what the record backs. Openings from raw history reach ten days back.
    const finds = [];
    const tenDays = X0 < rec.rawFrom || days > 10 ? " in the last ten days" : "";
    if (n >= 8) {
      const byDoor = DOORS.map((d) => ({ d, n: sum(buckets.map((b) => b.doors[d.key].n)) })).sort((a, b) => b.n - a.n)[0];
      finds.push(`The ${doorWord(byDoor.d)} takes ${Math.round((byDoor.n / n) * 100)}% of the openings.`);
    }
    if (raw.length >= 12) {
      const hrs = new Array(24).fill(0);
      raw.forEach((o) => hrs[new Date(o.a).getHours()]++);
      let bestH = 0, best = -1;
      for (let hh = 0; hh < 24; hh++) { const v = hrs[hh] + hrs[(hh + 1) % 24] + hrs[(hh + 2) % 24]; if (v > best) { best = v; bestH = hh; } }
      finds.push(`Most comings and goings are between ${pad(bestH)}:00 and ${pad((bestH + 3) % 24)}:00 (${Math.round((best / raw.length) * 100)}% of openings${tenDays}).`);
    }
    const coldMin = sum(raw.filter((o) => o.cold).map((o) => (Math.min(o.b, X1) - Math.max(o.a, X0)) / 60000));
    if (coldMin >= 5) finds.push(`Under ${COLD} ${tempUnit} outside, doors stood open ${opened(coldMin)} in all${tenDays}.`);
    const past = DOORS.map((d) => ({ d, n: raw.filter((o) => o.door.key === d.key && o.over).length })).filter((x) => x.n);
    if (past.length) finds.push(`Open past their limit${tenDays}: ${past.map((x) => `the ${doorWord(x.d)} ${x.n === 1 ? "once" : `${x.n} times`}`).join(", ")}.`);
    // The latest openings, newest first.
    const when = (t) => (startOfDay(t) === startOfDay(now) ? "Today" : startOfDay(t) === startOfDay(now) - 86400000 ? "Yesterday" : dayName(t));
    const slip = (o) => `<div class="slip">
        <div class="when num">${when(o.a)}<span>${hhmm(o.a)}${o.now || hhmm(o.a) === hhmm(o.b) ? "" : ` – ${hhmm(o.b)}`}</span></div>
        <div class="who"><i class="${o.now ? "now" : ""}" style="background:${fill(o.door)};--c:${fill(o.door)}"></i>${esc(o.door.name)}</div>
        <div class="long num">${o.now ? "open " : ""}${opened(o.min)}</div>
        ${o.cold || o.over || o.temp != null ? `<div class="tags num">${o.temp != null ? `<span class="tag ${o.cold ? "cold" : ""}">${tempSaid(o.temp)}${o.cold ? ", cold" : ""}</span>` : ""}${o.over ? `<span class="tag over">Past ${o.door.limit} min</span>` : ""}</div>` : ""}
      </div>`;
    const latest = [...rec.openings].reverse().slice(0, 10);
    if (this._config.log) {
      body.innerHTML = `<div class="slips" style="margin-top:8px">${latest.map(slip).join("") || `<p class="say">No openings in the last ten days.</p>`}</div>
      <p class="foot">An opening lasts from when a door's contact parts until it closes again. Each one is kept as long as the recorder keeps history (since ${dayName(rec.rawFrom)})${this._D.doors[0].open ? "; the totals and each day's longest, for good" : ""}.</p>`;
      return;
    }
    body.innerHTML = `
      <p class="lead num">${lead}</p>
      ${vs ? `<p class="vs num">${esc(vs)}</p>` : ""}
      <div class="read num" id="read" role="status" aria-live="polite"></div>
      <div class="plot" id="plot" tabindex="0" role="group" aria-label="Openings ${inSpan} hung under the outside temperature. Use the left and right arrow keys to read each ${unit}.">${svg}</div>
      <div class="key">${DOORS.map((d) => `<span><i class="tab-k" style="background:${fill(d)}"></i>${esc(d.name)}</span>`).join("")}
        <span><i class="over"></i>Open past its limit</span>${span === "day" || span === "week" ? `<span><i class="hollow"></i>Open now</span>` : ""}
        ${hasTemp ? `<span><i style="background:var(--hc-cobalt,#1F3D8C)"></i>Outside</span><span><i class="cold"></i>${COLD} ${tempUnit}</span>` : ""}<span><i class="dot"></i>No record</span></div>
      <p class="say" style="margin-top:6px">${span === "day" || span === "week" ? "Each tab is one opening, hung where it began and as long as the door stood open." : `Each tab is a door's longest opening that ${unit}.`} Pink tips: open past the door's limit (${esc(DOORS.map((d) => `${d.name} ${d.limit} min`).join(", "))}).</p>
      ${finds.length ? `<ul class="finds num">${finds.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
`;
    this.bindPlot(buckets, { x, X0, X1, W, G });
    this.readout(buckets[sel], unit);
  }

  readout(b, unit) {
    const el = this.shadowRoot.getElementById("read");
    if (!el || !b) return;
    const now = Date.now();
    const day = unit === "hour" ? `${startOfDay(b.a) === startOfDay(now) ? "Today" : DAYS[new Date(b.a).getDay()]} ${hhmm(b.a)} – ${hhmm(b.b)}`
      : unit === "week" ? `Week from ${dayName(b.a)}` : startOfDay(b.a) === startOfDay(now) ? `Today, ${dayName(b.a)}` : dayName(b.a);
    const temp = b.lo != null ? (Math.round(b.lo) === Math.round(b.hi) ? tempSaid(b.lo) : `${Math.round(b.lo)}–${tempSaid(b.hi)}`) : null;
    el.innerHTML = b.none ? `<span class="day">${day}</span><span>No record for this ${unit}.</span>`
      : `<span class="day">${day}</span><span><b>${b.n}</b>${b.n === 1 ? "opening" : "openings"}</span><span><b>${opened(b.min)}</b>open</span>${b.top && b.top.m > 0 ? `<span><b>${opened(b.top.m)}</b>longest, ${esc(doorWord(b.top.d))}</span>` : ""}${temp ? `<span><b>${temp}</b>outside</span>` : ""}`;
  }

  bindPlot(buckets, { x, W }) {
    const plot = this.shadowRoot.getElementById("plot"), hl = plot.querySelector("#hl"), unit = DSPANS[this._span][4];
    const show = (i) => {
      this._sel = i;
      hl.setAttribute("x", x(buckets[i].a).toFixed(1));
      hl.setAttribute("width", Math.max(3, x(buckets[i].b) - x(buckets[i].a)).toFixed(1));
      this.readout(buckets[i], unit);
    };
    const pick = (e) => {
      const r = plot.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W;
      const i = buckets.findIndex((b) => px >= x(b.a) && px < x(b.b));
      if (i >= 0) show(i);
    };
    plot.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") pick(e); });
    plot.addEventListener("pointerdown", pick);
    plot.addEventListener("keydown", (e) => {
      const i = this._sel ?? buckets.length - 1, to = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: buckets.length - 1 }[e.key];
      if (to == null) return;
      e.preventDefault(); show(Math.min(buckets.length - 1, Math.max(0, to)));
    });
  }
}

// The doors as they are now: paper doors, swung open in their colour when open, each with its
// openings, time open and longest in the span; the alarm's mode and any other sensors (a leak or
// freeze sensor, say) as tags. Observe only: nothing here arms or disarms.
// A sensor tag: { entity, name, on: "Wet!", off: "Dry", alert: error | warn } ("on" is the alarm).
class CollageDoorsNowCard extends CollageCard {
  validate(c) { if (!c.doors || !c.doors.length) throw new Error("collage-doors-now-card needs doors: a list of door contacts"); this._D = doorsOf(c); return { name: "The doors", ...c }; }
  watch() { const D = this._D; return [...D.doors.map((d) => d.id), D.alarm, ...D.sensors.map((x) => x.entity)].filter(Boolean); }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  connectedCallback() {
    super.connectedCallback();
    this._onSpan = () => this.load();
    window.addEventListener("collage-door-span", this._onSpan);
    clearInterval(this._tick);
    // Open doors count their minutes.
    this._tick = setInterval(() => { if (this._D.doors.some((d) => this.st(d.id)?.state === "on")) this.draw(); }, 30000);
  }
  disconnectedCallback() { super.disconnectedCallback(); window.removeEventListener("collage-door-span", this._onSpan); clearInterval(this._tick); }
  update() { tempUnit = this._hass.config.unit_system?.temperature || "°C"; nameDoors(this._D, this._hass); this.draw(); this.load(); }
  load() {
    const span = doorSpan;
    doorsRecord(this._hass, this._D, doorDays(span)).then((rec) => { if (span === doorSpan) { this._rec = rec; this._span = span; this.draw(); } }).catch(() => {});
  }

  draw() {
    if (!this._hass) return;
    const focusKey = this.shadowRoot.activeElement?.dataset?.focus;
    const st = (id) => this.st(id)?.state;
    const D = this._D, DOORS = D.doors, ALARM = D.alarm;
    const away = DOORS.every((d) => ["unavailable", undefined].includes(st(d.id)));
    const openNow = DOORS.filter((d) => st(d.id) === "on");
    const since = (d) => { const s = this.st(d.id); return s ? Date.parse(s.last_changed) : Date.now(); };
    const line = away ? "The door sensors aren't answering." : !openNow.length ? (DOORS.length === 1 ? `The ${doorWord(DOORS[0])} is shut.` : "Every door is shut.")
      : `${openNow.map((d, i) => `${i ? "the" : "The"} ${doorWord(d)}${openNow.length === 1 ? " is" : ""} open, ${opened((Date.now() - since(d)) / 60000)}`).join("; ")}${openNow.length > 1 ? "." : "."}`;
    // Each door's figures for the span.
    const span = this._span, rec = this._rec;
    const fig = (d) => {
      if (!rec) return null;
      const bs = doorBuckets(rec, span);
      if (bs.every((b) => b.none)) return null;
      return { n: sum(bs.map((b) => b.doors[d.key].n)), min: sum(bs.map((b) => b.doors[d.key].min)), longest: Math.max(0, ...bs.map((b) => b.doors[d.key].longest)) };
    };
    const door = (d) => {
      const s = st(d.id), on = s === "on", dead = s === "unavailable" || s == null, f = fig(d);
      const state = dead ? "Not answering" : on ? `Open, ${opened((Date.now() - since(d)) / 60000)}` : `Shut, ${ago(since(d))}`;
      return `<button class="door ${on ? "on" : ""} ${dead ? "dead" : ""}" data-more="${d.id}" data-focus="${d.key}" style="--c:${colour(d.hue)};--ink:${["yellow", "pink"].includes(d.hue) ? "var(--hc-black,#141414)" : "var(--hc-paper,#F4F0E6)"}"
          aria-label="${esc(d.name)}: ${esc(state)}.${f ? ` ${f.n} openings ${DSPANS[span][2]}, open ${esc(opened(f.min))}, longest ${esc(opened(f.longest))}.` : ""} Open its history.">
        <span class="frame" aria-hidden="true"><span class="leaf"><i class="band"></i><i class="knob"></i></span>${on ? form(d.i + 1, colour(d.i % 2 ? "cobalt" : "yellow"), `form ${this._was && this._was[d.key] === false ? "lay" : ""}`) : ""}</span>
        <span class="name">${esc(d.name)}</span>
        <span class="state num">${esc(state)}</span>
        ${f ? `<span class="figs num"><span><b>${f.n}</b>${f.n === 1 ? "opening" : "openings"}</span><span><b>${opened(f.min)}</b>open</span><span><b>${f.longest ? opened(f.longest) : "–"}</b>longest</span></span>` : `<span class="figs none">No record yet</span>`}
      </button>`;
    };
    // The alarm, and any other sensors.
    const a = ALARM && st(ALARM);
    const alarmSaid = { disarmed: "Disarmed", armed_home: "Armed, home", armed_away: "Armed, away", armed_night: "Armed, night", armed_vacation: "Armed, away", armed_custom_bypass: "Armed", arming: "Arming",
      disarming: "Disarming", pending: "Entry delay", triggered: "Triggered" }[a] || (!a || a === "unavailable" || a === "unknown" ? "Not answering" : said(a));
    const alarmCls = a === "triggered" ? "err" : a && a.startsWith("armed") ? "armed" : !a || a === "unavailable" ? "warn" : "";
    const rows = rec ? rec.rows.slice(-DSPANS[span][0]).filter((r) => r.armed != null) : [];
    const armedShare = rows.length ? sum(rows.map((r) => r.armed)) / rows.length : null;
    const tags = [
      ALARM ? `<button class="tag ${alarmCls}" data-more="${ALARM}" data-focus="alarm"><small>Alarm</small>${alarmSaid}</button>` : "",
      ...D.sensors.map((x, i) => {
        const v = st(x.entity), name = x.name || this.st(x.entity)?.attributes.friendly_name || x.entity;
        return `<button class="tag ${v === "on" ? (x.alert === "warn" ? "warn" : "err") : v === "off" ? "" : "warn"}" data-more="${x.entity}" data-focus="s-${i}"><small>${esc(name)}</small>${esc(v === "on" ? x.on || "On" : v === "off" ? x.off || "Off" : "Not answering")}</button>`;
      }),
    ].filter(Boolean);
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .card { padding: 14px 14px 16px; transform: rotate(.4deg); }
        h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
        .sub { margin-top: 5px; font-size: 14px; font-weight: 600; min-height: 17px; text-wrap: pretty; }
        .doors { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px 12px; margin-top: 16px; }
        @container (min-width: 560px) { .doors { grid-template-columns: repeat(3, 1fr); } }
        @container (min-width: 900px) { .doors { grid-template-columns: repeat(5, 1fr); } }
        .door { position: relative; display: grid; grid-template-columns: 58px 1fr; grid-template-rows: auto auto 1fr; column-gap: 10px; row-gap: 2px;
          align-items: start; padding: 0; background: none; text-align: left; min-height: 44px; }
        .door > .frame { grid-row: 1 / span 3; }
        .door > .figs { grid-column: 2; }
        .door:hover .leaf { filter: brightness(.97); }
        /* The doorway is ink; the leaf is paper with a band of the door's colour, swung open when it is open. */
        .frame { position: relative; display: block; width: 58px; aspect-ratio: .58; margin: 2px 0 6px; background: var(--hc-black, #141414); perspective: 420px;
          box-shadow: 0 1px 1px rgba(0,0,0,.28), 0 8px 14px -8px rgba(0,0,0,.5); }
        .leaf { position: absolute; inset: 3px; display: block; background: var(--hc-paper, #F4F0E6); transform-origin: left center;
          box-shadow: 0 1px 1px rgba(0,0,0,.3); transition: transform .5s cubic-bezier(.16,1,.3,1), background .3s; }
        .leaf::before { content: ""; position: absolute; inset: 0; opacity: .3; background: radial-gradient(var(--c) 26%, transparent 30%) 0 0 / 5px 5px; }
        .band { position: absolute; left: -3px; right: 8px; top: 10%; height: 13%; background: var(--c); transform: rotate(-2deg); box-shadow: 0 1px 1px rgba(0,0,0,.25); }
        .knob { position: absolute; right: 12%; top: 54%; width: 13%; aspect-ratio: 1; border-radius: 50%; background: var(--hc-black, #141414); }
        .door.on .leaf { background: var(--c); transform: rotateY(-38deg); }
        .door.on .leaf::before { opacity: 0; }
        .door.on .band { background: var(--ink); opacity: .9; }
        .door.dead .frame { filter: grayscale(1); opacity: .55; }
        .frame .form { width: 70%; left: -30%; top: -18%; z-index: 3; transform: rotate(-14deg); filter: drop-shadow(0 6px 8px rgba(0,0,0,.4)); }
        .name { font-size: 16px; font-weight: 700; letter-spacing: -.01em; line-height: 1.05; }
        .state { font-size: 13px; font-weight: 600; color: #4A4740; }
        .door.on .state { color: var(--hc-black, #141414); font-weight: 700; }
        .figs { display: grid; gap: 0; margin-top: 4px; font-size: 12px; font-weight: 600; }
        .figs b { font-size: 16px; letter-spacing: -.02em; margin-right: 4px; }
        .figs.none { color: #8C877C; }
        .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
        .tag { display: inline-flex; flex-direction: column; justify-content: center; min-height: 44px; padding: 6px 10px; font-size: 16px; font-weight: 700; letter-spacing: -.01em;
          background: var(--hc-black, #141414); color: var(--hc-paper, #F4F0E6); text-align: left; box-shadow: 0 1px 1px rgba(0,0,0,.25), 0 4px 8px -4px rgba(0,0,0,.5); }
        .tag:nth-child(2) { transform: rotate(-1deg); } .tag:nth-child(3) { transform: rotate(.8deg); }
        .tag small { font-size: 11px; font-weight: 600; letter-spacing: .02em; opacity: .85; }
        .tag.armed { background: var(--hc-cobalt, #1F3D8C); }
        .tag.warn { background: var(--hc-pink, #E9A3B8); color: var(--hc-black, #141414); }
        .tag.err { background: var(--hc-red, #D7301F); }
        .share { margin: 10px 0 0; font-size: 13px; font-weight: 600; color: #4A4740; }
      </style>
      ${scatter("doors-now", 6, ["left", "top", "right"])}
      <div class="paper card" style="container-type: inline-size">
        <h2>${esc(this._config.name)}</h2><div class="sub num" role="status">${esc(line)}</div>
        <div class="doors">${DOORS.map(door).join("")}</div>
        ${tags.length ? `<div class="tags">${tags.join("")}</div>` : ""}
        ${armedShare != null ? `<p class="share num">The alarm was armed ${Math.round(armedShare * 100)}% of the time ${DSPANS[span][2]}.</p>` : ""}
      </div>`;
    this._was = Object.fromEntries(DOORS.map((d) => [d.key, st(d.id) === "on"]));
    const sr = this.shadowRoot;
    sr.querySelectorAll("[data-more]").forEach((b) => b.addEventListener("click", () => this.moreInfo(b.dataset.more)));
    if (focusKey) sr.querySelector(`[data-focus="${focusKey}"]`)?.focus();
  }
}


// ---------- shared by the cards below ----------

// Ink for type on a paper colour: black on light papers, paper on dark ones (The Ink Follows Paper Rule).
const inkOn = (c) => (["yellow", "pink", "paper"].includes(c) ? "var(--hc-black, #141414)" : "var(--hc-paper, #F4F0E6)");
const notFound = (what) => `<style>${MATERIAL}</style><div class="paper" style="padding:14px;font-weight:600">${esc(what)} is not found</div>`;
const away = (s) => !s || s.state === "unavailable" || s.state === "unknown";
const seededTilt = (seed, spread = 2) => { const r = rng(seed); return +(r() * spread * 2 - spread).toFixed(1); };

// ---------- sensor: one reading, its day as one cut form ----------

// Any numeric sensor: the reading on a patch of its colour, and the last `hours` as one cut-paper
// form averaged over short spans, with the low, the high and the usual (the span's median, dashed).
// A sensor that isn't a number shows its state in words.
class CollageSensorCard extends CollageCard {
  validate(c) {
    if (!c.entity) throw new Error("collage-sensor-card needs an entity");
    return { color: "cobalt", hours: 24, tilt: seededTilt(c.entity, 1.4), ...c };
  }
  watch() { return [this._config.entity]; }
  getGridOptions() { return { columns: 6, rows: "auto", min_columns: 3 }; }
  connectedCallback() {
    super.connectedCallback();
    this._ro = this._ro || new ResizeObserver(() => { if (this._pts) this.draw(); });
    this._ro.observe(this);
  }
  disconnectedCallback() { super.disconnectedCallback(); this._ro && this._ro.disconnect(); }

  fmt(v) {
    const d = this._config.decimals ?? (Math.abs(v) >= 100 ? 0 : 1);
    return Number(v).toFixed(d);
  }

  update(reloadHistory) {
    const c = this._config, s = this.st(c.entity);
    if (!s) { this.shadowRoot.innerHTML = notFound(c.name || c.entity); return; }
    const v = Number(s.state), numeric = s.state !== "" && !isNaN(v);
    const unit = c.unit ?? s.attributes.unit_of_measurement ?? "";
    const name = c.name || s.attributes.friendly_name || c.entity;
    const paperC = colour(c.color), ink = inkOn(c.color);
    const line = away(s) ? "Not answering" : `Updated ${ago(new Date(s.last_updated || s.last_changed))}`;
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .card { padding: 14px 14px 12px; transform: rotate(${c.tilt}deg); container-type: inline-size; }
        h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: .95; }
        .sub { margin-top: 4px; font-size: 13px; font-weight: 500; color: #4A4740; }
        .patch { display: inline-block; margin: 12px 0 4px -4px; padding: 6px 14px 4px 10px; background: ${paperC}; color: ${ink};
          transform: rotate(-1.5deg); box-shadow: 0 1px 1px rgba(0,0,0,.3), 0 10px 20px -8px rgba(0,0,0,.6); }
        .patch b { font-size: 56px; font-weight: 700; line-height: .86; letter-spacing: -.05em; }
        .patch small { margin-left: 4px; font-size: 20px; font-weight: 700; letter-spacing: -.01em; }
        .word { font-size: 34px; font-weight: 700; letter-spacing: -.03em; line-height: 1; }
        .plot { margin-top: 10px; min-height: 120px; }
        svg { display: block; overflow: visible; }
        .axis { font: 600 11px var(--hc-display, sans-serif); fill: #4A4740; }
        .shape { filter: drop-shadow(0 6px 6px rgba(0,0,0,.28)); }
        .figs { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 8px; font-size: 12px; font-weight: 600; }
        .figs b { display: block; font-size: 18px; letter-spacing: -.02em; }
        .figs i { display: inline-block; width: 14px; height: 0; margin-right: 5px; border-top: 2px dashed var(--hc-black, #141414); vertical-align: 3px; }
        .away { filter: grayscale(1); }
      </style>
      ${scatter(c.entity, 5)}
      <div class="paper card press ${away(s) ? "away" : ""}" role="button" tabindex="0" aria-label="${esc(name)}: ${esc(s.state)} ${esc(unit)}. Open details.">
        <h2>${esc(name)}</h2><div class="sub num">${esc(line)}</div>
        ${numeric ? `<div class="patch num"><b>${this.fmt(v)}</b><small>${esc(unit)}</small></div>
          <div class="plot" id="plot"></div><div class="figs num" id="figs"></div>`
          : `<div class="patch"><span class="word">${esc(away(s) ? "–" : said(s.state))}</span></div>`}
      </div>`;
    pressable(this.shadowRoot.querySelector(".card"), { tap: () => this.moreInfo(c.entity), hold: () => this.moreInfo(c.entity) });
    if (!numeric) return;
    if (this._pts) this.draw();
    // A sensor may change every few seconds: its history comes from the five-minute cache, and
    // the live reading is drawn at "now".
    this.scheduleHistory(() => fetchHistory(this._hass, [c.entity], c.hours, false, false)
      .then((h) => { this._pts = (h[c.entity] || []).map((p) => [p.t, Number(p.s)]).filter((p) => !isNaN(p[1])); this.draw(); }).catch(() => {}));
  }

  draw() {
    const plot = this.shadowRoot.getElementById("plot"), figs = this.shadowRoot.getElementById("figs");
    if (!plot || !this._pts || !this._pts.length) return;
    const c = this._config, now = Date.now(), from = now - c.hours * 3600000;
    const live = Number(this.st(c.entity)?.state);
    const all = [...this._pts, [now, isNaN(live) ? this._pts[this._pts.length - 1][1] : live]];
    const pts = all.filter((p, i) => p[0] >= from || (all[i + 1] && all[i + 1][0] > from));
    const vals = pts.map((p) => p[1]);
    const lo = Math.min(...vals), hi = Math.max(...vals), mid = median(vals);
    const pad0 = (hi - lo) * 0.12 || Math.max(1, Math.abs(hi) * 0.05);
    const floor = c.min ?? lo - pad0, ceil = c.max ?? hi + pad0;
    const W = Math.max(140, Math.round(plot.clientWidth)), H = 120, G = 30, top = 6, base = 92;
    const x = (t) => G + ((Math.max(t, from) - from) / (now - from)) * (W - G);
    const y = (v) => top + (1 - (v - floor) / (ceil - floor)) * (base - top);
    // Averaged over spans, so the form is a shape and not a seismograph.
    const span = (c.hours * 3600000) / 30, samples = [[G, base]];
    for (let t = from, i = 0; t < now; t += span) {
      let sumV = 0, n = 0;
      for (let u = t; u < Math.min(t + span, now); u += span / 6) {
        while (i + 1 < pts.length && pts[i + 1][0] <= u) i++;
        sumV += pts[i][0] <= u ? pts[i][1] : pts[0][1]; n++;
      }
      if (n) samples.push([x(Math.min(t + span / 2, now)), y(sumV / n)]);
    }
    samples.push([W - 4, y(pts[pts.length - 1][1])], [W, base]);
    const r = rng(c.entity);
    let bottom = `L${W},${base + 3}`;
    for (let bx = W - 26; bx > G; bx -= 26) bottom += ` L${bx.toFixed(0)},${(base + 1 + r() * 5).toFixed(1)}`;
    bottom += ` L${G},${base + 2} Z`;
    // Ticks on whole hours (or days), never closer than a label's width; the last says "now".
    const ticks = [`<text class="axis" x="${W}" y="${H - 2}" text-anchor="end">now</text>`];
    const step = (c.hours <= 24 ? 6 : c.hours <= 72 ? 12 : 24) * 3600000;
    let lastX = W - 30;
    for (let t = Math.floor(now / step) * step; t > from; t -= step) {
      const tx = x(t);
      if (lastX - tx < 44 || tx < G + 18) continue;
      lastX = tx;
      ticks.push(`<text class="axis" x="${tx.toFixed(1)}" y="${H - 2}" text-anchor="middle">${c.hours <= 72 ? hhmm(t) : DAYS[new Date(t).getDay()]}</text>`);
    }
    const ym = y(mid);
    plot.innerHTML = `<svg class="num" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.name || c.entity)} over the last ${c.hours} hours, from ${this.fmt(lo)} to ${this.fmt(hi)}">
      <path class="shape" d="${smoothPath(samples)} ${bottom}" fill="${colour(c.color)}" transform="rotate(-.5 ${W / 2} ${base})"/>
      <line x1="${G}" x2="${W}" y1="${ym.toFixed(1)}" y2="${ym.toFixed(1)}" stroke="var(--hc-black,#141414)" stroke-width="1.5" stroke-dasharray="4 3"/>
      <text class="axis" x="0" y="${(y(hi) + 4).toFixed(1)}">${this.fmt(hi)}</text>
      ${Math.abs(y(lo) - y(hi)) > 14 ? `<text class="axis" x="0" y="${(y(lo) + 4).toFixed(1)}">${this.fmt(lo)}</text>` : ""}
      ${ticks.join("")}
    </svg>`;
    const unit = c.unit ?? this.st(c.entity)?.attributes.unit_of_measurement ?? "";
    const u = unit ? ` ${esc(unit)}` : "";
    figs.innerHTML = `<span>Low<b>${this.fmt(lo)}${u}</b></span><span>High<b>${this.fmt(hi)}${u}</b></span><span><i></i>Usual<b>${this.fmt(mid)}${u}</b></span>`;
  }
}

// ---------- weather: the sky cut from paper, the day hung under it ----------

const CONDITIONS = { "clear-night": "Clear night", cloudy: "Cloudy", exceptional: "Exceptional", fog: "Fog", hail: "Hail", lightning: "Lightning",
  "lightning-rainy": "Thunderstorms", partlycloudy: "Partly cloudy", pouring: "Pouring", rainy: "Rain", snowy: "Snow", "snowy-rainy": "Sleet",
  sunny: "Sunny", windy: "Windy", "windy-variant": "Windy and cloudy" };

// The sky for a condition, as cut paper in a 100 x 80 box: a yellow sun, a cobalt moon, clouds of
// darker paper, cobalt rain, ink hail, a yellow bolt, grey strips of fog, black strips of wind.
function skyArt(cond, seed = "sky") {
  const r = rng(`${seed}${cond}`), j = (a) => (r() * a * 2 - a).toFixed(1);
  const cloud = (x, y, s, fill) => `<g transform="translate(${x} ${y}) scale(${s}) rotate(${j(4)})" class="scrap"><circle cx="-14" cy="4" r="12" fill="${fill}"/><circle cx="4" cy="-4" r="17" fill="${fill}"/><circle cx="20" cy="5" r="11" fill="${fill}"/><rect x="-26" y="4" width="57" height="12" fill="${fill}"/></g>`;
  const sun = (x, y, rad) => `<circle class="scrap" cx="${x}" cy="${y}" r="${rad}" fill="var(--hc-yellow,#F2B705)"/>`;
  const moon = `<path class="scrap" d="M58,10 A22,22 0 1,0 58,54 A16,22 0 1,1 58,10 Z" fill="var(--hc-cobalt,#1F3D8C)" transform="rotate(${j(6)} 50 32)"/>`;
  const drops = (n, fill, w = 3.5, h = 13) => Array.from({ length: n }, (_, i) => `<rect x="${(30 + i * (44 / n) + r() * 4).toFixed(1)}" y="${(54 + r() * 8).toFixed(1)}" width="${w}" height="${h}" fill="${fill}" transform="rotate(18 ${30 + i * 8} 60)"/>`).join("");
  const flakes = (n) => Array.from({ length: n }, (_, i) => `<circle cx="${(30 + i * (46 / n) + r() * 5).toFixed(1)}" cy="${(58 + r() * 14).toFixed(1)}" r="3.4" fill="var(--hc-cobalt,#1F3D8C)"/>`).join("");
  const light = "#CFC7B4", dark = "#4A4740";
  const parts = {
    sunny: sun(50, 40, 26),
    "clear-night": moon,
    partlycloudy: sun(62, 28, 20) + cloud(42, 46, 0.9, light),
    cloudy: cloud(62, 30, 0.75, dark) + cloud(42, 46, 0.95, light),
    fog: [26, 40, 54].map((yy, i) => `<rect x="${12 + i * 6}" y="${yy}" width="${74 - i * 8}" height="7" fill="${i % 2 ? dark : "#B9B3A5"}" transform="rotate(${j(3)} 50 ${yy})"/>`).join(""),
    rainy: cloud(50, 34, 1, dark) + drops(4, "var(--hc-cobalt,#1F3D8C)"),
    pouring: cloud(50, 32, 1.05, dark) + drops(7, "var(--hc-cobalt,#1F3D8C)", 4, 18),
    snowy: cloud(50, 34, 1, light) + flakes(5),
    "snowy-rainy": cloud(50, 34, 1, dark) + drops(3, "var(--hc-cobalt,#1F3D8C)") + flakes(3),
    hail: cloud(50, 34, 1, dark) + Array.from({ length: 5 }, (_, i) => `<rect x="${32 + i * 9}" y="${(57 + r() * 10).toFixed(1)}" width="6" height="6" fill="var(--hc-black,#141414)" transform="rotate(${j(30)} ${35 + i * 9} 60)"/>`).join(""),
    lightning: cloud(50, 32, 1, dark) + `<polygon points="50,46 40,64 50,64 44,80 62,58 52,58 58,46" fill="var(--hc-yellow,#F2B705)" class="scrap"/>`,
    "lightning-rainy": cloud(50, 32, 1, dark) + drops(3, "var(--hc-cobalt,#1F3D8C)") + `<polygon points="54,46 46,62 54,62 49,76 64,57 56,57 61,46" fill="var(--hc-yellow,#F2B705)" class="scrap"/>`,
    windy: [24, 40, 56].map((yy, i) => `<rect x="${10 + i * 10}" y="${yy}" width="${70 - i * 12}" height="6" fill="var(--hc-black,#141414)" transform="rotate(${j(5)} 50 ${yy})"/>`).join(""),
    "windy-variant": cloud(58, 28, 0.8, light) + [46, 60].map((yy, i) => `<rect x="${12 + i * 10}" y="${yy}" width="${64 - i * 12}" height="6" fill="var(--hc-black,#141414)" transform="rotate(${j(5)} 50 ${yy})"/>`).join(""),
    exceptional: `<polygon points="50,12 86,72 14,72" fill="var(--hc-red,#D7301F)" class="scrap"/><rect x="47" y="34" width="6" height="22" fill="var(--hc-paper,#F4F0E6)"/><rect x="47" y="60" width="6" height="6" fill="var(--hc-paper,#F4F0E6)"/>`,
  };
  return `<svg class="sky" viewBox="0 0 100 80" aria-hidden="true">${parts[cond] || cloud(50, 40, 1, light)}</svg>`;
}

// The current conditions on paper, then the next day's temperature as one cobalt form standing on
// a line with each hour's precipitation hanging under it as an ink tab, and the coming days as
// slips. Forecasts come from weather/subscribe_forecast, so any weather integration will do.
class CollageWeatherCard extends CollageCard {
  validate(c) { if (!c.entity) throw new Error("collage-weather-card needs a weather entity"); return { days: 5, ...c }; }
  watch() { return [this._config.entity]; }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  connectedCallback() {
    super.connectedCallback();
    this._ro = this._ro || new ResizeObserver(() => this.drawHours());
    this._ro.observe(this);
    if (this._hass) this.subscribe();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._ro && this._ro.disconnect();
    this.unsubscribe();
  }
  unsubscribe() {
    for (const k of ["hourly", "daily"]) { this._unsub?.[k]?.then((u) => u && u()).catch(() => {}); }
    this._unsub = null; this._subFor = null;
  }
  // Hourly for the day's form, daily (or twice daily) for the slips, as far as the entity offers.
  subscribe() {
    const c = this._config, s = this.st(c.entity);
    if (!s || !this._hass.connection || this._subFor === c.entity) return;
    const f = s.attributes.supported_features || 0;
    if (!(f & 7)) return;
    // A new entity (a changed config) drops the old subscription and its forecasts.
    this.unsubscribe();
    this._subFor = c.entity;
    this._unsub = {};
    this._fc = {};
    const sub = (key, type) => {
      this._unsub[key] = this._hass.connection.subscribeMessage((m) => { this._fc[key] = m.forecast || []; key === "hourly" ? this.drawHours() : this.drawDays(); },
        { type: "weather/subscribe_forecast", forecast_type: type, entity_id: c.entity }).catch(() => null);
    };
    if (f & 2) sub("hourly", "hourly");
    if (f & 1) sub("daily", "daily"); else if (f & 4) sub("daily", "twice_daily");
  }

  update() {
    const c = this._config, s = this.st(c.entity);
    if (!s) { this.shadowRoot.innerHTML = notFound(c.name || c.entity); return; }
    this.subscribe();
    const a = s.attributes, unit = a.temperature_unit || this._hass.config.unit_system?.temperature || "°C";
    const t = Number(a.temperature), feels = Number(a.apparent_temperature);
    const name = c.name || a.friendly_name || "Weather";
    const fig = (label, v) => (v == null ? "" : `<span>${label}<b>${v}</b></span>`);
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .card { padding: 14px 14px 14px; transform: rotate(-.4deg); container-type: inline-size; }
        .head { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; align-items: start; }
        h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
        .cond { margin-top: 4px; font-size: 16px; font-weight: 600; }
        .now { display: flex; align-items: flex-end; gap: 14px; margin-top: 10px; }
        .patch { padding: 8px 16px 4px 12px; background: var(--hc-cobalt, #1F3D8C); color: var(--hc-paper, #F4F0E6); transform: rotate(-2deg);
          box-shadow: 0 1px 1px rgba(0,0,0,.3), 0 10px 20px -8px rgba(0,0,0,.6); }
        .patch b { font-size: 72px; font-weight: 700; line-height: .82; letter-spacing: -.05em; }
        .patch sup { font-size: 30px; vertical-align: top; }
        svg.sky { width: 120px; height: 96px; overflow: visible; }
        .scrap { filter: drop-shadow(0 1px 1px rgba(0,0,0,.25)) drop-shadow(0 4px 4px rgba(0,0,0,.18)); }
        .figs { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 12px; font-size: 12px; font-weight: 600; }
        .figs b { display: block; font-size: 18px; letter-spacing: -.02em; }
        h3 { margin: 16px 0 4px; font-size: 18px; font-weight: 700; letter-spacing: -.01em; }
        .axis { font: 600 11px var(--hc-display, sans-serif); fill: #4A4740; }
        .form { filter: drop-shadow(0 6px 6px rgba(0,0,0,.28)); }
        .days { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 10px 8px; margin-top: 10px; }
        .day { display: grid; justify-items: center; padding: 8px 6px 9px; background: #ECE6D8; box-shadow: 0 1px 1px rgba(0,0,0,.2), 0 4px 8px -5px rgba(0,0,0,.45); }
        .day:nth-child(odd) { transform: rotate(-1deg); } .day:nth-child(even) { transform: rotate(.8deg); }
        .day .d { font-size: 13px; font-weight: 700; }
        .day svg.sky { width: 56px; height: 45px; }
        .day .t { font-size: 16px; font-weight: 700; letter-spacing: -.02em; }
        .day .t span { color: #4A4740; font-weight: 600; font-size: 13px; }
        .day .p { font-size: 11px; font-weight: 700; color: var(--hc-cobalt, #1F3D8C); min-height: 13px; }
        .key { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 6px; font-size: 12px; font-weight: 600; }
        .key i { display: inline-block; width: 14px; height: 8px; margin-right: 5px; }
      </style>
      ${scatter(c.entity, 7, ["right", "bottom", "left"])}
      <div class="paper card press" role="button" tabindex="0" aria-label="${esc(name)}: ${esc(CONDITIONS[s.state] || said(s.state))}, ${isNaN(t) ? "" : `${t}${unit}`}. Open details.">
        <div class="head"><div><h2>${esc(name)}</h2><div class="cond">${esc(CONDITIONS[s.state] || (away(s) ? "Not answering" : said(s.state)))}</div></div></div>
        <div class="now">
          <div class="patch num"><b>${isNaN(t) ? "–" : Math.round(t)}</b><sup>°</sup></div>
          ${skyArt(s.state, c.entity)}
        </div>
        <div class="figs num">${fig("Feels like", isNaN(feels) ? null : `${Math.round(feels)}°`)}${fig("Humidity", a.humidity != null ? `${Math.round(a.humidity)}%` : null)}${a.wind_speed != null ? `<span>Wind<b>${Math.round(a.wind_speed)} ${esc(a.wind_speed_unit || "")}</b></span>` : ""}${Number(a.precipitation) > 0 ? fig("Rain now", `${a.precipitation} ${esc(a.precipitation_unit || "")}`) : ""}</div>
        <div id="hours"></div>
        <div id="days"></div>
      </div>`;
    pressable(this.shadowRoot.querySelector(".card"), { tap: () => this.moreInfo(c.entity), hold: () => this.moreInfo(c.entity) });
    this.drawHours(); this.drawDays();
  }

  drawHours() {
    const host = this.shadowRoot.getElementById("hours"), fc = (this._fc?.hourly || []).slice(0, 24);
    if (!host || fc.length < 3) { if (host) host.innerHTML = ""; return; }
    const W = Math.max(260, Math.round(host.clientWidth || this.clientWidth - 28)), G = 28, TOP = 6, LINE = 82, DROP = 40, H = LINE + DROP + 20;
    const ts = fc.map((f) => Date.parse(f.datetime)), X0 = ts[0], X1 = ts[ts.length - 1];
    const x = (t) => G + ((t - X0) / (X1 - X0)) * (W - G - 6);
    const vals = fc.map((f) => Number(f.temperature)).filter((v) => !isNaN(v));
    const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
    const y = (v) => TOP + (1 - (v - lo) / (hi - lo)) * (LINE - 8 - TOP);
    const pts = [[x(X0), LINE], ...fc.map((f, i) => [x(ts[i]), y(Number(f.temperature))]), [x(X1), LINE]];
    const rain = Math.max(1, ...fc.map((f) => Number(f.precipitation) || 0));
    const r = rng(this._config.entity);
    const tabs = fc.map((f, i) => {
      const p = Number(f.precipitation) || 0, prob = Number(f.precipitation_probability);
      if (p <= 0 && !(prob >= 30)) return "";
      const l = 6 + (DROP - 10) * Math.sqrt(Math.min(p, rain) / rain), w = Math.max(4, (W - G) / 60);
      return `<rect x="${(x(ts[i]) - w / 2).toFixed(1)}" y="${LINE + 2}" width="${w.toFixed(1)}" height="${(p > 0 ? l : 6).toFixed(1)}" fill="${p > 0 ? "var(--hc-black,#141414)" : "#B9B3A5"}" transform="rotate(${(r() * 6 - 3).toFixed(1)} ${x(ts[i]).toFixed(1)} ${LINE + 2})"/>`;
    }).join("");
    const ticks = fc.map((f, i) => (i % 6 === 0 ? `<text class="axis" x="${x(ts[i]).toFixed(1)}" y="${H - 2}" text-anchor="${i === 0 ? "start" : "middle"}">${i === 0 ? "now" : hhmm(ts[i])}</text>` : "")).join("");
    const unit = this.st(this._config.entity)?.attributes.precipitation_unit || "mm";
    host.innerHTML = `<h3>The next ${fc.length} hours</h3>
      <svg class="num" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Temperature over the next ${fc.length} hours, from ${Math.min(...vals)} to ${Math.max(...vals)} degrees">
        <path class="form" d="${smoothPath(pts)} Z" fill="var(--hc-cobalt,#1F3D8C)"/>
        <text class="axis" x="0" y="${(y(hi) + 4).toFixed(1)}">${hi}°</text><text class="axis" x="0" y="${(y(lo) + 4).toFixed(1)}">${lo}°</text>
        ${tabs}
        <rect x="${G - 4}" y="${LINE - 2}" width="${W - G + 4}" height="5" fill="var(--hc-black,#141414)" transform="rotate(-.3 ${W / 2} ${LINE})"/>
        ${ticks}
      </svg>
      <div class="key"><span><i style="background:var(--hc-cobalt,#1F3D8C)"></i>Temperature</span><span><i style="background:var(--hc-black,#141414);width:6px;height:14px;vertical-align:-3px"></i>Precipitation, ${esc(unit)} an hour</span><span><i style="background:#B9B3A5;width:6px;height:8px"></i>Likely, none measured</span></div>`;
  }

  drawDays() {
    const host = this.shadowRoot.getElementById("days"), fc = (this._fc?.daily || []).slice(0, this._config.days);
    if (!host) return;
    if (!fc.length) { host.innerHTML = ""; return; }
    const today = startOfDay(Date.now());
    host.innerHTML = `<h3>The coming days</h3><div class="days num">${fc.map((f) => {
      const t = Date.parse(f.datetime), d = startOfDay(t) === today ? "Today" : `${DAYS[new Date(t).getDay()]}${f.is_daytime === false ? " night" : ""}`;
      const p = Number(f.precipitation_probability);
      return `<div class="day"><span class="d">${d}</span>${skyArt(f.condition, `${t}`)}<span class="t">${Math.round(f.temperature)}°${f.templow != null ? ` <span>${Math.round(f.templow)}°</span>` : ""}</span><span class="p">${p >= 20 ? `${Math.round(p)}%` : ""}</span></div>`;
    }).join("")}</div>`;
  }
}

// ---------- media: a record sleeve, a photo pasted on it ----------

// A media player: the cover art pasted on as a cut photo (or, without art, a record label in the
// card's colour), the record peeking out of its sleeve and turning while it plays, the title in
// Title type, the artist under it, and square black buttons for what the player supports.
const MP = { PAUSE: 1, SEEK: 2, VOLUME_SET: 4, PREVIOUS: 16, NEXT: 32, TURN_ON: 128, TURN_OFF: 256, PLAY: 16384 };
class CollageMediaCard extends CollageCard {
  validate(c) { if (!c.entity) throw new Error("collage-media-card needs a media_player entity"); return { color: "orange", form: 4, form_color: "cobalt", tilt: seededTilt(c.entity, 1), ...c }; }
  watch() { return [this._config.entity]; }
  getGridOptions() { return { columns: 12, rows: "auto" }; }
  connectedCallback() {
    super.connectedCallback();
    clearInterval(this._clock);
    // The progress strip moves each second while something plays; nothing else is redrawn.
    this._clock = setInterval(() => this.progress(), 1000);
  }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this._clock); }

  update() {
    const c = this._config, s = this.st(c.entity);
    if (!s) { this.shadowRoot.innerHTML = notFound(c.name || c.entity); return; }
    const focusKey = this.shadowRoot.activeElement?.dataset?.focus;
    const a = s.attributes, f = a.supported_features || 0;
    const playing = s.state === "playing", off = ["off", "standby"].includes(s.state), gone = away(s);
    const wasPlaying = this._playing;
    this._playing = playing;
    const player = c.name || a.friendly_name || c.entity;
    const title = a.media_title || (off ? "Off" : gone ? "Not answering" : s.state === "idle" ? "Nothing playing" : said(s.state));
    const by = [a.media_artist || a.media_series_title, a.media_album_name].filter(Boolean).join(" · ") || a.app_name || a.source || "";
    const vol = a.volume_level != null ? Math.round(a.volume_level * 100) : null;
    const paperC = colour(c.color);
    const art = c.art !== false && a.entity_picture;
    const btn = (k, ic, label, show = true) => (show ? `<button data-s="${k}" data-focus="${k}" aria-label="${label}">${icon(ic)}</button>` : "");
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .card { display: grid; grid-template-columns: 158px 1fr; gap: 12px 14px; padding: 14px; transform: rotate(${c.tilt}deg); overflow: visible; container-type: inline-size; }
        @container (max-width: 300px) { .card { grid-template-columns: 1fr; } }
        .sleeve { position: relative; width: 120px; height: 120px; margin: 4px 0 0 2px; }
        .record { position: absolute; left: 26px; top: 6px; width: 108px; height: 108px; border-radius: 50%;
          background: radial-gradient(circle, ${paperC} 0 17%, var(--hc-black,#141414) 18% 20%, transparent 21%),
            repeating-radial-gradient(circle, #1E1E1E 0 2px, #2A2A2A 2px 3px); box-shadow: 0 6px 12px -6px rgba(0,0,0,.6); }
        .record::after { content: ""; position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px; border-radius: 50%; background: var(--hc-paper,#F4F0E6); }
        .front { position: absolute; inset: 0; z-index: 1; background: ${paperC}; transform: rotate(-3deg); box-shadow: 0 1px 1px rgba(0,0,0,.3), 0 8px 14px -6px rgba(0,0,0,.5); overflow: hidden; }
        .front img { display: block; width: 100%; height: 100%; object-fit: cover; }
        .front .grain { position: absolute; inset: 0; opacity: .35; background: radial-gradient(var(--hc-black,#141414) 22%, transparent 24%) 0 0 / 8px 8px; }
        .form { width: 72px; left: -22px; top: -26px; z-index: 3; transform: rotate(-20deg); filter: drop-shadow(0 6px 8px rgba(0,0,0,.4)); }
        @media (prefers-reduced-motion: no-preference) {
          .playing .record { animation: spin 3.6s linear infinite; transition: left .5s cubic-bezier(.16,1,.3,1); }
          @keyframes spin { to { transform: rotate(360deg); } }
        }
        .playing .record { left: 40px; }
        .what { min-width: 0; }
        .player { font-size: 12px; font-weight: 600; letter-spacing: .04em; color: #4A4740; }
        h2 { margin: 4px 0 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: .98; overflow-wrap: anywhere; }
        .by { margin-top: 4px; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
        .strip { position: relative; height: 8px; margin-top: 12px; background: #DDD6C6; }
        .strip i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--hc-black,#141414); }
        .times { display: flex; justify-content: space-between; margin-top: 3px; font-size: 11px; font-weight: 600; color: #4A4740; }
        .btns { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
        .btns button { display: grid; place-items: center; width: 44px; height: 44px; background: var(--hc-black,#141414); color: var(--hc-paper,#F4F0E6); --mdc-icon-size: 22px; }
        .btns button[data-s="toggle"] { width: 56px; background: ${paperC}; color: ${inkOn(c.color)}; box-shadow: inset 0 0 0 2px var(--hc-black,#141414); }
        .vol { position: relative; grid-column: 1 / -1; height: 34px; touch-action: none; cursor: ew-resize; background: #DDD6C6; box-shadow: inset 0 0 0 2px var(--hc-black,#141414); }
        .vol i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--hc-black,#141414); }
        .vol span { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 700; }
        .vol span.inside { right: auto; left: 8px; color: var(--hc-paper,#F4F0E6); }
        .vol:focus-visible { outline: 3px solid var(--hc-yellow,#F2B705); outline-offset: 2px; }
        .gone { filter: grayscale(1); }
      </style>
      ${scatter(c.entity, 6)}
      <div class="paper card ${playing ? "playing" : ""} ${gone ? "gone" : ""}">
        <div class="sleeve" aria-hidden="true">
          <div class="record"></div>
          <div class="front">${art ? `<img src="${esc(art)}" alt="">` : `<div class="grain"></div>`}</div>
          ${playing ? form(c.form, colour(c.form_color), `form ${wasPlaying === false ? "lay" : ""}`) : ""}
        </div>
        <div class="what">
          <div class="player">${esc(player)}</div>
          <h2>${esc(title)}</h2>${by ? `<div class="by">${esc(by)}</div>` : ""}
          ${a.media_duration ? `<div class="strip" id="strip"><i></i></div><div class="times num"><span id="pos"></span><span>${clock(Math.round(a.media_duration))}</span></div>` : ""}
          <div class="btns">
            ${off ? btn("on", "power", `Turn ${esc(player)} on`, !!(f & MP.TURN_ON)) : `
            ${btn("prev", "skip-previous", "Previous track", !!(f & MP.PREVIOUS))}
            ${btn("toggle", playing ? "pause" : "play", playing ? "Pause" : "Play", !!(f & (MP.PAUSE | MP.PLAY)))}
            ${btn("next", "skip-next", "Next track", !!(f & MP.NEXT))}
            ${btn("off", "power", `Turn ${esc(player)} off`, !!(f & MP.TURN_OFF))}`}
          </div>
        </div>
        ${vol != null && f & MP.VOLUME_SET && !off ? `<div class="vol nopress" role="slider" tabindex="0" data-focus="vol" aria-label="${esc(player)} volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${vol}"><i style="width:${vol}%"></i><span class="num ${vol > 78 ? "inside" : ""}">${vol}%</span></div>` : ""}
      </div>`;
    const sr = this.shadowRoot, fail = `${player} didn't answer.`;
    const call = { prev: "media_previous_track", next: "media_next_track", toggle: "media_play_pause", on: "turn_on", off: "turn_off" };
    sr.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => this.run("media_player", call[b.dataset.s], { entity_id: c.entity }, fail).catch(() => {})));
    const vs = sr.querySelector(".vol");
    if (vs) this.wireVolume(vs);
    pressable(sr.querySelector(".sleeve"), { tap: () => this.moreInfo(c.entity), hold: () => this.moreInfo(c.entity) });
    if (focusKey) sr.querySelector(`[data-focus="${focusKey}"]`)?.focus();
    this.progress();
  }

  // Where the track is: the reported position, moved on by the time since it was reported.
  progress() {
    const s = this.st(this._config.entity), strip = this.shadowRoot.getElementById("strip");
    if (!s || !strip) return;
    const a = s.attributes, dur = Number(a.media_duration);
    let pos = Number(a.media_position) || 0;
    if (s.state === "playing" && a.media_position_updated_at) pos += (Date.now() - Date.parse(a.media_position_updated_at)) / 1000;
    pos = Math.max(0, Math.min(dur, pos));
    strip.querySelector("i").style.width = `${((pos / dur) * 100).toFixed(2)}%`;
    this.shadowRoot.getElementById("pos").textContent = clock(Math.round(pos));
  }

  // Drag across the bar to set the volume; let go to send it. Arrow keys step by 5.
  wireVolume(el) {
    const fill = el.querySelector("i"), label = el.querySelector("span");
    let value = Number(el.getAttribute("aria-valuenow"));
    const show = (v) => { value = Math.max(0, Math.min(100, Math.round(v))); fill.style.width = `${value}%`; label.textContent = `${value}%`; label.classList.toggle("inside", value > 78); el.setAttribute("aria-valuenow", value); };
    const send = () => this.run("media_player", "volume_set", { entity_id: this._config.entity, volume_level: value / 100 }).catch(() => {});
    const at = (e) => { const r = el.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
    el.addEventListener("pointerdown", (e) => { e.stopPropagation(); el.setPointerCapture(e.pointerId); this._busy = true; show(at(e)); });
    el.addEventListener("pointermove", (e) => { if (this._busy && el.hasPointerCapture(e.pointerId)) show(at(e)); });
    el.addEventListener("pointerup", (e) => { if (!el.hasPointerCapture(e.pointerId)) return; el.releasePointerCapture(e.pointerId); send(); this.release(); });
    el.addEventListener("pointercancel", () => this.release());
    el.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
      if (step == null) return;
      e.preventDefault(); show(value + step);
      clearTimeout(this._keyTimer); this._keyTimer = setTimeout(send, 450);
    });
  }
}

// ---------- lock: a keyhole cut from the sheet, a bolt across it ----------

// Locked, the sheet is cobalt and the bolt is home in its strike; unlocked, the sheet is yellow and
// the bolt is drawn back. Locking needs one tap; unlocking asks for a second tap within four
// seconds, unless confirm: false. Hold opens the details. Jammed is vermilion.
class CollageLockCard extends CollageCard {
  validate(c) { if (!c.entity) throw new Error("collage-lock-card needs a lock entity"); return { confirm: true, tilt: seededTilt(c.entity), ...c }; }
  watch() { return [this._config.entity]; }
  getGridOptions() { return { columns: 6, rows: "auto", min_columns: 3 }; }

  update() {
    const c = this._config, s = this.st(c.entity);
    if (!s) { this.shadowRoot.innerHTML = notFound(c.name || c.entity); return; }
    const focusKey = this.shadowRoot.activeElement?.dataset?.focus;
    const st = s.state, name = c.name || s.attributes.friendly_name || c.entity, gone = away(s);
    const locked = st === "locked", moving = st === "locking" || st === "unlocking" || st === "opening";
    const hue = gone ? "paper" : st === "jammed" ? "red" : locked ? "cobalt" : moving ? "paper" : "yellow";
    const ink = inkOn(hue);
    const words = { locked: "Locked", unlocked: "Unlocked", locking: "Locking…", unlocking: "Unlocking…", jammed: "Jammed", open: "Open", opening: "Opening…" };
    const line = gone ? "Not answering" : `${words[st] || said(st)}${moving ? "" : `, ${ago(new Date(s.last_changed))}`}`;
    const asking = this._asking && Date.now() - this._asking < 4000;
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .lock { display: block; aspect-ratio: 1 / 1.16; min-height: 200px; padding: 12px; background: ${colour(hue)}; color: ${ink}; transform: rotate(${c.tilt}deg); }
        .name { font-size: 25px; font-weight: 700; line-height: .95; letter-spacing: -.02em; }
        .state { margin-top: 6px; font-size: 13px; font-weight: 600; }
        svg { position: absolute; left: 12px; right: 12px; bottom: 12px; width: calc(100% - 24px); height: 52%; overflow: visible; }
        .bolt { transition: transform .5s cubic-bezier(.16,1,.3,1); }
        .disc { filter: drop-shadow(0 1px 1px rgba(0,0,0,.3)) drop-shadow(0 6px 8px rgba(0,0,0,.3)); }
        .ask { position: absolute; z-index: 5; left: 8px; right: 8px; top: 46%; padding: 9px 11px; font-size: 15px; font-weight: 700; background: var(--hc-pink,#E9A3B8);
          color: var(--hc-black,#141414); transform: rotate(-2deg); box-shadow: 0 1px 1px rgba(0,0,0,.3), 0 8px 14px -6px rgba(0,0,0,.6); }
        .gone { filter: grayscale(1); }
      </style>
      ${scatter(c.entity, 5)}
      <div class="paper lock press ${gone ? "gone" : ""}" role="button" tabindex="0" data-focus="lock"
        aria-label="${esc(name)}, ${esc(line)}. ${locked ? (c.confirm ? "Tap twice to unlock." : "Tap to unlock.") : "Tap to lock."}">
        <div class="name">${esc(name)}</div><div class="state num">${esc(line)}</div>
        <svg viewBox="0 0 160 110" aria-hidden="true">
          <!-- The strike, a paper plate with an ink slot; the bolt slides into it when locked. -->
          <rect x="120" y="34" width="34" height="56" fill="var(--hc-paper,#F4F0E6)" stroke="var(--hc-black,#141414)" stroke-width="4" transform="rotate(2 137 62)"/>
          <rect x="126" y="50" width="22" height="24" fill="var(--hc-black,#141414)" opacity=".2"/>
          <rect class="bolt" x="56" y="51" width="88" height="22" fill="var(--hc-black,#141414)" style="transform: translateX(${locked ? 0 : -58}px)"/>
          <!-- The escutcheon: a disc of paper with the keyhole cut through it. -->
          <g transform="rotate(${(c.tilt * 3).toFixed(1)} 48 62)">
            <circle cx="48" cy="62" r="40" fill="${hue === "paper" ? "#DDD6C6" : "var(--hc-paper,#F4F0E6)"}" class="disc"/>
            <circle cx="48" cy="50" r="12" fill="var(--hc-black,#141414)"/>
            <path d="M42,56 L36,88 L60,88 L54,56 Z" fill="var(--hc-black,#141414)"/>
          </g>
        </svg>
        ${asking ? `<div class="ask" role="status">Tap again to unlock</div>` : ""}
      </div>`;
    pressable(this.shadowRoot.querySelector(".lock"), {
      tap: () => {
        if (gone || moving) return;
        if (!locked) { this._asking = 0; this.run("lock", "lock", { entity_id: c.entity, ...(c.code ? { code: String(c.code) } : {}) }, `${name} didn't answer.`).catch(() => {}); return; }
        if (c.confirm && !(this._asking && Date.now() - this._asking < 4000)) {
          this._asking = Date.now(); this.update();
          clearTimeout(this._askTimer); this._askTimer = setTimeout(() => { this._asking = 0; this.update(); }, 4000);
          return;
        }
        this._asking = 0;
        this.run("lock", "unlock", { entity_id: c.entity, ...(c.code ? { code: String(c.code) } : {}) }, `${name} didn't answer.`).catch(() => {});
      },
      hold: () => this.moreInfo(c.entity),
    });
    if (focusKey) this.shadowRoot.querySelector(`[data-focus="${focusKey}"]`)?.focus();
  }
}

// ---------- people: who is home, cut out and stood in the house ----------

// Each person a paper figure in their colour: at home they stand inside the house, a cobalt
// sheet with a pitched roof; away they wait outside on the wall, faded, with where they are.
// Tap a figure for its details. Only the person's state is read; no map, no photo.
class CollagePeopleCard extends CollageCard {
  validate(c) {
    if (!c.people || !c.people.length) throw new Error("collage-people-card needs people: a list of person entities");
    const people = c.people.map((p, i) => ({ color: ["orange", "yellow", "red", "olive", "pink", "cobalt"][i % 6], ...(typeof p === "string" ? { entity: p } : p) }));
    return { name: "Who's home", ...c, people };
  }
  watch() { return this._config.people.map((p) => p.entity); }
  getGridOptions() { return { columns: 12, rows: "auto" }; }

  update() {
    const c = this._config, focusKey = this.shadowRoot.activeElement?.dataset?.focus;
    const list = c.people.map((p) => {
      const s = this.st(p.entity);
      const name = p.name || s?.attributes.friendly_name || p.entity;
      const home = s?.state === "home", gone = away(s);
      const where = gone ? "Not answering" : home ? "Home" : s.state === "not_home" ? "Away" : said(s.state);
      const since = s ? new Date(s.last_changed) : null;
      return { ...p, name, home, gone, line: gone ? where : `${where}${since ? `, ${home ? `since ${hhmm(since)}` : duration(Date.now() - since)}` : ""}` };
    });
    const homeList = list.filter((p) => p.home), out = list.filter((p) => !p.home);
    const and = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0]);
    const lead = !homeList.length ? "Nobody is home." : !out.length ? (list.length === 1 ? `${list[0].name} is home.` : "Everyone is home.")
      : `${and(homeList.map((p) => p.name))} ${homeList.length === 1 ? "is" : "are"} home.`;
    const figure = (p, i) => {
      const r = rng(p.entity);
      return `<button class="who ${p.home ? "in" : "out"} ${p.gone ? "gone" : ""}" data-e="${esc(p.entity)}" data-focus="p-${i}" style="--c:${colour(p.color)};--t:${(r() * 6 - 3).toFixed(1)}deg"
        aria-label="${esc(p.name)}: ${esc(p.line)}. Open details.">
        <svg viewBox="0 0 40 60" aria-hidden="true"><circle cx="20" cy="13" r="11"/><path d="M2,60 C2,34 8,27 20,27 C32,27 38,34 38,60 Z"/></svg>
        <span class="n">${esc(p.name)}</span><span class="l num">${esc(p.line)}</span></button>`;
    };
    this.shadowRoot.innerHTML = `
      <style>${MATERIAL}
        .card { padding: 14px; transform: rotate(.3deg); container-type: inline-size; }
        h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
        .lead { margin: 4px 0 0; font-size: 16px; font-weight: 600; }
        .scene { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 14px; align-items: end; margin-top: 16px; }
        @container (max-width: 380px) { .scene { grid-template-columns: 1fr; } }
        .house { position: relative; padding: 46px 10px 12px; background: var(--hc-cobalt,#1F3D8C); color: var(--hc-paper,#F4F0E6); min-height: 150px;
          clip-path: polygon(0 34px, 50% 0, 100% 34px, 100% 100%, 0 100%); }
        .row { display: flex; flex-wrap: wrap; gap: 10px 6px; align-items: flex-end; }
        .yard { padding: 10px 6px 12px; border-bottom: 5px solid var(--hc-black,#141414); }
        .yard:empty { display: none; }
        .who { display: grid; justify-items: center; gap: 2px; width: 74px; padding: 0; background: none; text-align: center; color: inherit; transform: rotate(var(--t)); }
        .who svg { width: 40px; height: 60px; fill: var(--c); filter: drop-shadow(0 1px 1px rgba(0,0,0,.3)) drop-shadow(0 6px 6px rgba(0,0,0,.25)); }
        .who.out svg { fill: transparent; stroke: var(--hc-black,#141414); stroke-width: 2.5; stroke-dasharray: 4 3; filter: none; }
        .who.gone { filter: grayscale(1); opacity: .6; }
        .who .n { font-size: 15px; font-weight: 700; letter-spacing: -.01em; line-height: 1.05; }
        .who .l { font-size: 11px; font-weight: 600; line-height: 1.15; }
        .house .who .l { color: var(--hc-paper,#F4F0E6); }
        .empty { font-size: 13px; font-weight: 600; opacity: .8; }
      </style>
      ${scatter("people", 6)}
      <div class="paper card">
        <h2>${esc(c.name)}</h2><p class="lead">${esc(lead)}</p>
        <div class="scene">
          <div class="house"><div class="row">${homeList.map((p) => figure(p, list.indexOf(p))).join("") || `<span class="empty">The house is empty.</span>`}</div></div>
          <div class="yard row">${out.map((p) => figure(p, list.indexOf(p))).join("")}</div>
        </div>
      </div>`;
    this.shadowRoot.querySelectorAll(".who").forEach((b) => b.addEventListener("click", () => this.moreInfo(b.dataset.e)));
    if (focusKey) this.shadowRoot.querySelector(`[data-focus="${focusKey}"]`)?.focus();
  }
}

// ---------- registry ----------

const CARDS = [
  ["collage-room-card", CollageRoomCard, "Room", "A light or switch as a room of cut paper: one tap toggles, with today's hours and a 24 h strip; turn it over for its record."],
  ["collage-status-card", CollageStatusCard, "Status", "The house in one sentence, with the inside temperature, the sun and alerts."],
  ["collage-action-card", CollageActionCard, "Action", "One black bar that calls one action."],
  ["collage-climate-card", CollageClimateCard, "Heat", "A thermostat: the day's temperature as one form, when the heating or cooling ran, and the setpoint."],
  ["collage-sun-card", CollageSunCard, "Sun", "The sun's arc, or the sky over the house in 3D; optionally a shade's rails and a light."],
  ["collage-upkeep-card", CollageUpkeepCard, "Upkeep", "Batteries as cut paper, devices that are not answering, the host and backups."],
  ["collage-sensor-card", CollageSensorCard, "Sensor", "Any reading on a patch of its colour, with its day as one cut form."],
  ["collage-weather-card", CollageWeatherCard, "Weather", "The sky cut from paper, the next hours hung under the temperature, the coming days as slips."],
  ["collage-media-card", CollageMediaCard, "Media", "A media player as a record sleeve: what plays, the controls and the volume."],
  ["collage-lock-card", CollageLockCard, "Lock", "A lock as a keyhole and a bolt: one tap locks, two taps unlock."],
  ["collage-people-card", CollagePeopleCard, "People", "Who is home, as paper figures inside the house or waiting outside it."],
  ["collage-doors-now-card", CollageDoorsNowCard, "The doors", "Door contacts as paper doors that swing open, with the alarm and other sensors as tags."],
  ["collage-doors-card", CollageDoorsCard, "Doors", "The doors' openings hung under the outside temperature, from 24 hours to a year."],
  ["collage-brush-card", CollageBrushCard, "Toothbrush", "When an Oral-B brush ran, over an hour, a day or a week, and how it is set."],
  ["collage-range-card", CollageRangeCard, "The range", "A GE (SmartHQ) range from above: the burners now and their share of the span, the ovens as doors."],
  ["collage-stove-card", CollageStoveCard, "At the stove", "Time at a GE (SmartHQ) range from a week to a year, when in the week it happens, and the latest sessions."],
];
window.customCards = window.customCards || [];
for (const [tag, cls, name, description] of CARDS) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
  window.customCards.push({ type: tag, name: `Collage: ${name}`, description, documentationURL: "https://github.com/alejandroerickson/homeassistant-collage-theme" });
}
console.info(`%c collage ${VERSION} `, "background:#D7301F;color:#F4F0E6;font-weight:700");
