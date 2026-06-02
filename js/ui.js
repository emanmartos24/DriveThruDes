/**
 * ui.js
 * Wires up all DOM event listeners (buttons, sliders, toggles, presets).
 * Also handles scenario preset application.
 */

/* ─── Scenario Preset Application ────────────────────────────────────────── */

/**
 * Load a named scenario preset into the UI controls and reset the sim.
 * @param {string} name  Key in SCENARIOS
 */
function applyScenario(name) {
  sim.scenario = name;
  const s = scenario();

  $("arrivalRate").value  = s.arrivalRate;  $("arrivalVal").textContent     = s.arrivalRate;
  $("peakMode").checked   = s.peakMode;
  $("orderCap").value     = s.orderCap;     $("orderCapVal").textContent    = s.orderCap;
  $("kitchenCap").value   = s.kitchenCap;   $("kitchenCapVal").textContent  = s.kitchenCap;
  $("queueCap").value     = s.queueCap;     $("queueCapVal").textContent    = s.queueCap;
  $("serviceScale").value = s.serviceScale; $("serviceScaleVal").textContent= s.serviceScale + "%";

  reset(false);
  log("warn", `${s.label} loaded. Target transaction time: ${s.target.toFixed(2)} minutes.`);
}

/* ─── DOM Binding ────────────────────────────────────────────────────────── */

/** Attach all event listeners. Called once on window load. */
function bind() {
  // Simulation lifecycle buttons
  $("startBtn").addEventListener("click", start);
  $("pauseBtn").addEventListener("click", pause);
  $("resetBtn").addEventListener("click", () => { reset(false); log("warn", "Simulation reset."); });
  $("clearLog").addEventListener("click", () => $("logBody").innerHTML = "");

  // Speed & seed sliders
  $("speed").addEventListener("input", e => {
    sim.speed = Number(e.target.value);
    $("speedVal").textContent = sim.speed + "x";
  });
  $("seed").addEventListener("input", e => {
    $("seedVal").textContent = e.target.value;
  });

  // Parameter sliders (with live value display)
  ["arrivalRate", "orderCap", "kitchenCap", "queueCap", "serviceScale"].forEach(id => {
    $(id).addEventListener("input", e => {
      const suffix = id === "serviceScale" ? "%" : "";
      $(id + "Val").textContent = e.target.value + suffix;
      if (id === "orderCap" || id === "kitchenCap") initResources();
    });
  });

  // Peak mode toggle
  $("peakMode").addEventListener("change", () =>
    log("warn", $("peakMode").checked
      ? "Peak demand multiplier enabled."
      : "Peak demand multiplier disabled.")
  );

  // Scenario preset buttons
  document.querySelectorAll(".preset").forEach(btn =>
    btn.addEventListener("click", () => applyScenario(btn.dataset.preset))
  );

  // Chart hover tooltips
  bindChartHover($("queueChart"), () => sim.history.queue, "Queue",     "cars");
  bindChartHover($("cycleChart"), () => sim.history.cycle, "Avg cycle", "min");
}
