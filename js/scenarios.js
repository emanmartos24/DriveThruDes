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
 *
 *  CALIBRATION NOTE:
 *  Because the study measurements represent total stage durations (which
 *  include real-world queueing/waiting delays), using them directly as
 *  service times in a DES would double-count queueing, causing simulated
 *  transaction times to inflate. To calibrate the simulation so that
 *  the average cycle time under the Current Layout (baseline) stabilizes
 *  at the study's observed 6.27 minutes, the raw service times for
 *  baseline, peak, and overload are scaled by 0.69.
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
    threshold: 4.85,
    // Calibrated: original [1.70, 2.42, 3.35] * 0.69
    order: [1.17, 1.67, 2.31],
    // Calibrated: original [0.28, 0.46, 0.72] * 0.69
    payment: [0.19, 0.32, 0.50],
    // Calibrated: original [2.10, 3.06, 4.25] * 0.69
    kitchen: [1.45, 2.11, 2.93],
    // Calibrated: original [0.18, 0.33, 0.55] * 0.69
    pickup: [0.12, 0.23, 0.38],
    staging: [0.00, 0.00, 0.00]
  },
  peak: {
    label: "Lunch Rush",
    arrivalRate: 28, peakMode: true,
    orderCap: 1, kitchenCap: 1, queueCap: 10, serviceScale: 110,
    target: 6.27,
    threshold: 4.85,
    // Calibrated: original [1.85, 2.65, 3.70] * 0.69
    order: [1.28, 1.83, 2.55],
    // Calibrated: original [0.32, 0.52, 0.80] * 0.69
    payment: [0.22, 0.36, 0.55],
    // Calibrated: original [2.35, 3.40, 4.75] * 0.69
    kitchen: [1.62, 2.35, 3.28],
    // Calibrated: original [0.22, 0.38, 0.62] * 0.69
    pickup: [0.15, 0.26, 0.43],
    staging: [0.00, 0.00, 0.00]
  },
  overload: {
    label: "Overloaded",
    arrivalRate: 44, peakMode: true,
    orderCap: 1, kitchenCap: 1, queueCap: 8, serviceScale: 118,
    target: 6.27,
    threshold: 4.85,
    // Calibrated: original [2.05, 2.95, 4.10] * 0.69
    order: [1.42, 2.04, 2.83],
    // Calibrated: original [0.38, 0.58, 0.90] * 0.69
    payment: [0.26, 0.40, 0.62],
    // Calibrated: original [2.65, 3.85, 5.35] * 0.69
    kitchen: [1.83, 2.66, 3.69],
    // Calibrated: original [0.28, 0.45, 0.72] * 0.69
    pickup: [0.19, 0.31, 0.50],
    staging: [0.00, 0.00, 0.00]
  },
  optimized: {
    label: "Improved Layout",
    arrivalRate: 24, peakMode: false,
    orderCap: 2, kitchenCap: 2, queueCap: 14, serviceScale: 100,
    // 52% remaining from 6.27 → 3.27 min
    // Calibrated: original [0.90, 1.38, 1.95] * 0.92
    target: 3.27,
    threshold: 4.35,
    order: [0.83, 1.27, 1.79],
    payment: [0.14, 0.24, 0.39],
    kitchen: [1.06, 1.60, 2.30],
    pickup: [0.09, 0.17, 0.32],
    staging: [0.00, 0.00, 0.00]
  }
};
