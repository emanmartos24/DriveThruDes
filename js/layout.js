/**
 * layout.js
 * Canvas layout coordinates, resize handling,
 * car factory, car targeting, and queue positioning logic.
 */

/* ─── Globals ────────────────────────────────────────────────────────────── */

const canvas = $("simCanvas");
const ctx    = canvas.getContext("2d");
let layout   = {};   // recalculated on every resize

/* ─── Resize Handler ─────────────────────────────────────────────────────── */

/**
 * Recalculate canvas resolution and layout positions.
 * Called on window resize and once on load.
 */
function resize() {
  const area = $("canvasArea");
  const dpr  = window.devicePixelRatio || 1;

  canvas.width  = Math.floor(area.clientWidth  * dpr);
  canvas.height = Math.floor(area.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvas.style.width  = area.clientWidth  + "px";
  canvas.style.height = area.clientHeight + "px";

  const w = area.clientWidth, h = area.clientHeight;
  const roadY = h * .58;

  layout = {
    entry:   { x: -40,      y: roadY },
    queue:   { x: w * .16,  y: roadY },
    order:   { x: w * .34,  y: roadY },
    payment: { x: w * .56,  y: roadY },
    pickup:  { x: w * .77,  y: roadY },
    kitchen: { x: w * .66,  y: roadY - 120 },
    exit:    { x: w + 90,   y: roadY }
  };

  // Re-snap active cars to their stations after resize
  sim.cars.forEach(car => {
    if (car.state === "ordering") setTarget(car, layout.order);
    if (car.state === "paying")   setTarget(car, layout.payment);
    if (car.state === "pickup")   setTarget(car, layout.pickup);
  });

  positionQueues();
  draw();
  drawCharts();
}

/* ─── Car Factory ────────────────────────────────────────────────────────── */

const CAR_COLORS = [
  "#4d9fff","#22c87a","#f5c842","#ff8c42",
  "#a78bfa","#ff4f4f","#36d6e7","#14b8a6","#ec4899"
];

/**
 * Create a new car entity at the entry edge of the canvas.
 * @param {number} id  Unique simulation ID
 */
function makeCar(id) {
  return {
    id,
    color:        CAR_COLORS[(id - 1) % CAR_COLORS.length],
    arrival:      sim.time,
    wait:         0,
    stageEnter:   sim.time,
    paymentDone:  false,
    foodReady:    false,
    queuedPickup: false,
    kitchenStarted: false,
    state:        "arriving",
    // Per-stage timing (sim minutes)
    orderStart:   null,
    orderEnd:     null,
    payStart:     null,
    payEnd:       null,
    kitchenStart: null,
    kitchenEnd:   null,
    pickupStart:  null,
    pickupEnd:    null,
    x:  -80,
    y:  layout.entry ? layout.entry.y : 250,
    tx: layout.entry ? layout.entry.x : -40,
    ty: layout.entry ? layout.entry.y : 250
  };
}

/* ─── Target Positioning ─────────────────────────────────────────────────── */

/** Set the lerp target position for a car. */
function setTarget(car, p) {
  car.tx = p.x;
  car.ty = p.y;
}

/** Count all cars still in the system (not yet departed). */
function totalInSystem() {
  let n = 0;
  sim.cars.forEach(car => { if (car.state !== "departed") n++; });
  return n;
}

/* ─── Queue Visualisation Positioning ───────────────────────────────────── */

/**
 * Assign lerp targets to every queued car so they
 * form a visible line behind their respective station.
 */
function positionQueues() {
  // Order FIFO queue – cars stack left of the order station
  sim.queues.order.forEach((id, i) => {
    const car = sim.cars.get(id);
    if (car) setTarget(car, { x: layout.queue.x - i * 62, y: layout.queue.y });
  });

  // Payment holding area – cars stack right of the order station (lower lane)
  sim.queues.payment.forEach((id, i) => {
    const car = sim.cars.get(id);
    if (car) setTarget(car, { x: layout.order.x + 65 + i * 42, y: layout.order.y + 27 });
  });

  // Pickup holding area – cars stack right of the payment station (lower lane)
  sim.queues.pickup.forEach((id, i) => {
    const car = sim.cars.get(id);
    if (car) setTarget(car, { x: layout.payment.x + 62 + i * 42, y: layout.payment.y + 27 });
  });
}
