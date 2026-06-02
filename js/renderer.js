/**
 * renderer.js
 * All canvas drawing functions:
 *   draw()           – master frame render
 *   drawRoad()       – road surface & lane markings
 *   drawBuilding()   – restaurant building graphic
 *   drawStations()   – order / payment / pickup / kitchen station boxes
 *   stationBox()     – individual station helper
 *   drawCar()        – individual car sprite
 *   drawCanvasHud()  – corner info badges (QUEUE, IN SYSTEM, SERVED, TARGET)
 *   roundRect()      – canvas rounded-rectangle utility
 *   shade()          – hex colour darkening utility
 */

/* ─── Master Frame ───────────────────────────────────────────────────────── */

function draw() {
  const area = $("canvasArea");
  const w = area.clientWidth, h = area.clientHeight;
  ctx.clearRect(0, 0, w, h);

  // Background gradient
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0e121b"); g.addColorStop(1, "#141923");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  drawRoad(w, h);
  drawBuilding(w, h);
  drawStations();
  sim.cars.forEach(car => drawCar(car));
  drawCanvasHud(w);
}

/* ─── Road ───────────────────────────────────────────────────────────────── */

function drawRoad(w, h) {
  const y = layout.order.y - 44, rh = 92;

  // Road surface
  ctx.fillStyle = "#1d2534"; ctx.fillRect(0, y, w, rh);

  // Centre dashed line
  ctx.strokeStyle = "rgba(245,200,66,.30)";
  ctx.setLineDash([28, 18]); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, layout.order.y); ctx.lineTo(w, layout.order.y); ctx.stroke();
  ctx.setLineDash([]);

  // Edge lines
  ctx.strokeStyle = "rgba(255,255,255,.07)";
  ctx.beginPath();
  ctx.moveTo(0, y);        ctx.lineTo(w, y);
  ctx.moveTo(0, y + rh);  ctx.lineTo(w, y + rh);
  ctx.stroke();

  // Direction arrows
  ctx.fillStyle = "rgba(255,255,255,.10)";
  ctx.font = "18px Arial"; ctx.textAlign = "center";
  [0.22, 0.47, 0.72].forEach(p => ctx.fillText(">", w * p, layout.order.y + 26));
}

/* ─── Building ───────────────────────────────────────────────────────────── */

function drawBuilding(w, h) {
  const bx = w * .37, by = Math.max(26, layout.order.y - 210), bw = w * .52, bh = 145;

  roundRect(bx, by, bw, bh, 8, "#1e2840", "rgba(77,159,255,.18)");
  roundRect(bx + 22, by + 20, bw - 44, 38, 6, "rgba(0,0,0,.38)");

  // Sign
  ctx.fillStyle = "#f5c842";
  ctx.font = "800 16px Segoe UI, Arial"; ctx.textAlign = "center";
  ctx.fillText("QuickByte Drive-Thru", bx + bw / 2, by + 45);

  // Windows
  for (let i = 0; i < 4; i++) {
    const x = bx + bw * (.18 + i * .18);
    roundRect(x - 14, by + 74, 28, 36, 3, "rgba(77,159,255,.10)", "rgba(77,159,255,.20)");
  }
}

/* ─── Stations ───────────────────────────────────────────────────────────── */

function drawStations() {
  stationBox(layout.order.x,   layout.order.y   - 48, 54, 66,  "ORDER",   "#4d9fff", "order",   "O");
  stationBox(layout.payment.x, layout.payment.y - 48, 78, 62,  "PAYMENT", "#a78bfa", "payment", "$");
  stationBox(layout.pickup.x,  layout.pickup.y  - 48, 78, 62,  "PICKUP",  "#ff8c42", "pickup",  "BAG");
  stationBox(layout.kitchen.x, layout.kitchen.y - 30, 124, 64, "KITCHEN", "#22c87a", "kitchen", "COOK");

  // Queue labels
  ["queue", "order", "payment", "pickup"].forEach(k => {
    ctx.fillStyle = k === "queue" ? "rgba(255,255,255,.35)" : "#a5abbd";
    ctx.font = "10px Consolas, monospace"; ctx.textAlign = "center";
    ctx.fillText(k === "queue" ? "FIFO QUEUE" : k.toUpperCase(), layout[k].x, layout[k].y + 72);
  });
}

/**
 * Render a single station box with active-glow, capacity badge, and status dot.
 */
