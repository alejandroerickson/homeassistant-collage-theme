// The demo: the Collage theme and cards on a pretend Home Assistant (mock-hass.js), laid out as
// three dashboard views. Serve the repository's root (node tools/serve.mjs) and open /demo/.
// ?view=home|doors|kitchen picks a view; ?card=<type> shows one card alone; ?sky=15:30 sets the 3D sky's time.
import { makeHass } from "./mock-hass.js";
import "./icons.js";

// The theme's variables, read from themes/collage.yaml, set on the page as Home Assistant would.
const yaml = await (await fetch("../themes/collage.yaml")).text();
const vars = {};
let key = null;
for (const line of yaml.split("\n")) {
  const m = /^  ([a-z0-9_-]+): ?(.*)$/i.exec(line);
  if (m) { key = m[1]; vars[key] = m[2] === ">-" ? "" : m[2].replace(/^["']|["']$/g, ""); continue; }
  if (key && /^    \S/.test(line)) vars[key] += (vars[key] ? " " : "") + line.trim();
  else if (!line.startsWith("    ")) key = null;
}
for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(`--${k}`, v);

await import("../dist/collage.js");

const lights = ["light.living_room", "light.kitchen", "light.dining_room", "switch.basement"];
const doors = [
  { entity: "binary_sensor.front_door", color: "orange", limit: 5 },
  { entity: "binary_sensor.back_door", color: "yellow", limit: 5 },
  { entity: "binary_sensor.patio_door", color: "red" },
  { entity: "binary_sensor.garage_door", color: "olive", limit: 10 },
];
const doorConfig = { doors, outside: "sensor.outside_temperature", weather: "weather.home", statistics: false };

// Each view: columns of cards; a pair is two cards side by side, a heading sits on the wall.
const VIEWS = {
  home: { title: "Home", cols: [
    [{ type: "collage-status-card", temperature: "sensor.inside_temperature", climate: "climate.thermostat", lights,
        alerts: [{ entity: "binary_sensor.back_door", state: "on", text: "Back door open" }, { entity: "sensor.attic_smoke_battery", below: 15, text: "Attic smoke alarm battery low", level: "error" }] },
      { pair: [
        { type: "collage-room-card", entity: "light.living_room", name: "Living", color: "orange", form: 1, form_color: "black" },
        { type: "collage-room-card", entity: "light.dining_room", name: "Dining", color: "red", form: 2, form_color: "yellow" },
        { type: "collage-room-card", entity: "light.kitchen", name: "Kitchen", color: "yellow", form: 3, form_color: "cobalt" },
        { type: "collage-room-card", entity: "switch.basement", name: "Basement", color: "cobalt", form: 4, form_color: "pink" }] },
      { type: "collage-action-card", name: "Lights out", note: "Every light off", action: "light.turn_off", data: { entity_id: lights.filter((l) => l.startsWith("light.")) } },
      { pair: [{ type: "collage-lock-card", entity: "lock.front_door" }, { type: "collage-sensor-card", entity: "sensor.living_room_humidity", name: "Humidity", color: "olive" }] },
      { type: "collage-upkeep-card", batteries: ["sensor.front_door_lock_battery", "sensor.hall_motion_battery", "sensor.garden_sensor_battery", "sensor.attic_smoke_battery", "sensor.shed_door_battery"],
        offline: ["binary_sensor.shed_door"], cpu: "sensor.system_cpu", memory: "sensor.system_memory", backup: "sensor.backup_last_successful_automatic_backup",
        locations: { "backup.local": "This machine", "hassio.nas": "NAS" } }],
    [{ type: "collage-climate-card", climate: "climate.thermostat", temperature: "sensor.inside_temperature", outside: "sensor.outside_temperature", runner: "Furnace" },
      { type: "collage-sun-card", map: true, rails: [{ entity: "cover.shade_top_rail", name: "Top rail", from_top: true }, { entity: "cover.shade_bottom_rail", name: "Bottom rail" }],
        shade_name: "Study shade", lights: "light.porch" },
      { type: "collage-sensor-card", entity: "sensor.home_power", name: "Power", color: "yellow", decimals: 0 }],
    [{ type: "collage-weather-card", entity: "weather.home", name: "Outside" },
      { type: "collage-people-card", people: ["person.kim", "person.sam", "person.lee"] },
      { type: "collage-media-card", entity: "media_player.living_room_speaker" }],
  ] },
  doors: { title: "Doors", cols: [
    [{ type: "collage-doors-now-card", ...doorConfig, alarm: "alarm_control_panel.home", sensors: [{ entity: "binary_sensor.basement_leak", name: "Leak", on: "Wet!", off: "Dry" }] },
      { type: "collage-doors-card", ...doorConfig, log: true }],
    [{ type: "collage-doors-card", ...doorConfig }],
  ] },
  kitchen: { title: "Kitchen", cols: [
    [{ type: "collage-range-card", appliance: "range", statistics: false }, { type: "collage-brush-card", entity: "sensor.toothbrush", name: "Toothbrush" }],
    [{ type: "collage-stove-card", appliance: "range", statistics: false }],
  ] },
};

let hass;
const cards = [];
const refresh = () => { hass = { ...hass, states: { ...hass.states } }; for (const c of cards) c.hass = hass; };
hass = makeHass(refresh);

function card(config) {
  const el = document.createElement(config.type);
  el.setConfig(config);
  el.hass = hass;
  cards.push(el);
  return el;
}

const params = new URLSearchParams(location.search);
const view = VIEWS[params.get("view")] ? params.get("view") : "home";
const only = params.get("card");
document.getElementById("tabs").innerHTML = Object.entries(VIEWS).map(([k, v]) => `<a href="?view=${k}" ${k === view ? 'aria-current="page"' : ""}>${v.title}</a>`).join("");
const main = document.getElementById("view");
const all = Object.values(VIEWS).flatMap((v) => v.cols.flat()).flatMap((x) => x.pair || [x]);
if (only) {
  // One card alone, at a phone's width, for a screenshot.
  const c = all.find((x) => x.type === only || x.type === `collage-${only}-card`);
  main.style.maxWidth = "460px";
  main.append(card(c));
} else {
  for (const col of VIEWS[view].cols) {
    const div = document.createElement("div");
    div.className = "col";
    for (const item of col) {
      if (item.pair) {
        const pair = document.createElement("div");
        pair.className = "pair";
        for (const c of item.pair) pair.append(card(c));
        div.append(pair);
      } else div.append(card(item));
    }
    main.append(div);
  }
}
document.title = `Collage: ${VIEWS[view].title}`;

// ?sky=15:30 turns the 3D sky to that time of day once it has unfolded (for screenshots at night).
const sky = /^(\d{1,2}):(\d{2})$/.exec(params.get("sky") || "");
if (sky) {
  const turn = () => {
    const dome = document.querySelector("collage-sun-card")?.shadowRoot.querySelector("collage-sun-dome");
    if (!dome || !dome._three) return setTimeout(turn, 300);
    dome._t = Number(sky[1]) * 60 + Number(sky[2]);
    dome.paint();
  };
  turn();
}

// ?width=390 draws the page at a phone's width inside a wider window (headless Chrome won't open one
// narrower than about 500 px), centred; tools/shoot.mjs crops the rest away.
const narrow = Number(params.get("width"));
if (narrow) Object.assign(document.body.style, { width: `${narrow}px`, margin: "0 auto", overflowX: "clip" });
