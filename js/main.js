/**
 * main.js
 * Application entry point.
 * Runs after all scripts are loaded; bootstraps the simulation.
 */

/** Shorthand DOM selector used throughout the codebase. */
const $ = (id) => document.getElementById(id);

window.addEventListener("resize", () => {
  if (typeof resize === "function") resize();
});

window.addEventListener("load", () => {
  bind();            // Attach all UI event listeners
  resetStats();      // Zero out stats object
  initResources();   // Build resource pools from default slider values
  resize();          // Size canvas and compute layout
  applyScenario("baseline");   // Load the default scenario
  log("arr", "Drive-thru DES ready. Press Start to begin.");
});
