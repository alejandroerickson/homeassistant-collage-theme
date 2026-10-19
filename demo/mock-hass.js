// A pretend Home Assistant for the demo: made-up entities, ten days of made-up history, and service
// calls that change the pretend states. Nothing here talks to a real house. The history is seeded,
// so the demo looks the same on every load of the same day.

const H = 3600000, M = 60000, D = 86400000;

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
const day0 = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const iso = (t) => new Date(t).toISOString();

// The demo's home point is a well-known place in the viewer's time zone, so the sun card's clock
// agrees with the sky. Anywhere else, it is the middle of Clamart, near Paris, where Jean Arp and
// Sophie Taeuber-Arp lived and worked.
const PLACES = {
  "America/Los_Angeles": [37.7764, -122.4346], "America/Vancouver": [37.7764, -122.4346], "America/Denver": [39.7392, -104.9903], "America/Chicago": [41.8781, -87.6298],
  "America/New_York": [40.6782, -73.9442], "America/Toronto": [43.6532, -79.3832], "Asia/Tokyo": [35.6762, 139.6503],
  "Australia/Sydney": [-33.8688, 151.2093], "Europe/London": [51.5072, -0.1276],
};
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const place = PLACES[zone] || [48.8003, 2.2662];
export const HOME = { latitude: place[0], longitude: place[1] };

// The sun's height at the home point (degrees), as the cards compute it.
function sunEl(t) {
  const rad = Math.PI / 180, d = t / 86400000 - 10957.5;
  const g = (357.529 + 0.98560028 * d) * rad, q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad, e = (23.439 - 0.00000036 * d) * rad;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
  const Hh = ((18.697374558 + 24.06570982441908 * d) * 15 + HOME.longitude) * rad - ra, la = HOME.latitude * rad;
  return Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(Hh)) / rad;
}
// The next time after t the sun crosses the horizon going up (or down).
function crossing(t, up) {
  for (let u = t; u < t + 2 * D; u += M) if ((sunEl(u) > -0.833) !== (sunEl(u + M) > -0.833) && (sunEl(u + M) > -0.833) === up) return u + M;
  return t + D;
}

// ---- history: [t, state, attributes?] per entity, oldest first ----

const DAYS = 10;
function spansFor(seed, now, perDay) {
  const r = rng(seed), out = [];
  for (let d = DAYS; d >= 0; d--) {
    const base = day0(now) - d * D;
    for (const [from, to, chance, minLen, maxLen] of perDay) {
      if (r() > chance) continue;
      const a = base + (from + r() * (to - from)) * H, b = a + (minLen + r() * (maxLen - minLen)) * M;
      if (a < now) out.push([a, Math.min(b, now)]);
    }
  }
  return out.sort((x, y) => x[0] - y[0]);
}
// On/off points from spans; the last span may still be running.
function onOff(spans, now, on = "on", off = "off", attrs) {
  const pts = [[now - DAYS * D - D, off, attrs && attrs(false)]];
  for (const [a, b] of spans) {
    pts.push([a, on, attrs && attrs(true, a)]);
    if (b < now) pts.push([b, off, attrs && attrs(false, b)]);
  }
  return pts;
}
function wave(seed, now, every, f) {
  const r = rng(seed), pts = [];
  for (let t = now - DAYS * D - D; t <= now; t += every) pts.push([t, f(t, r)]);
  return pts;
}
const hourOf = (t) => { const d = new Date(t); return d.getHours() + d.getMinutes() / 60; };

