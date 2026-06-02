/**
 * events.js
 * Discrete Event Simulation core:
 *  - event scheduling (priority queue via sorted array)
 *  - event processing loop
 *  - utilisation tracking
 *  - individual event handlers (arrival, order, payment, kitchen, pickup)
 */

/* ─── Scheduler ──────────────────────────────────────────────────────────── */

/**
 * Push a future event into the sorted event queue.
 * @param {number} delay   Minutes from now
 * @param {string} type    Event type key
 * @param {number} id      Car ID (0 for global events like ARRIVAL)
 * @param {object} [data]  Optional payload
 */
function schedule(delay, type, id, data) {
  sim.events.push({ time: sim.time + Math.max(0, delay), type, id, data: data || {} });
  sim.events.sort((a, b) => a.time - b.time);
}

/* ─── Processing Loop ────────────────────────────────────────────────────── */

/**
 * Advance simulation by `dt` minutes, firing all events up to targetTime.
 * Called each animation frame.
 */
function processEvents(dt) {
  const targetTime = sim.time + dt;
  while (sim.events.length && sim.events[0].time <= targetTime) {
    const ev = sim.events.shift();
    updateUtil(ev.time);
    sim.time = ev.time;
    sim.stats.events++;
    handleEvent(ev);
  }
  updateUtil(targetTime);
  sim.time = targetTime;
}

/* ─── Utilisation Tracking ───────────────────────────────────────────────── */

/**
 * Accumulate busy-weighted time for each resource up to `untilTime`.
 * Stored as total busy-seconds for later % calculation.
 */
function updateUtil(untilTime) {
  const dt = Math.max(0, untilTime - sim.stats.lastUtilTime);
  if (dt <= 0) return;
  ["order", "payment", "kitchen", "pickup"].forEach(k => {
    const r = sim.resources[k];
    sim.stats.util[k] += dt * (r.busy / r.cap);
  });
  sim.stats.lastUtilTime = untilTime;
}

/* ─── Event Dispatcher ───────────────────────────────────────────────────── */

function handleEvent(ev) {
  if (ev.type === "ARRIVAL")      return arrival();
  const car = sim.cars.get(ev.id);
  if (!car) return;
  if (ev.type === "ORDER_DONE")   return finishOrder(car);
  if (ev.type === "PAYMENT_DONE") return finishPayment(car);
  if (ev.type === "KITCHEN_DONE") return finishKitchen(car);
  if (ev.type === "PICKUP_DONE")  return finishPickup(car);
}

/* ─── Car Helpers ────────────────────────────────────────────────────────── */

/** Accumulate waited time for a car that was in a waiting state. */
function addWait(car) {
  if (car.stageEnter !== null) car.wait += Math.max(0, sim.time - car.stageEnter);
  car.stageEnter = null;
}

/** Mark car as waiting in a named state and start the wait-time clock. */
function beginWaiting(car, state) {
  car.state      = state;
  car.stageEnter = sim.time;
}

/* ─── Event Handlers ─────────────────────────────────────────────────────── */

/** New vehicle arrives; joins the order FIFO queue. */
function arrival() {
  const id  = sim.nextId++;
  const car = makeCar(id);
  sim.cars.set(id, car);
  log("arr", `Car #${id} arrived and joined the FIFO line`);
  beginWaiting(car, "wait_order");
  sim.queues.order.push(id);
  sim.stats.peakQueue = Math.max(sim.stats.peakQueue, sim.queues.order.length);
  positionQueues();
  tryStart("order");
  schedule(arrivalInterval(), "ARRIVAL");
}

/**
 * Attempt to start service for the given resource type.
 * Dequeues cars while the resource has spare capacity.
 */
function tryStart(resourceName) {
  const r = sim.resources[resourceName];
  const q = sim.queues[resourceName];
  while (r.busy < r.cap && q.length) {
    const id  = q.shift();
    const car = sim.cars.get(id);
    if (!car || car.state === "departed") continue;
    addWait(car);
    r.busy++;
    if (resourceName === "order") {
      car.state = "ordering"; setTarget(car, layout.order);
      car.orderStart = sim.time;
      log("arr", `Car #${id} started ordering at ${formatSimTime()}`);
      schedule(serviceTime("order"), "ORDER_DONE", id);
    } else if (resourceName === "payment") {
      car.state = "paying"; setTarget(car, layout.payment);
      car.payStart = sim.time;
      log("arr", `Car #${id} started payment at ${formatSimTime()}`);
      schedule(serviceTime("payment"), "PAYMENT_DONE", id);
    } else if (resourceName === "kitchen") {
      car.kitchenStarted = true;
      car.kitchenStart = sim.time;
      schedule(serviceTime("kitchen") + serviceTime("staging"), "KITCHEN_DONE", id);
    } else if (resourceName === "pickup") {
      car.state = "pickup"; setTarget(car, layout.pickup);
      car.pickupStart = sim.time;
      log("arr", `Car #${id} reached pickup window at ${formatSimTime()}`);
      schedule(serviceTime("pickup"), "PICKUP_DONE", id);
    }
  }
  positionQueues();
}

