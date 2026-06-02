/**
 * simulation.js
 * High-level simulation lifecycle: start, pause, reset, main animation loop.
 */

/* ─── Animation Loop ─────────────────────────────────────────────────────── */

/**
 * Main rAF loop.
 * Advances DES time, interpolates car positions, cleans up departed cars,
 * then triggers UI/canvas refresh.
 */
function loop(ts) {
  if (!sim.running || sim.paused) return;

  const dt = Math.min((ts - sim.lastFrame) / 1000, 0.12);
  sim.lastFrame = ts;

  // Advance DES
  processEvents(dt * 0.65 * sim.speed);

  // Smooth-lerp car positions
  sim.cars.forEach(car => {
    car.x += (car.tx - car.x) * Math.min(1, dt * 3.4 * Math.sqrt(sim.speed));
    car.y += (car.ty - car.y) * Math.min(1, dt * 3.4 * Math.sqrt(sim.speed));
  });

  // Remove cars that have scrolled off-canvas
  sim.cars.forEach((car, id) => {
    if (car.state === "departing" && car.x > canvas.width + 60) {
      car.state = "departed";
      sim.cars.delete(id);
    }
  });

  updateMetrics();
  draw();
  drawCharts();
  sim.anim = requestAnimationFrame(loop);
}

/* ─── Lifecycle Controls ─────────────────────────────────────────────────── */

/** Start or resume the simulation. */
function start() {
  if (sim.running && !sim.paused) return;
  if (!sim.running) {
    sim.running = true;
    schedule(arrivalInterval(), "ARRIVAL");
    log("arr", "Simulation started using exponential interarrival times");
  }
  sim.paused    = false;
  sim.lastFrame = performance.now();

  $("startBtn").disabled      = true;
  $("pauseBtn").disabled      = false;
  $("pauseBtn").textContent   = "Pause";
  $("pauseBtn").className     = "btn warn";
  $("statusDot").className    = "dot running";
  $("statusText").textContent = "Running";

  sim.anim = requestAnimationFrame(loop);
}

/** Toggle pause / resume. */
function pause() {
  if (!sim.running) return;
  sim.paused = !sim.paused;
  if (sim.paused) {
    cancelAnimationFrame(sim.anim);
    $("pauseBtn").textContent   = "Resume";
    $("pauseBtn").className     = "btn primary";
    $("statusDot").className    = "dot paused";
    $("statusText").textContent = "Paused";
  } else {
    $("pauseBtn").textContent   = "Pause";
    $("pauseBtn").className     = "btn warn";
    $("statusDot").className    = "dot running";
    $("statusText").textContent = "Running";
    sim.lastFrame = performance.now();
    cancelAnimationFrame(sim.anim);
    sim.anim = requestAnimationFrame(loop);
  }
}

/** Full reset: clear state, reinitialise resources, redraw. */
function reset(keepLog) {
  cancelAnimationFrame(sim.anim);
  sim.running    = false;
  sim.paused     = false;
  sim.time       = 0;
  sim.events     = [];
  sim.nextId     = 1;
  sim.cars       = new Map();
  sim.queues     = { order: [], payment: [], kitchen: [], pickup: [] };
  sim.history    = { t: [], queue: [], cycle: [] };

  rand = makeRng(Number($("seed").value));
  resetStats();
  initResources();

  $("startBtn").disabled      = false;
  $("pauseBtn").disabled      = true;
  $("pauseBtn").textContent   = "Pause";
  $("pauseBtn").className     = "btn warn";
  $("statusDot").className    = "dot";
  $("statusText").textContent = "Idle";
  $("simClock").textContent   = "00:00";
  $("congestionWarn").classList.remove("visible");
  $("bottleneckCard").classList.remove("visible");

  if (!keepLog) $("logBody").innerHTML = "";

  updateMetrics();
  draw();
  drawCharts();
}
