/**
 * state.js
 * Central simulation state object (sim) and stats initializer.
 * All modules read/write this shared object.
 */

const sim = {
  running:    false,
  paused:     false,
  time:       0,
  lastFrame:  0,
  speed:      1,
  seed:       375,
  scenario:   "baseline",
  events:     [],          // priority-sorted event queue
  nextId:     1,
  cars:       new Map(),   // id → car object
  resources:  {},          // resource pools (order, payment, kitchen, pickup)
  queues:     { order: [], payment: [], kitchen: [], pickup: [] },
  stats:      {},
  history:    { t: [], queue: [], cycle: [] },
  logCount:   0,
  anim:       null,        // rAF handle
  spawnClock: 0
};

/** Reset all runtime stats (called on init and reset). */
function resetStats() {
  sim.stats = {
    served:       0,
    totalCycle:   0,
    totalWait:    0,
    longDelays:   0,
    peakQueue:    0,
    events:       0,
    util:         { order: 0, payment: 0, kitchen: 0, pickup: 0 },
    lastUtilTime: 0
  };
}

/** Initialise / re-initialise resource pools from current UI values. */
function initResources() {
  sim.resources = {
    order:   { cap: Number($("orderCap").value),   busy: 0 },
    payment: { cap: 1,                             busy: 0 },
    kitchen: { cap: Number($("kitchenCap").value), busy: 0 },
    pickup:  { cap: 1,                             busy: 0 }
  };
}
