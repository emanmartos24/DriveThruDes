/**
 * scenarios.js
 * Research-calibrated DES scenario presets.
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  CALIBRATION SOURCE
 * ═══════════════════════════════════════════════════════════════════════
 *  Time study conducted across fast-food restaurants in Metro Manila,
 *  Philippines. Average total transaction time: 6.27 minutes.
 *
 *    Stage              │ Mean (min) │  % of Total
 *    ───────────────────┼────────────┼────────────
 *    Ordering           │   2.42     │   38.6%
 *    Payment            │   0.46     │    7.3%
 *    Waiting for order  │   3.06     │   48.8%
 *    Claiming / Pickup  │   0.33     │    5.3%
 *    ───────────────────┼────────────┼────────────
 *    TOTAL              │   6.27     │  100.0%
 *
 *  Key insight: the "Waiting for order" phase is the longest and the
 *  primary bottleneck — caused by single-line vehicle streams where a
 *  large/complex order blocks all upstream customers.
 *
 *  The "kitchen" parameter below combines food preparation + staging
 *  into a single service time, matching the study's "Waiting for order"
 *  measurement (3.06 min mean).
 *
 *  Triangular distribution parameters [min, mode, max] are set so
 *  the mode equals the study mean and min/max capture ±30-40%
 *  variability observed in real drive-thru operations.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Each scenario defines demand, resource configuration, target cycle time,
 * and triangular distribution parameters [min, mode, max] for each service stage.
 */

const SCENARIOS = {
  baseline: {
    label: "Current Layout",
    arrivalRate: 18, peakMode: false,
    orderCap: 1, kitchenCap: 1, queueCap: 10, serviceScale: 100,
    target: 6.27,
    // Ordering: mean 2.42 min — significant bottleneck, high variability
    order:   [1.70, 2.42, 3.35],
    // Payment: mean 0.46 min — quick, low variability
    payment: [0.28, 0.46, 0.72],
    // Kitchen (waiting for order): mean 3.06 min — LONGEST phase
    // Single-line stream means one complex order blocks everyone
    kitchen: [2.10, 3.06, 4.25],
    // Claiming/Pickup: mean 0.33 min — fastest stage
    pickup:  [0.18, 0.33, 0.55],
    // Staging (internal kitchen buffer) — absorbed into kitchen time
    staging: [0.00, 0.00, 0.00]
  },
  peak: {
    label: "Lunch Rush",
    arrivalRate: 28, peakMode: true,
    orderCap: 1, kitchenCap: 1, queueCap: 10, serviceScale: 110,
    target: 6.27,
    // Under peak load, service times degrade ~10-15%
    order:   [1.85, 2.65, 3.70],
    payment: [0.32, 0.52, 0.80],
    kitchen: [2.35, 3.40, 4.75],
    pickup:  [0.22, 0.38, 0.62],
    staging: [0.00, 0.00, 0.00]
  },
  overload: {
    label: "Overloaded",
    arrivalRate: 44, peakMode: true,
    orderCap: 1, kitchenCap: 1, queueCap: 8, serviceScale: 118,
    target: 6.27,
    // Under extreme load, service times degrade ~20-25%
    order:   [2.05, 2.95, 4.10],
    payment: [0.38, 0.58, 0.90],
    kitchen: [2.65, 3.85, 5.35],
    pickup:  [0.28, 0.45, 0.72],
    staging: [0.00, 0.00, 0.00]
  },
  optimized: {
    label: "Improved Layout",
    arrivalRate: 24, peakMode: false,
    orderCap: 2, kitchenCap: 2, queueCap: 14, serviceScale: 100,
    // 43% reduction from 6.27 → 3.57 min
    // Ordering: 2.42 × 0.57 ≈ 1.38
    // Payment:  0.46 × 0.57 ≈ 0.26
    // Kitchen:  3.06 × 0.57 ≈ 1.74
    // Pickup:   0.33 × 0.57 ≈ 0.19
    target: 3.57,
    order:   [0.90, 1.38, 1.95],
    payment: [0.15, 0.26, 0.42],
    kitchen: [1.15, 1.74, 2.50],
    pickup:  [0.10, 0.19, 0.35],
    staging: [0.00, 0.00, 0.00]
  }
};
