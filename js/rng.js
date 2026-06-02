/**
 * rng.js
 * Seeded pseudo-random number generator and probability distributions.
 * Uses a linear congruential generator (LCG) for reproducibility.
 */

/** Create a seeded LCG RNG and return a function that yields [0, 1). */
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Active RNG instance – replaced on every reset. */
let rand = makeRng(sim.seed);

/** Exponential distribution: models interarrival times. */
function expRand(mean) {
  return -mean * Math.log(1 - rand() + 1e-9);
}

/**
 * Triangular distribution: models service times.
 * @param {number} a  Minimum value
 * @param {number} m  Mode (most likely value)
 * @param {number} b  Maximum value
 */
function triRand(a, m, b) {
  const u = rand();
  const c = (m - a) / (b - a);
  if (u < c) return a + Math.sqrt(u * (b - a) * (m - a));
  return b - Math.sqrt((1 - u) * (b - a) * (b - m));
}

/* ─── Derived Sampling Helpers ───────────────────────────────────────────── */

/** Current scenario shortcut. */
function scenario() {
  return SCENARIOS[sim.scenario];
}

/**
 * Draw a service-time sample for the given station, scaled by UI slider.
 * @param {"order"|"payment"|"kitchen"|"pickup"|"staging"} type
 */
function serviceTime(type) {
  const s     = scenario()[type];
  const scale = Number($("serviceScale").value) / 100;
  return triRand(s[0], s[1], s[2]) * scale;
}

/** Draw an exponential interarrival interval (minutes). */
function arrivalInterval() {
  const peak = $("peakMode").checked ? 1.75 : 1;
  const rate  = Number($("arrivalRate").value) * peak;
  return expRand(60 / rate);
}
