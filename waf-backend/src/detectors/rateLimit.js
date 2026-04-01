const requests = new Map();

const WINDOW_MS = 60000;  // 1 minute
const MAX_REQUESTS = 100; // max requests per window

function check(ip) {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Get or create request log for this IP
  if (!requests.has(ip)) {
    requests.set(ip, []);
  }

  const ipRequests = requests.get(ip);

  // Remove requests outside the window
  const recent = ipRequests.filter(ts => ts > windowStart);
  requests.set(ip, recent);

  // Check if limit exceeded
  if (recent.length >= MAX_REQUESTS) {
    return {
      limited: true,
      detected: true,
      type: "Rate Limit Breach",
      current: recent.length,
      max: MAX_REQUESTS,
      resetIn: Math.ceil((recent[0] + WINDOW_MS - now) / 1000),
    };
  }

  // Add current request timestamp
  recent.push(now);
  requests.set(ip, recent);

  return {
    limited: false,
    detected: false,
    current: recent.length,
    max: MAX_REQUESTS,
  };
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  for (const [ip, timestamps] of requests.entries()) {
    const recent = timestamps.filter(ts => ts > windowStart);
    if (recent.length === 0) requests.delete(ip);
    else requests.set(ip, recent);
  }
}, 5 * 60 * 1000);

module.exports = { check };