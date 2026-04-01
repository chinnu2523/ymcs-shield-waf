const axios = require("axios");

const BASE_URL = "http://localhost:4000";

const ATTACK_VECTORS = [
  { name: "SQL Injection", path: "/api/users?id=1%20OR%201=1" },
  { name: "XSS Payload",   path: "/api/data", method: "post", data: { comment: "<script>alert('xss')</script>" } },
  { name: "Path Traversal", path: "/api/data?file=../../etc/passwd" },
  { name: "Command Inj.",  path: "/api/data?cmd=ls%20-la" },
  { name: "NoSQL Inj.",    path: "/api/users", method: "post", data: { username: { "$gt": "" } } }
];

const SAFE_PATHS = [
  "/health",
  "/api/users",
  "/api/data",
  "/api/stats",
  "/"
];

function getRandomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

async function sendRequest() {
  const isAttack = Math.random() > 0.7;
  let config = {
    headers: { "X-Forwarded-For": getRandomIP() },
    validateStatus: () => true
  };

  if (isAttack) {
    const vector = ATTACK_VECTORS[Math.floor(Math.random() * ATTACK_VECTORS.length)];
    config.method = vector.method || "get";
    config.url = BASE_URL + vector.path;
    config.data = vector.data;
    console.log(`[ATTACK] Sending ${vector.name}...`);
  } else {
    const path = SAFE_PATHS[Math.floor(Math.random() * SAFE_PATHS.length)];
    config.method = "get";
    config.url = BASE_URL + path;
    console.log(`[SAFE]   Fetching ${path}...`);
  }

  try {
    const res = await axios(config);
    const statusColor = res.status < 400 ? "\x1b[32m" : "\x1b[31m";
    console.log(`         Result: ${statusColor}${res.status}\x1b[0m\n`);
  } catch (err) {
    console.error(`         Error: ${err.message}\n`);
  }
}

console.log("\x1b[36m%s\x1b[0m", "🚀 Quantum WAF Live Traffic Generator Started");
console.log("Press Ctrl+C to stop.\n");

// Send a request every 1-3 seconds
function loop() {
  sendRequest();
  const nextDelay = Math.random() * 2000 + 1000;
  setTimeout(loop, nextDelay);
}

loop();