export function makeHome(now = Date.now()) {
  const hist = {};
  const states = {};
  const put = (id, state, attributes = {}, changed) => {
    const t = iso(changed ?? now);
    states[id] = { entity_id: id, state: String(state), attributes, last_changed: t, last_updated: t, context: { id: "demo" } };
  };
  // An entity whose state is the end of its history.
  const fromHistory = (id, pts, attributes = {}) => {
    hist[id] = pts;
    const last = pts[pts.length - 1];
    let since = last[0];
    for (let i = pts.length - 1; i > 0 && pts[i - 1][1] === last[1]; i--) since = pts[i - 1][0];
    put(id, last[1], { ...attributes, ...(last[2] || {}) }, since);
  };

  // Lights and a switch, each with an evening and a morning.
  const lights = [
    ["light.living_room", "Living room", true, [[17.5, 19.5, 0.95, 90, 260], [6.5, 7.5, 0.6, 20, 70]]],
    ["light.kitchen", "Kitchen", true, [[17, 18.5, 0.9, 40, 140], [6.8, 7.8, 0.8, 15, 45]]],
    ["light.dining_room", "Dining room", true, [[18, 19, 0.85, 50, 120]]],
    ["switch.basement", "Basement", false, [[19.5, 21, 0.5, 30, 150], [10, 15, 0.3, 20, 90]]],
  ];
  for (const [id, name, dim, plan] of lights) {
    let spans = spansFor(id, now, plan);
    // The living room is on now, the others as their record says.
    if (id === "light.living_room") spans = [...spans.filter(([, b]) => b < now - 70 * M), [now - 52 * M, now + H]];
    if (id === "light.kitchen") spans = spans.filter(([, b]) => b < now - 30 * M);
    const attrs = (on) => (dim ? { supported_color_modes: ["brightness"], color_mode: on ? "brightness" : null, brightness: on ? 166 : null } : {});
    fromHistory(id, onOff(spans, now, "on", "off", attrs), { friendly_name: name });
  }
  put("light.porch", "off", { friendly_name: "Porch lights", supported_color_modes: ["onoff"] }, now - 9 * H);

  // Temperatures: inside follows the furnace, outside follows the day.
  const outside = (t, r) => +(9 + 5 * Math.sin(((hourOf(t) - 9) / 24) * 2 * Math.PI) + (r() - 0.5) * 0.6).toFixed(1);
  fromHistory("sensor.outside_temperature", wave("out", now, 30 * M, outside), { friendly_name: "Outside temperature", unit_of_measurement: "°C", device_class: "temperature" });
  const heatSpans = spansFor("furnace", now, [[5.5, 6.5, 1, 30, 70], [11, 13, 0.7, 15, 40], [16, 18, 1, 30, 80], [21, 22, 0.6, 15, 30]]);
  const inside = (t, r) => {
    const h = hourOf(t), set = h >= 6 && h < 22.5 ? 20.5 : 17.5;
    return +(set - 0.6 + 0.9 * Math.sin((h / 24) * 2 * Math.PI - 1.4) + (r() - 0.5) * 0.25).toFixed(1);
  };
  fromHistory("sensor.inside_temperature", wave("in", now, 20 * M, inside), { friendly_name: "Inside temperature", unit_of_measurement: "°C", device_class: "temperature" });
  const insideNow = Number(states["sensor.inside_temperature"].state);
  const heatingNow = heatSpans.some(([a, b]) => a <= now && b >= now);
  const climatePts = [[now - DAYS * D - D, "heat", { hvac_action: "idle" }]];
  for (const [a, b] of heatSpans) { climatePts.push([a, "heat", { hvac_action: "heating" }]); if (b < now) climatePts.push([b, "heat", { hvac_action: "idle" }]); }
  hist["climate.thermostat"] = climatePts;
  put("climate.thermostat", "heat", { friendly_name: "Thermostat", hvac_modes: ["heat", "off"], hvac_action: heatingNow ? "heating" : "idle",
    temperature: 20.5, current_temperature: insideNow, target_temp_step: 0.5, min_temp: 7, max_temp: 30, supported_features: 1 }, now - 3 * D);
  fromHistory("sensor.living_room_humidity", wave("hum", now, 20 * M, (t, r) => +(44 + 7 * Math.sin((hourOf(t) / 24) * 2 * Math.PI) + (r() - 0.5) * 2).toFixed(0)),
    { friendly_name: "Living room humidity", unit_of_measurement: "%", device_class: "humidity" });
  fromHistory("sensor.home_power", wave("pow", now, 10 * M, (t, r) => Math.round(280 + (hourOf(t) > 17 && hourOf(t) < 21 ? 1400 : 200) * r() + (r() > 0.93 ? 2200 : 0))),
    { friendly_name: "House power", unit_of_measurement: "W", device_class: "power" });

  // Weather, with forecasts the card subscribes to.
  const outNow = Number(states["sensor.outside_temperature"].state);
  hist["weather.home"] = hist["sensor.outside_temperature"].map(([t, v]) => [t, "partlycloudy", { temperature: v }]);
  put("weather.home", "partlycloudy", { friendly_name: "Home", temperature: outNow, apparent_temperature: outNow - 2, humidity: 71, wind_speed: 14,
    wind_speed_unit: "km/h", temperature_unit: "°C", precipitation_unit: "mm", pressure: 1012, supported_features: 3 }, now - 2 * H);

  // The sun, where it really is over the home point.
  const el = sunEl(now), up = el > -0.833;
  put("sun.sun", up ? "above_horizon" : "below_horizon", { friendly_name: "Sun", next_rising: iso(crossing(now, true)), next_setting: iso(crossing(now, false)),
    elevation: +el.toFixed(1), azimuth: 180 }, now - 2 * H);

  // A top-down bottom-up shade: two rails.
  put("cover.shade_top_rail", "open", { friendly_name: "Top rail", current_position: 100, supported_features: 15 }, now - 6 * H);
  put("cover.shade_bottom_rail", "open", { friendly_name: "Bottom rail", current_position: 40, supported_features: 15 }, now - 6 * H);

  // Batteries, a device that isn't answering, the host and backups.
  for (const [id, name, v] of [["sensor.front_door_lock_battery", "Front door lock battery", 82], ["sensor.hall_motion_battery", "Hall motion battery", 54],
    ["sensor.garden_sensor_battery", "Garden sensor battery", 33], ["sensor.attic_smoke_battery", "Attic smoke alarm battery", 12], ["sensor.shed_door_battery", "Shed door battery", "unavailable"]])
    put(id, v, { friendly_name: name, unit_of_measurement: "%", device_class: "battery" }, now - 5 * H);
  put("binary_sensor.shed_door", "unavailable", { friendly_name: "Shed door" }, now - 2 * D);
  put("sensor.system_cpu", 11, { friendly_name: "Processor use", unit_of_measurement: "%" });
  put("sensor.system_memory", 47, { friendly_name: "Memory use", unit_of_measurement: "%" });
  put("sensor.backup_last_successful_automatic_backup", iso(day0(now) + 4.75 * H - (now < day0(now) + 4.75 * H ? D : 0)), { friendly_name: "Last automatic backup", device_class: "timestamp" });

  // Music.
  const art = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#1F3D8C"/><rect x="14" y="62" width="58" height="44" fill="#F2B705"/><circle cx="82" cy="44" r="26" fill="#E8632B"/><rect x="70" y="80" width="38" height="8" fill="#141414"/><path d="M18,20 C30,8 52,14 50,30 C48,44 26,46 18,20 Z" fill="#E9A3B8"/></svg>`)}`;
  put("media_player.living_room_speaker", "playing", { friendly_name: "Living room speaker", media_title: "Squares Arranged by Chance", media_artist: "The Dada Quartet",
    media_album_name: "Cut Paper", media_duration: 254, media_position: 71, media_position_updated_at: iso(now - 4000), volume_level: 0.34, entity_picture: art,
    supported_features: 1 | 4 | 16 | 32 | 128 | 256 | 16384 }, now - 3 * M);

  put("lock.front_door", "locked", { friendly_name: "Front door lock" }, now - 2.6 * H);

  // People: two at home, one at work.
  put("person.kim", "home", { friendly_name: "Kim" }, now - 3.2 * H);
  put("person.sam", "home", { friendly_name: "Sam" }, now - 50 * M);
  put("person.lee", "Work", { friendly_name: "Lee" }, now - 6.5 * H);

  // Doors, an alarm and a leak sensor.
  const doors = [["binary_sensor.front_door", "Front door", 9], ["binary_sensor.back_door", "Back door", 14], ["binary_sensor.patio_door", "Patio door", 4], ["binary_sensor.garage_door", "Garage door", 3]];
  for (const [id, name, perDay] of doors) {
    const plan = Array.from({ length: perDay }, (_, i) => [6.5 + (i * 15) / perDay, 6.5 + ((i + 1) * 15) / perDay, 0.85, 0.15, id.includes("patio") ? 25 : 6]);
    let spans = spansFor(id, now, plan);
    if (id === "binary_sensor.back_door") spans = [...spans.filter(([, b]) => b < now - 10 * M), [now - 4 * M, now + H]];
    else spans = spans.filter(([, b]) => b < now - 5 * M);
    fromHistory(id, onOff(spans, now), { friendly_name: name, device_class: "door" });
  }
  const armed = spansFor("alarm", now, [[8.5, 9.5, 0.7, 300, 480], [23, 23.5, 0.9, 400, 450]]).filter(([, b]) => b < now);
  fromHistory("alarm_control_panel.home", onOff(armed, now, "armed_away", "disarmed"), { friendly_name: "Home alarm" });
  put("binary_sensor.basement_leak", "off", { friendly_name: "Basement leak", device_class: "moisture" }, now - 8 * D);

  // A toothbrush, twice a day.
  const runs = spansFor("brush", now, [[7, 7.6, 0.95, 1.6, 2.4], [19.8, 20.6, 0.9, 1.4, 2.3]]).filter(([, b]) => b < now);
  fromHistory("sensor.toothbrush", onOff(runs, now, "running", "idle"), { friendly_name: "Toothbrush" });
  const hard = runs.filter((_, i) => i % 3 === 0).map(([a]) => [a + 40000, a + 52000]);
  hist["sensor.toothbrush_pressure"] = [[now - 11 * D, "normal"], ...hard.flatMap(([a, b]) => [[a, "high"], [b, "normal"]])];
  put("sensor.toothbrush_pressure", "normal", { friendly_name: "Toothbrush pressure" });
  put("sensor.toothbrush_duration", 0, { friendly_name: "Toothbrush duration", unit_of_measurement: "s" });
  put("sensor.toothbrush_brushing_mode", "daily_clean", { friendly_name: "Toothbrush mode" });
  put("sensor.toothbrush_sector", "no_sector", { friendly_name: "Toothbrush sector" });
  put("sensor.toothbrush_number_of_sectors", 4, { friendly_name: "Toothbrush sectors" });
  put("sensor.toothbrush_battery", 64, { friendly_name: "Toothbrush battery", unit_of_measurement: "%" });

  // A GE range on SmartHQ, entity prefix "range": dinner most nights, the oven some.
  const P = "range";
  const burners = [["left_front", 0.7, 75], ["left_rear", 0.4, 50], ["center_rear", 0.15, null], ["right_front", 0.85, 60], ["right_rear", 0.3, 40]];
  const cookAll = [];
  for (const [b, chance, pct] of burners) {
    let spans = spansFor(`${P}${b}`, now, [[17.4, 18.4, chance, 8, 40], [7.2, 8, chance * 0.4, 4, 12]]).filter(([, e]) => e < now - 20 * M);
    if (b === "right_front") spans.push([now - 11 * M, now + H]);
    cookAll.push(...spans);
    fromHistory(`binary_sensor.${P}_cooktop_status_${b}_on`, onOff(spans, now), { friendly_name: `Cooktop ${b.replace("_", " ")}` });
    if (pct != null) fromHistory(`sensor.${P}_cooktop_status_${b}_power_pct`, onOff(spans, now, String(pct), "0"), { friendly_name: `Cooktop ${b.replace("_", " ")} power`, unit_of_measurement: "%" });
  }
  const merged = cookAll.sort((a, b) => a[0] - b[0]).reduce((o, s) => { const l = o[o.length - 1]; if (l && s[0] <= l[1]) l[1] = Math.max(l[1], s[1]); else o.push([...s]); return o; }, []);
  fromHistory(`binary_sensor.${P}_cooktop_status`, onOff(merged, now), { friendly_name: "Cooktop" });
  for (const [o, chance] of [["upper", 0.45], ["lower", 0.15]]) {
    let spans = spansFor(`${P}${o}`, now, [[17, 18, chance, 30, 70]]).filter(([, e]) => e < now - 30 * M);
    if (o === "upper") spans.push([now - 26 * M, now + H]);
    fromHistory(`sensor.${P}_${o}_oven_current_state`, onOff(spans, now, "Bake", "Off"), { friendly_name: `${o} oven state` });
    fromHistory(`sensor.${P}_${o}_oven_cook_mode`, onOff(spans, now, o === "upper" ? "Bake (375°C)" : "Bake (350°C)", "Off"), { friendly_name: `${o} oven mode` });
    put(`select.${P}_${o}_oven_light`, "Off", { friendly_name: `${o} oven light`, options: ["Off", "High"] });
    put(`sensor.${P}_${o}_oven_cook_time_remaining`, o === "upper" ? 0.5 : 0, { friendly_name: `${o} oven time left`, unit_of_measurement: "h" });
    put(`sensor.${P}_${o}_oven_kitchen_timer`, 0, { friendly_name: `${o} oven timer` });
    put(`water_heater.${P}_${o === "upper" ? "oven" : "lower_oven"}`, o === "upper" ? "Bake" : "Off", { friendly_name: `${o === "upper" ? "Upper" : "Lower"} oven` });
  }

  return { states, hist };
}

