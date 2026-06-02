# DriveThruDES 🚗💨

`DriveThruDES` is a research-calibrated, interactive **Discrete Event Simulation (DES)** that models, analyzes, and visualizes fast-food drive-thru operations. It is designed to identify operational bottlenecks and evaluate optimization strategies (e.g., adding ordering stations, increasing kitchen capacity, or adjusting service rates).

---

## 📊 Research-Calibrated Baseline

The simulation parameters are calibrated against a real-world time study conducted across fast-food restaurants in Metro Manila, Philippines. The study established an average total transaction time of **6.27 minutes** split across four core stages:

| Stage | Mean Duration (min) | % of Total Time | Description |
| :--- | :---: | :---: | :--- |
| **Ordering** | 2.42 min | 38.6% | Customer places their order at the speaker. |
| **Payment** | 0.46 min | 7.3% | Cashier processes payment at the window. |
| **Waiting for Order** | 3.06 min | 48.8% | Food preparation and staging in the kitchen (Primary Bottleneck). |
| **Claiming / Pickup** | 0.33 min | 5.3% | Food is handed to the customer at the final window. |
| **TOTAL** | **6.27 min** | **100.0%** | Average total time spent in the drive-thru system. |

> [!IMPORTANT]
> **Key Operational Insight:** The **Waiting for Order (Kitchen)** phase is the primary bottleneck. Because drive-thrus operate as a single-line vehicle stream, a single complex order stalls all upstream customers, causing cascading delays.

---

## 🌟 Core Features

- **Discrete Event Simulation Engine:** Built on a priority queue dispatching events (e.g., `ARRIVAL`, `ORDER_START`, `ORDER_FINISHED`, `PAYMENT_START`, `PAYMENT_FINISHED`, `KITCHEN_START`, `KITCHEN_FINISHED`, `PICKUP_START`, `DEPARTURE`).
- **Dynamic 2D Canvas Visualization:** Animates vehicle movement in real time through the lane, order speakers, payment windows, kitchen queue, and pickup window.
- **Interactive Controls:**
  - Adjust simulation speed (1x to 10x) and set custom random seeds for reproducible runs.
  - Tune demand (vehicles/hour) and toggle a **Peak Hour Multiplier**.
  - Configure capacities (Order Stations, Kitchen Crews, Waiting Queue limits, and Service Scale multipliers).
- **Real-Time Analytics & Charts:**
  - Live metric cards (Average Cycle Time, Average Wait Time, Current Queue, Served, Throughput, and Long Delays >8 min).
  - Live-utilization progress bars for each station.
  - Interactive history charts (Queue History and Cycle Time Trend) with tooltips.
  - Automated **Bottleneck Detection** alerts.
- **Scenario Presets:**
  - **Current Layout (Baseline):** The default calibrated layout (1 Order Station, 1 Kitchen Crew) resulting in a ~6.27 min cycle.
  - **Lunch Rush:** Higher arrival rate (28 cars/hour) and service degradation.
  - **Overloaded:** Extreme demand (44 cars/hour) leading to critical delays.
  - **Improved Layout (Optimized):** 2 Order Stations and 2 Kitchen Crews, reducing the average cycle time by ~43% to 3.57 minutes.

---

## 🗂️ Project Structure

The project is structured as a clean, modular static web application:

```text
├── index.html          # Main HTML5 layout & bootstrap structure
├── css/
│   ├── variables.css   # Color palette (HSL) & design system tokens
│   ├── base.css        # Reset, typography, scrollbars, and keyframes
│   ├── layout.css      # Grid structures, sidebar, and main panels
│   ├── controls.css    # Interactive buttons, inputs, sliders, and toggles
│   └── metrics.css     # Live metrics, utilization bars, and charts layout
└── js/
    ├── main.js         # Bootstrap initializer & DOM selector utility ($)
    ├── scenarios.js    # Predefined scenario configuration parameters
    ├── state.js        # Central simulation state object (sim)
    ├── rng.js          # LCG-based random number generator (for exponential/triangular distributions)
    ├── logger.js       # Live system event logger
    ├── layout.js       # Canvas geometry, node coordinate mapping, and car spawns
    ├── events.js       # Core DES event handlers & event queue processing
    ├── simulation.js   # Simulation loop (rAF) and start/pause/reset controls
    ├── renderer.js     # 2D canvas drawing (roads, buildings, vehicles, labels)
    ├── charts.js       # Custom canvas chart rendering & hover interaction logic
    ├── metrics.js      # Statistical aggregations & bottleneck determination
    │── ui.js           # Event listeners & UI synchronisation
```

---

## 🚀 How to Run

Since `DriveThruDES` is written entirely in Vanilla JS/HTML/CSS without heavy external dependencies, you can run it instantly:

1. **Directly in Browser:**
   Simply double-click `index.html` or open it in any modern browser.
   
2. **Via Local Server (Recommended):**
   To ensure smooth asset loading, serve it using a lightweight local web server:
   - **VS Code:** Install the *Live Server* extension and click **Go Live**.
   - **Python:** Run `python -m http.server 8000` in the directory, then navigate to `http://localhost:8000`.
   - **Node.js:** Run `npx serve` or `npm install -g serve` and run `serve`.

---

## 🎲 Simulation Engine Details

### Probability Distributions
The simulation uses research-validated random distributions to model real-world variability:
- **Vehicle Arrivals:** Modeled using an **exponential distribution** based on the configured vehicles-per-hour rate, representing memoryless Poisson arrivals.
- **Service Times:** Modeled using a **triangular distribution** `[min, mode, max]` customized for each scenario. This allows realistic representation of service times, capturing both fast transactions (lower bound) and heavy order delays (upper bound).