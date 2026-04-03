const crypto = require("crypto");
const isWorker = process.send !== undefined; // Detects if running as a cluster worker

const buckets = new Map();

const WINDOW_SIZE_SEC = 120;  // 2 minute tracking
const MAX_TOKENS      = 200;  // max requests per window
const REFILL_RATE     = MAX_TOKENS / WINDOW_SIZE_SEC; // tokens per second

function checkLocal(ip) {
  // Never rate-limit localhost in development — allows tests to run freely
  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.")) {
    return { limited: false, detected: false, current: 0, max: MAX_TOKENS };
  }

  const now = Date.now() / 1000; // time in seconds

  if (!buckets.has(ip)) {
    buckets.set(ip, {
      tokens: MAX_TOKENS,
      lastRefill: now
    });
  }

  const bucket = buckets.get(ip);
  
  // 1. Refill tokens based on time elapsed
  const delta = now - bucket.lastRefill;
  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + delta * REFILL_RATE);
  bucket.lastRefill = now;

  // 2. Check if bucket has tokens
  if (bucket.tokens < 1) {
    return {
      limited: true,
      detected: true,
      type: "Rate Limit Breach",
      explanation: "HTTP Traffic Flood Detected",
      current: Math.floor(MAX_TOKENS - bucket.tokens),
      max: MAX_TOKENS,
      resetIn: Math.ceil((1 - bucket.tokens) / REFILL_RATE),
    };
  }

  // 3. Consume 1 token
  bucket.tokens -= 1;
  return {
    limited: false,
    current: Math.floor(MAX_TOKENS - bucket.tokens),
    max: MAX_TOKENS
  };
}

async function checkAsync(ip) {
  // If not in a worker cluster, just run local memory algorithm
  if (!isWorker) return checkLocal(ip);

  // Send to Master node for consolidated check
  return new Promise(resolve => {
    const msgId = crypto.randomUUID();
    
    // Create IPC listener
    const handler = (msg) => {
      if (msg && msg.type === "RATELIMIT_RES" && msg.id === msgId) {
        process.removeListener("message", handler);
        resolve(msg.result);
      }
    };
    process.on("message", handler);
    process.send({ type: "RATELIMIT_REQ", id: msgId, ip });
    
    // Failsafe timeout 50ms - if IPC fails, allow request through to prevent deadlocks
    setTimeout(() => {
      process.removeListener("message", handler);
      resolve({ limited: false, current: 0, max: MAX_TOKENS });
    }, 50);
  });
}

function clearState() {
  buckets.clear();
}

// Clean up inactive buckets every 10 minutes
setInterval(() => {
  const now = Date.now() / 1000;
  for (const [ip, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > WINDOW_SIZE_SEC * 2) {
      buckets.delete(ip);
    }
  }
}, 10 * 60 * 1000);

module.exports = { checkLocal, checkAsync, clearState };