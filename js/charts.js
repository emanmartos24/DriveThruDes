/**
 * charts.js
 * Mini-chart rendering for Queue History and Cycle Time Trend panels.
 */

/* ─── Chart Contexts ─────────────────────────────────────────────────────── */

const qChart = $("queueChart").getContext("2d");
const cChart = $("cycleChart").getContext("2d");

/* ─── Top-level Chart Update ─────────────────────────────────────────────── */

/** Called every frame to refresh both mini-charts and their "now" labels. */
function drawCharts() {
  drawMiniChart(qChart, $("queueChart"), sim.history.queue, "#f5c842",
    Number($("queueCap").value), "bar",  Number($("queueCap").value), "cars");
  drawMiniChart(cChart, $("cycleChart"), sim.history.cycle, "#4d9fff",
    Math.max(8, scenario().target + 4), "line", scenario().target, "min");

  const lastQ = sim.history.queue.at(-1) ?? sim.queues.order.length;
  const lastC = sim.history.cycle.at(-1) ?? 0;
  $("queueNow").textContent = lastQ + " cars";
  $("cycleNow").textContent = lastC.toFixed(1) + " min";
}

/* ─── Generic Mini-Chart Renderer ────────────────────────────────────────── */

/**
 * Draw a single mini-chart (bar or line) with grid lines, axis labels,
 * and an optional target/capacity reference line.
 *
 * @param {CanvasRenderingContext2D} context  2D context for this chart canvas
 * @param {HTMLCanvasElement}        cvs      Chart canvas element
 * @param {number[]}                 data     Data series
 * @param {string}                   color    Series colour
 * @param {number}                   maxY     Y-axis ceiling (auto-expanded)
 * @param {"bar"|"line"}             mode     Chart type
 * @param {number}                   target   Reference line value (0 to disable)
 * @param {"cars"|"min"}             unit     Axis / tooltip unit
 */
function drawMiniChart(context, cvs, data, color, maxY, mode, target, unit) {
  const dpr  = window.devicePixelRatio || 1;
  const rect = cvs.getBoundingClientRect();
  cvs.width  = Math.max(1, Math.floor(rect.width  * dpr));
  cvs.height = Math.max(1, Math.floor(rect.height * dpr));
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width, h = rect.height;
  const left = 28, right = 6, top = 6, bottom = 18;
  const plotW = Math.max(1, w - left - right);
  const plotH = Math.max(1, h - top - bottom);
  context.clearRect(0, 0, w, h);
  maxY = Math.max(maxY, ...data, 1);

  // Grid lines + Y-axis labels
  context.font          = "10px Consolas, monospace";
  context.textAlign     = "right";
  context.textBaseline  = "middle";
  context.strokeStyle   = "rgba(255,255,255,.06)";
  context.fillStyle     = "#62697d";
  context.lineWidth     = 1;
  for (let i = 0; i <= 3; i++) {
    const value = maxY * (1 - i / 3);
    const y     = top + plotH * i / 3;
    context.beginPath(); context.moveTo(left, y); context.lineTo(left + plotW, y); context.stroke();
    context.fillText(formatTick(value, unit), left - 5, y);
  }

  // X-axis labels
  context.textAlign    = "left";
  context.textBaseline = "alphabetic";
  context.fillText("0", left, h - 3);
  context.textAlign = "right";
  context.fillText(data.length ? "now" : "", left + plotW, h - 3);

  if (!data.length) return;

  // Target / capacity reference line
  if (target) {
    const y = top + plotH - (target / maxY) * plotH;
    context.setLineDash([5, 4]);
    context.strokeStyle = unit === "cars" ? "rgba(255,79,79,.55)" : "rgba(34,200,122,.55)";
    context.beginPath(); context.moveTo(0, y); context.lineTo(w, y); context.stroke();
    context.setLineDash([]);
    context.fillStyle = unit === "cars" ? "#ff8f8f" : "#8ff0bd";
    context.font = "10px Consolas, monospace"; context.textAlign = "right";
    context.fillText(
      unit === "cars" ? "cap " + target : "target " + target.toFixed(2),
      w - 4, y - 4);
  }

  // Data series
  if (mode === "bar") {
    const bw = Math.max(2, plotW / data.length - 2);
    data.forEach((v, i) => {
      const x  = left + i * plotW / data.length;
      const bh = (v / maxY) * plotH;
      context.fillStyle    = v > Number($("queueCap").value) * .85 ? "#ff4f4f" : color;
      context.globalAlpha  = .75;
      context.fillRect(x, top + plotH - bh, bw, bh);
      context.globalAlpha  = 1;
    });
  } else {
    context.strokeStyle = color; context.lineWidth = 2;
    context.beginPath();
    data.forEach((v, i) => {
      const x = data.length === 1 ? left : left + i * plotW / (data.length - 1);
      const y = top + plotH - (v / maxY) * plotH;
      if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.stroke();
  }
}

/* ─── Axis Tick Formatter ────────────────────────────────────────────────── */

function formatTick(value, unit) {
  if (unit === "min") return value >= 10 ? value.toFixed(0) : value.toFixed(1);
  return Math.round(value);
}

/* ─── Chart Hover Tooltip ────────────────────────────────────────────────── */

/**
 * Attach mousemove/mouseleave listeners to a chart canvas for hover tooltips.
 * @param {HTMLCanvasElement} canvasEl    Target canvas
 * @param {function}          dataGetter  Returns current data array
 * @param {string}            label       Series display name
 * @param {string}            unit        Unit string ("cars" | "min")
 */
function bindChartHover(canvasEl, dataGetter, label, unit) {
  canvasEl.addEventListener("mousemove", (e) => {
    const data = dataGetter();
    const tip  = $("chartTip");
    if (!data.length) { tip.style.opacity = 0; return; }

    const rect  = canvasEl.getBoundingClientRect();
    const left  = 28, right = 6;
    const plotW = Math.max(1, rect.width - left - right);
    const x     = Math.max(left, Math.min(rect.width - right, e.clientX - rect.left));
    const pct   = (x - left) / plotW;
    const idx   = Math.max(0, Math.min(data.length - 1, Math.round(pct * (data.length - 1))));

    const value = data[idx];
    const time  = sim.history.t[idx] ?? 0;
    tip.innerHTML   = `<strong>${label}</strong>: ${unit === "min" ? Number(value).toFixed(1) : value} ${unit}<br>Sim minute: ${time}`;
    tip.style.left  = e.clientX + "px";
    tip.style.top   = (e.clientY - 10) + "px";
    tip.style.opacity = 1;
  });
  canvasEl.addEventListener("mouseleave", () => { $("chartTip").style.opacity = 0; });
}
