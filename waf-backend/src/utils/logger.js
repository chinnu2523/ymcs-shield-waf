const logs = [];
const MAX_LOGS = 200;

function addLog(entry) {
  logs.unshift({
    ...entry,
    timestamp: new Date().toISOString(),
    time: new Date().toLocaleTimeString("en-US", { hour12: false }),
  });
  if (logs.length > MAX_LOGS) logs.pop();
}

function logBlocked(req, threat) {
  addLog({
    action:  "BLOCKED",
    type:    threat.type,
    ip:      req.ip || req.connection.remoteAddress,
    method:  req.method,
    path:    req.path,
    threat,
  });
}

function logAllowed(req) {
  addLog({
    action: "ALLOWED",
    ip:     req.ip || req.connection.remoteAddress,
    method: req.method,
    path:   req.path,
  });
}

function getLogs() {
  return logs;
}

module.exports = { logBlocked, logAllowed, getLogs };