// The forecasts a weather card subscribes to: 24 hours with a shower in the afternoon, five days.
function forecast(type, now) {
  const r = rng(`fc${type}`), start = Math.ceil(now / H) * H;
  if (type === "hourly") return Array.from({ length: 24 }, (_, i) => {
    const t = start + i * H, h = new Date(t).getHours(), rain = h >= 14 && h <= 17 ? +(r() * 2.2).toFixed(1) : 0;
    return { datetime: iso(t), condition: rain ? "rainy" : h > 19 || h < 7 ? "clear-night" : "partlycloudy", temperature: +(9 + 5 * Math.sin(((h - 9) / 24) * 2 * Math.PI)).toFixed(1),
      precipitation: rain, precipitation_probability: rain ? 70 : h === 13 || h === 18 ? 35 : 5 };
  });
  const conds = ["partlycloudy", "rainy", "cloudy", "sunny", "pouring", "snowy-rainy", "windy-variant"];
  return Array.from({ length: 6 }, (_, i) => ({ datetime: iso(day0(now) + i * D + 12 * H), condition: conds[i], temperature: 14 - i + Math.round(r() * 3), templow: 5 - Math.round(i / 2),
    precipitation_probability: [10, 80, 40, 0, 90, 60][i] }));
}

// The hass object the cards are given, and a way to change it.
export function makeHass(onChange) {
  const now = Date.now();
  const { states, hist } = makeHome(now);
  const hass = {
    states,
    config: { ...HOME, unit_system: { temperature: "°C", length: "km" }, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone, version: "demo" },
    user: { name: "Demo", is_admin: true },
    language: "en",
    themes: { darkMode: false },
    callWS: async (msg) => {
      if (msg.type === "history/history_during_period") {
        const from = Date.parse(msg.start_time), out = {};
        for (const id of msg.entity_ids) {
          const pts = hist[id];
          if (!pts) { if (states[id]) out[id] = [{ s: states[id].state, lu: from / 1000, a: states[id].attributes }]; continue; }
          let i = pts.findIndex(([t]) => t >= from);
          if (i < 0) i = pts.length;
          const list = pts.slice(Math.max(0, i - 1)).map(([t, s, a], k) => ({ s, lu: (k === 0 && i > 0 ? from : t) / 1000, ...(msg.no_attributes ? {} : { a: a || {} }) }));
          out[id] = list;
        }
        return out;
      }
      if (msg.type === "recorder/statistics_during_period") return {};
      if (msg.type === "backup/info") return { backups: [
        { date: iso(now - 15 * H), with_automatic_settings: true, agents: { "backup.local": {}, "hassio.nas": {} } },
        { date: iso(now - 9 * D), with_automatic_settings: false, agents: { "backup.local": {} } }] };
      throw new Error(`The demo doesn't answer ${msg.type}`);
    },
    callService: async (domain, service, data = {}) => {
      const ids = [].concat(data.entity_id || []);
      for (const id of ids) {
        const s = states[id];
        if (!s) continue;
        const set = (state, attrs = {}) => { const t = new Date().toISOString(); states[id] = { ...s, state: String(state), attributes: { ...s.attributes, ...attrs }, last_changed: state === s.state ? s.last_changed : t, last_updated: t }; };
        const on = s.state === "on";
        if (service === "toggle") set(on ? "off" : "on", s.attributes.supported_color_modes ? { brightness: on ? null : 200 } : {});
        else if (service === "turn_on") set(id.startsWith("media_player") ? "playing" : "on", data.brightness_pct ? { brightness: Math.round(data.brightness_pct * 2.55) } : {});
        else if (service === "turn_off") set("off");
        else if (service === "lock") set("locked");
        else if (service === "unlock") set("unlocked");
        else if (service === "media_play_pause") set(s.state === "playing" ? "paused" : "playing", { media_position_updated_at: new Date().toISOString() });
        else if (service === "volume_set") set(s.state, { volume_level: data.volume_level });
        else if (service === "set_temperature") set(s.state, { temperature: data.temperature });
        else if (service === "set_hvac_mode") set(data.hvac_mode, { hvac_action: data.hvac_mode === "off" ? "off" : "idle" });
        else if (service === "set_cover_position") setTimeout(() => { states[id] = { ...states[id], attributes: { ...states[id].attributes, current_position: data.position } }; onChange(); }, 1500);
        else if (service === "select_option") set(data.option);
      }
      if (domain === "light" && service === "turn_off" && !ids.length) for (const id of Object.keys(states)) if (id.startsWith("light.")) states[id] = { ...states[id], state: "off" };
      onChange();
    },
    connection: {
      subscribeMessage: async (cb, msg) => {
        if (msg.type === "weather/subscribe_forecast") setTimeout(() => cb({ type: msg.forecast_type, forecast: forecast(msg.forecast_type, now) }), 50);
        return () => {};
      },
    },
  };
  return hass;
}