function stationBox(x, y, w, h, label, color, resourceName, icon) {
  const resource = sim.resources[resourceName];
  const active   = resource.busy > 0;

  ctx.save();
  if (active) { ctx.shadowColor = color; ctx.shadowBlur = 12; }

  roundRect(x - w / 2, y, w, h, 6,
    active ? color + "22"            : "rgba(25,30,44,.92)",
    active ? color                   : "rgba(255,255,255,.12)");

  ctx.shadowBlur   = 0;
  ctx.fillStyle    = active ? color : "rgba(255,255,255,.42)";
  ctx.font         = "800 13px Segoe UI, Arial"; ctx.textAlign = "center";
  ctx.fillText(icon, x, y + h / 2 - 2);

  ctx.font = "9px Consolas, monospace";
  ctx.fillText(label, x, y + h - 10);

  // Capacity badge
  const badgeText = `${resource.busy}/${resource.cap}`;
  const badgeW    = 28;
  roundRect(x + w / 2 - badgeW - 4, y + 4, badgeW, 16, 8,
    "rgba(13,15,20,.82)", active ? color : "rgba(255,255,255,.18)");
  ctx.fillStyle = active ? color : "#a5abbd";
  ctx.font      = "800 9px Consolas, monospace";
  ctx.fillText(badgeText, x + w / 2 - badgeW / 2 - 4, y + 15);

  // Active indicator dot
  if (active) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x + w / 2 - 8, y + 9, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ─── Car Sprite ─────────────────────────────────────────────────────────── */

/** Car state → indicator dot colour mapping. */
const STATE_COLORS = {
  wait_order: "#f5c842", ordering: "#4d9fff",
  wait_payment: "#a78bfa", paying: "#a78bfa",
  wait_pickup: "#ff8c42", pickup: "#22c87a", departing: "#22c87a"
};

function drawCar(car) {
  const w = 52, h = 28;
  ctx.save();
  ctx.translate(car.x, car.y);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,.34)";
  ctx.beginPath(); ctx.ellipse(0, h / 2 + 5, w * .42, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Body
  roundRect(-w / 2, -h / 2, w, h, 7, car.color);
  // Roof / windscreen
  roundRect(-w / 2 + 9,  -h / 2 - 9, w - 18, 16, 5, shade(car.color, -28));
  roundRect(-w / 2 + 12, -h / 2 - 7, 16, 11, 2, "rgba(190,225,255,.28)");
  roundRect(w / 2 - 27,  -h / 2 - 7, 15, 11, 2, "rgba(190,225,255,.20)");

  // Wheels
  ctx.fillStyle = "#171a22";
  [-16, 16].forEach(px => [-13, 13].forEach(py => {
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
  }));

  // ID plate
  roundRect(-13, -6, 26, 14, 3, "rgba(0,0,0,.52)");
  ctx.fillStyle = car.color;
  ctx.font = "800 8px Consolas"; ctx.textAlign = "center";
  ctx.fillText("#" + car.id, 0, 4);

  // State indicator dot
  ctx.fillStyle = STATE_COLORS[car.state] || "#a5abbd";
  ctx.beginPath(); ctx.arc(22, -19, 4, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

/* ─── Canvas HUD ─────────────────────────────────────────────────────────── */

function drawCanvasHud(w) {
  const items = [
    ["QUEUE",     sim.queues.order.length,
      sim.queues.order.length > Number($("queueCap").value) * .75 ? "#ff4f4f" : "#e8eaf0"],
    ["IN SYSTEM", totalInSystem(),          "#e8eaf0"],
    ["SERVED",    sim.stats.served,         "#22c87a"],
    ["TARGET",    scenario().target.toFixed(2) + "m", "#4d9fff"]
  ];
  let x = 12;
  items.forEach(([label, val, color]) => {
    roundRect(x, 12, 88, 38, 6, "rgba(13,15,20,.72)", "rgba(255,255,255,.07)");
    ctx.fillStyle = "rgba(255,255,255,.42)"; ctx.font = "9px Consolas"; ctx.textAlign = "left";
    ctx.fillText(label, x + 8, 27);
    ctx.fillStyle = color; ctx.font = "800 15px Consolas";
    ctx.fillText(val, x + 8, 45);
    x += 96;
  });
}

/* ─── Canvas Utilities ───────────────────────────────────────────────────── */

/** Draw a rounded rectangle path, then fill and/or stroke. */
function roundRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

/** Return a lightened/darkened version of a hex colour. */
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (n & 255) + amount));
  return `rgb(${r},${g},${b})`;
}
