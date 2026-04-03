const buckets = new Map();

const WINDOW_SIZE_SEC = 60;   // 1 minute tracking
const MAX_TOKENS      = 100;  // max requests per window
const REFILL_RATE     = MAX_TOKENS / WINDOW_SIZE_SEC; // tokens per second

function check(ip) {
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
      current: Math.floor(MAX_TOKENS - bucket.tokens),
      max: MAX_REQUESTS,
      resetIn: Math.ceil((1 - bucket.tokens) / REFILL_RATE),
    };
  }

  // 3. Consume 1 token
  bucket.tokens -= 1;
  buckets.set(ip, bucket);

  return {
    limited: false,
    detected: false,
    current: Math.floor(MAX_TOKENS - bucket.tokens),
    max: MAX_REQUESTS,
  };
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

module.exports = { check };