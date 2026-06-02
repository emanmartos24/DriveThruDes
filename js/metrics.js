/**
 * metrics.js
 * Live metric DOM updates, utilisation bars, warning banners,
 * and bottleneck detection.
 */

/* ─── Main Metrics Update ────────────────────────────────────────────────── */

/** Called every animation frame to refresh all right-panel values. */
function updateMetrics() {
  const avgCycle   = sim.stats.served ? sim.stats.totalCycle / sim.stats.served : 0;
  const avgWait    = sim.stats.served ? sim.stats.totalWait  / sim.stats.served : 0;
  const throughput = sim.time > 0 ? sim.stats.served / sim.time * 60 : 0;

  // Numeric values
  $("mCycle").textContent      = avgCycle.toFixed(1);
  $("mWait").textContent       = avgWait.toFixed(1);
  $("mQueue").textContent      = sim.queues.order.length;
  $("mServed").textContent     = sim.stats.served;
  $("mThroughput").textContent = Math.round(throughput);
  $("mLong").textContent       = sim.stats.longDelays;
  $("mInSystem").textContent   = totalInSystem();
  $("mPeakQueue").textContent  = sim.stats.peakQueue;
  $("mEvents").textContent     = sim.stats.events;
  $("mScenario").textContent   = scenario().label.replace(" Layout", "");

  // Colour coding
  $("mCycle").className = "metric-val " + (avgCycle > 8   ? "red" : avgCycle > 5   ? "yellow" : "green");
  $("mWait").className  = "metric-val " + (avgWait  > 3.5 ? "red" : avgWait  > 1.5 ? "yellow" : "");

  const cap = Number($("queueCap").value);
  $("mQueue").className = "metric-val " +
    (sim.queues.order.length > cap * .8  ? "red"    :
     sim.queues.order.length > cap * .5  ? "yellow" : "");

  // Sim clock
  $("simClock").textContent = formatSimTime(sim.time);

  // Station utilisation bars
  setUtil("order",   "uOrder",   "uOrderBar");
  setUtil("payment", "uPay",     "uPayBar");
  setUtil("kitchen", "uKitchen", "uKitchenBar");
  setUtil("pickup",  "uPickup",  "uPickupBar");

  updateWarnings();
}

/* ─── Utilisation Bar Helper ─────────────────────────────────────────────── */

const UTIL_BASE_COLORS = {
  order: "var(--blue)", payment: "var(--purple)",
  kitchen: "var(--green)", pickup: "var(--orange)"
};

/**
 * Update a single station's utilisation percentage text and progress bar.
 * @param {string} k       Resource key
 * @param {string} textId  DOM id for the percentage label
 * @param {string} barId   DOM id for the fill bar element
 */
function setUtil(k, textId, barId) {
  const pct = sim.time > 0 ? Math.min(100, Math.round(sim.stats.util[k] / sim.time * 100)) : 0;
  $(textId).textContent  = pct + "%";
  const bar              = $(barId);
  bar.style.width        = pct + "%";
  bar.style.background   = pct > 88 ? "var(--red)" : pct > 68 ? "var(--yellow)" : UTIL_BASE_COLORS[k];
}

/* ─── Warning Banners ────────────────────────────────────────────────────── */

/** Show/hide congestion + bottleneck alerts based on current sim state. */
function updateWarnings() {
  const cap = Number($("queueCap").value);

  // Congestion overlay on canvas
  $("congestionWarn").classList.toggle("visible", sim.queues.order.length >= cap * .85);

  // Bottleneck card
  const labels = { order: "Order station", payment: "Payment window", kitchen: "Kitchen", pickup: "Pickup window" };
  const utils  = ["order", "payment", "kitchen", "pickup"]
    .map(k => ({
      k,
      pct: sim.time > 0 ? Math.round(sim.stats.util[k] / sim.time * 100) : 0
    }))
    .sort((a, b) => b.pct - a.pct);

  const top = utils[0];
  if (top && (top.pct >= 85 || sim.queues[top.k].length >= 3)) {
    $("bottleneckCard").classList.add("visible");
    $("bottleneckText").textContent = `${labels[top.k]} is the current constraint at ${top.pct}% utilization.`;
  } else {
    $("bottleneckCard").classList.remove("visible");
  }
}