/** Car finishes at the order station; releases resource, dispatches kitchen + payment concurrently. */
function finishOrder(car) {
  sim.resources.order.busy--;
  car.orderEnd = sim.time;
  log("arr", `Car #${car.id} completed order; kitchen ticket released`);
  sim.queues.kitchen.push(car.id);
  beginWaiting(car, "wait_payment");
  sim.queues.payment.push(car.id);
  setTarget(car, { x: layout.order.x + 68, y: layout.order.y });
  tryStart("order");
  tryStart("payment");
  tryStart("kitchen");
}

/** Car completes payment; checks whether food is also ready. */
function finishPayment(car) {
  sim.resources.payment.busy--;
  car.paymentDone = true;
  car.payEnd = sim.time;
  log("arr", `Car #${car.id} completed payment`);
  tryStart("payment");
  maybeQueuePickup(car);
}

/** Kitchen finishes preparing the order; checks whether payment is also done. */
function finishKitchen(car) {
  sim.resources.kitchen.busy--;
  car.foodReady = true;
  car.kitchenEnd = sim.time;
  log("arr", `Kitchen finished order for car #${car.id}`);
  tryStart("kitchen");
  maybeQueuePickup(car);
}

/**
 * Gate: car can only move to the pickup queue once both
 * payment is done AND kitchen order is ready.
 */
function maybeQueuePickup(car) {
  if (!car.paymentDone || !car.foodReady || car.queuedPickup || car.state === "departed") return;
  car.queuedPickup = true;
  beginWaiting(car, "wait_pickup");
  sim.queues.pickup.push(car.id);
  setTarget(car, { x: layout.payment.x + 70, y: layout.payment.y });
  tryStart("pickup");
}

/** Car receives its order and departs; records cycle & wait statistics. */
function finishPickup(car) {
  sim.resources.pickup.busy--;
  car.state = "departing";
  car.pickupEnd = sim.time;
  setTarget(car, layout.exit);
  const cycle = sim.time - car.arrival;
  sim.stats.served++;
  sim.stats.totalCycle += cycle;
  sim.stats.totalWait  += car.wait;
  if (cycle > 8) sim.stats.longDelays++;

  // Per-stage time breakdown
  const tOrder   = (car.orderEnd   !== null && car.orderStart   !== null) ? (car.orderEnd   - car.orderStart)   : 0;
  const tPay     = (car.payEnd     !== null && car.payStart     !== null) ? (car.payEnd     - car.payStart)     : 0;
  const tKitchen = (car.kitchenEnd !== null && car.kitchenStart !== null) ? (car.kitchenEnd - car.kitchenStart) : 0;
  const tPickup  = (car.pickupEnd  !== null && car.pickupStart  !== null) ? (car.pickupEnd  - car.pickupStart)  : 0;

  log("dep", `Car #${car.id} DEPARTED — cycle ${cycle.toFixed(2)} min ` +
    `[Order ${tOrder.toFixed(2)} | Pay ${tPay.toFixed(2)} | Kitchen ${tKitchen.toFixed(2)} | Pickup ${tPickup.toFixed(2)}]`);
  pushHistory();
  tryStart("pickup");
}

/** Record a snapshot of queue length and average cycle time in the rolling history. */
function pushHistory() {
  const avgCycle = sim.stats.served ? sim.stats.totalCycle / sim.stats.served : 0;
  sim.history.t.push(Math.round(sim.time));
  sim.history.queue.push(sim.queues.order.length);
  sim.history.cycle.push(Number(avgCycle.toFixed(2)));
  while (sim.history.t.length > 45) {
    sim.history.t.shift(); sim.history.queue.shift(); sim.history.cycle.shift();
  }
}
