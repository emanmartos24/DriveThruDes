/**
 * logger.js
 * Event log panel: append log entries and auto-trim.
 */

const MAX_LOG_ENTRIES = 90;

/** Format a simulation time in HH:MM:SS. */
function formatSimTime(minutes = sim.time) {
  const totalSeconds = Math.max(0, Math.floor(minutes * 60));
  const hours = Math.floor(totalSeconds / 3600);
  const mins  = Math.floor((totalSeconds % 3600) / 60);
  const secs  = totalSeconds % 60;
  return String(hours).padStart(2, "0") + ":" + String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

/**
 * Append a new entry to the event log panel.
 * @param {"arr"|"dep"|"warn"|"err"} type  Log entry colour class
 * @param {string}                   msg   Message text
 */
function log(type, msg) {
  const row  = document.createElement("div");
  row.className = "log-entry " + type;

  row.innerHTML = `<span class="log-time">${formatSimTime()}</span><span class="log-msg">${msg}</span>`;

  $("logBody").appendChild(row);

  // Keep log from growing unbounded
  while ($("logBody").children.length > MAX_LOG_ENTRIES) {
    $("logBody").removeChild($("logBody").firstChild);
  }

  $("logBody").scrollTop = $("logBody").scrollHeight;
}
